import { ProfileModel } from '../profile/profile.model';
import InvoiceModel from './invoice.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import type { IProfile } from '../profile/profile.types';
import type { IInvoice } from './invoice.model';
import { Types } from 'mongoose';

/**
 * Servicio para procesar pagos confirmados y actualizar perfiles
 */
export class PaymentProcessorService {

  /**
   * Limpia upgrades expirados y elimina duplicados del mismo tipo
   * Mantiene solo el upgrade más reciente de cada tipo
   */
  private static cleanUpgrades(profile: IProfile): void {
    const now = new Date();
    const upgradeMap = new Map<string, any>();

    // Filtrar upgrades expirados y mantener solo el más reciente de cada tipo
    for (const upgrade of profile.upgrades) {
      // Saltar upgrades expirados
      if (upgrade.endAt <= now) {
        continue;
      }

      const existing = upgradeMap.get(upgrade.code);

      // Si no existe o el actual es más reciente, guardarlo
      if (!existing || upgrade.purchaseAt > existing.purchaseAt) {
        upgradeMap.set(upgrade.code, upgrade);
      }
    }

    // Reemplazar el array de upgrades con los upgrades limpios
    profile.upgrades = Array.from(upgradeMap.values());
  }

  /**
   * Procesa una factura pagada y actualiza el perfil correspondiente
   * @param invoiceId - ID de la factura pagada
   */
  static async processInvoicePayment(invoiceId: string): Promise<{
    success: boolean;
    profile?: IProfile;
    message: string;
  }> {
    try {
      // Obtener la factura
      const invoice = await InvoiceModel.findById(invoiceId);
      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      // Verificar que la factura esté pagada
      if (invoice.status !== 'paid') {
        throw new Error('La factura no está marcada como pagada');
      }

      // Obtener el perfil
      const profile = await ProfileModel.findById(invoice.profileId);
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }

      // Procesar cada item de la factura
      for (const item of invoice.items) {
        if (item.type === 'plan') {
          await this.processPlanPayment(profile, item);
        } else if (item.type === 'upgrade') {
          await this.processUpgradePayment(profile, item);
        }
      }

      // Activar y hacer visible el perfil después del pago confirmado
      profile.isActive = true;
      profile.visible = true;  // Hacer visible el perfil al confirmar pago
      await profile.save();

      return {
        success: true,
        profile,
        message: 'Pago procesado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error procesando pago de factura:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Procesa el pago de un plan y actualiza la asignación del perfil
   * NUEVO FLUJO: Ahora asigna el plan comprado reemplazando el plan actual
   */
  private static async processPlanPayment(profile: IProfile, planItem: any): Promise<void> {
    console.log(`📦 Procesando pago de plan ${planItem.code}`);

    // Obtener definición del plan
    const plan = await PlanDefinitionModel.findOne({ code: planItem.code });
    if (!plan) {
      throw new Error(`Plan ${planItem.code} no encontrado`);
    }

    // Calcular fechas
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planItem.days);

    // NUEVO FLUJO: Asignar el plan comprado (reemplaza el plan Amatista por defecto)
    profile.planAssignment = {
      planId: plan._id as Types.ObjectId,           // Referencia al _id del plan
      planCode: planItem.code,    // Mantener para compatibilidad
      variantDays: planItem.days,
      startAt: now,
      expiresAt: expiresAt
    };

    // Limpiar upgrades expirados y duplicados antes de procesar
    this.cleanUpgrades(profile);

    // Agregar automáticamente los upgrades incluidos en el plan
    if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
      for (const upgradeCode of plan.includedUpgrades) {
        // Obtener definición del upgrade para usar su durationHours
        const upgradeDefinition = await UpgradeDefinitionModel.findOne({ code: upgradeCode });

        if (!upgradeDefinition) {
          console.warn(`⚠️ Upgrade ${upgradeCode} incluido en plan no encontrado`);
          continue;
        }

        // Calcular fecha de expiración basada en durationHours del upgrade
        const upgradeEndAt = new Date(now.getTime() + (upgradeDefinition.durationHours * 60 * 60 * 1000));

        // Buscar si ya existe un upgrade del mismo tipo (activo o no)
        const existingUpgradeIndex = profile.upgrades.findIndex(
          upgrade => upgrade.code === upgradeCode
        );

        if (existingUpgradeIndex !== -1) {
          // Si existe, reemplazarlo con el nuevo (sin importar si está activo o expirado)
          profile.upgrades[existingUpgradeIndex] = {
            code: upgradeCode,
            startAt: now,
            endAt: upgradeEndAt,
            purchaseAt: now
          };
          console.log(`🔄 Upgrade ${upgradeCode} reemplazado en perfil`);
        } else {
          // Agregar el upgrade incluido en el plan con su duración correcta
          const newUpgrade = {
            code: upgradeCode,
            startAt: now,
            endAt: upgradeEndAt,
            purchaseAt: now
          };
          profile.upgrades.push(newUpgrade);
          console.log(`➕ Upgrade ${upgradeCode} agregado al perfil`);
        }
      }
    }

    console.log(`✅ Plan ${planItem.code} asignado al perfil ${profile._id}, reemplazando plan anterior`);
  }

  /**
   * Procesa el pago de un upgrade y lo aplica al perfil
   */
  private static async processUpgradePayment(profile: IProfile, upgradeItem: any): Promise<void> {
    console.log(`⚡ Procesando pago de upgrade ${upgradeItem.code}`);

    // Limpiar upgrades expirados y duplicados antes de procesar
    this.cleanUpgrades(profile);

    // Obtener definición del upgrade
    const upgrade = await UpgradeDefinitionModel.findOne({ code: upgradeItem.code });
    if (!upgrade) {
      throw new Error(`Upgrade ${upgradeItem.code} no encontrado`);
    }

    const now = new Date();
    const endAt = new Date(now.getTime() + (upgrade.durationHours * 60 * 60 * 1000));

    // Buscar si ya existe un upgrade del mismo tipo (sin importar si está activo)
    const existingUpgradeIndex = profile.upgrades.findIndex(
      u => u.code === upgradeItem.code
    );

    if (existingUpgradeIndex !== -1) {
      // Reemplazar el upgrade existente con el nuevo
      profile.upgrades[existingUpgradeIndex] = {
        code: upgradeItem.code,
        startAt: now,
        endAt,
        purchaseAt: now
      };
      console.log(`🔄 Upgrade ${upgradeItem.code} reemplazado`);
    } else {
      // Agregar nuevo upgrade
      const newUpgrade = {
        code: upgradeItem.code,
        startAt: now,
        endAt,
        purchaseAt: now
      };
      profile.upgrades.push(newUpgrade);
      console.log(`➕ Upgrade ${upgradeItem.code} agregado`);
    }
  }

  /**
   * Procesa una factura cancelada o expirada
   * @param invoiceId - ID de la factura cancelada/expirada
   */
  static async processInvoiceCancellation(invoiceId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log(`❌ Procesando cancelación de factura ${invoiceId}`);

      const invoice = await InvoiceModel.findById(invoiceId);
      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      const profile = await ProfileModel.findById(invoice.profileId);
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }

      // NUEVO FLUJO: Al cancelar factura, mantener plan actual (Amatista) y reactivar perfil
      // El perfil ya tiene plan Amatista asignado, solo necesitamos reactivarlo
      console.log(`🔄 Reactivando perfil ${profile._id} con plan actual: ${profile.planAssignment?.planCode}`);

      // Reactivar el perfil (ya que tiene un plan válido - Amatista)
      profile.isActive = true;

      // Mantener visible=false hasta que pase verificaciones si corresponde
      // (esto depende de la lógica de verificaciones del sistema)

      await profile.save();

      console.log(`✅ Perfil ${profile._id} reactivado con plan ${profile.planAssignment?.planCode} después de cancelación`);

      return {
        success: true,
        message: 'Cancelación procesada exitosamente - perfil reactivado con plan actual'
      };

    } catch (error) {
      console.error('❌ Error procesando cancelación de factura:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

export default PaymentProcessorService;