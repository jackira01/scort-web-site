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

    // Agregar automáticamente los upgrades incluidos en el plan
    if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
      for (const upgradeCode of plan.includedUpgrades) {
        // Verificar si el upgrade ya existe y está activo
        const existingUpgrade = profile.upgrades.find(
          upgrade => upgrade.code === upgradeCode && upgrade.endAt > now
        );

        if (!existingUpgrade) {
          // Agregar el upgrade incluido en el plan
          const newUpgrade = {
            code: upgradeCode,
            startAt: now,
            endAt: expiresAt, // Los upgrades del plan duran lo mismo que el plan
            purchaseAt: now
          };

          profile.upgrades.push(newUpgrade);
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

    // Obtener definición del upgrade
    const upgrade = await UpgradeDefinitionModel.findOne({ code: upgradeItem.code });
    if (!upgrade) {
      throw new Error(`Upgrade ${upgradeItem.code} no encontrado`);
    }

    const now = new Date();
    const endAt = new Date(now.getTime() + (upgrade.durationHours * 60 * 60 * 1000));

    // Verificar si ya existe un upgrade activo del mismo tipo
    const existingUpgradeIndex = profile.upgrades.findIndex(
      u => u.code === upgradeItem.code && u.endAt > now
    );

    // Aplicar stacking policy
    switch (upgrade.stackingPolicy) {
      case 'replace':
        if (existingUpgradeIndex !== -1) {
          profile.upgrades.splice(existingUpgradeIndex, 1);
        }
        break;

      case 'extend':
        if (existingUpgradeIndex !== -1) {
          const existingUpgrade = profile.upgrades[existingUpgradeIndex];
          existingUpgrade.endAt = new Date(existingUpgrade.endAt.getTime() + (upgrade.durationHours * 60 * 60 * 1000));
          return; // No agregar nuevo upgrade, solo extender
        }
        break;

      case 'reject':
        if (existingUpgradeIndex !== -1) {
          return; // No hacer nada si ya existe
        }
        break;
    }

    // Agregar nuevo upgrade
    const newUpgrade = {
      code: upgradeItem.code,
      startAt: now,
      endAt,
      purchaseAt: now
    };

    profile.upgrades.push(newUpgrade);
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