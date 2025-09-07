import mongoose from 'mongoose';
import Invoice, { type IInvoice, type InvoiceItem } from './invoice.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';

export interface CreateInvoiceData {
  profileId: string;
  userId: string;
  planCode?: string;
  planDays?: number;
  upgradeCodes?: string[];
  notes?: string;
}

export interface InvoiceFilters {
  _id?: string;
  profileId?: string;
  userId?: string;
  status?: 'pending' | 'paid' | 'cancelled' | 'expired';
  fromDate?: Date;
  toDate?: Date;
}

class InvoiceService {
  /**
   * Genera una nueva factura basada en el plan y upgrades seleccionados
   */
  async generateInvoice(data: CreateInvoiceData): Promise<IInvoice> {
    const { profileId, userId, planCode, planDays, upgradeCodes = [], notes } = data;

    console.log('🟠 [INVOICE SERVICE] Iniciando generación de factura:', {
      profileId,
      userId,
      planCode,
      planDays,
      upgradeCodes,
      notes
    });

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      console.error('❌ [INVOICE SERVICE] ID de perfil inválido:', profileId);
      throw new Error('ID de perfil inválido');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ [INVOICE SERVICE] ID de usuario inválido:', userId);
      throw new Error('ID de usuario inválido');
    }
    console.log('✅ [INVOICE SERVICE] IDs validados correctamente');

    const items: InvoiceItem[] = [];
    let totalAmount = 0;

    // Agregar plan si se especifica
    if (planCode && planDays) {
      console.log('🟠 [INVOICE SERVICE] Procesando plan para factura:', { planCode, planDays });
      const plan = await PlanDefinitionModel.findByCode(planCode);
      if (!plan) {
        console.error('❌ [INVOICE SERVICE] Plan no encontrado:', planCode);
        throw new Error(`Plan con código ${planCode} no encontrado`);
      }
      console.log('✅ [INVOICE SERVICE] Plan encontrado:', { name: plan.name, code: plan.code });

      const variant = plan.variants.find((v: any) => v.days === planDays);
      if (!variant) {
        console.error('❌ [INVOICE SERVICE] Variante no encontrada:', { planCode, planDays });
        throw new Error(`Variante de ${planDays} días no encontrada para el plan ${planCode}`);
      }
      console.log('✅ [INVOICE SERVICE] Variante encontrada:', { days: variant.days, price: variant.price });

      const planItem: InvoiceItem = {
        type: 'plan' as const,
        code: planCode,
        name: plan.name,
        days: planDays,
        price: variant.price,
        quantity: 1
      };
      items.push(planItem);
      totalAmount += variant.price;

      console.log('✅ [INVOICE SERVICE] Item de plan agregado:', planItem);
    }

    // Agregar upgrades si se especifican
    if (upgradeCodes.length > 0) {
      for (const upgradeCode of upgradeCodes) {
        const upgrade = await UpgradeDefinitionModel.findOne({ code: upgradeCode, active: true });
        if (!upgrade) {
          throw new Error(`Upgrade con código ${upgradeCode} no encontrado`);
        }

        // Los upgrades por ahora son gratuitos o tienen precio fijo
        const upgradePrice = 0; // TODO: Definir precio de upgrades

        const upgradeItem: InvoiceItem = {
          type: 'upgrade' as const,
          code: upgradeCode,
          name: upgrade.name,
          price: upgradePrice,
          quantity: 1
        };
        items.push(upgradeItem);

        totalAmount += upgradePrice;
      }
    }

    if (items.length === 0) {
      console.error('❌ [INVOICE SERVICE] No se pueden crear facturas sin items');
      throw new Error('No se pueden crear facturas sin items');
    }

    console.log('🟠 [INVOICE SERVICE] Resumen de items procesados:', {
      totalItems: items.length,
      totalAmount,
      items: items.map(item => ({ type: item.type, code: item.code, price: item.price }))
    });

    // Crear fecha de expiración (24 horas desde ahora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    console.log('🟠 [INVOICE SERVICE] Fecha de expiración calculada:', expiresAt);

    const invoiceData = {
      profileId: new mongoose.Types.ObjectId(profileId),
      userId: new mongoose.Types.ObjectId(userId),
      status: 'pending',
      items,
      totalAmount,
      expiresAt,
      notes
    };

    console.log('🟠 [INVOICE SERVICE] Creando factura con datos:', {
      profileId,
      userId,
      status: invoiceData.status,
      totalAmount: invoiceData.totalAmount,
      expiresAt: invoiceData.expiresAt,
      itemsCount: invoiceData.items.length
    });

    const invoice = new Invoice(invoiceData);
    const savedInvoice = await invoice.save();

    console.log('✅ [INVOICE SERVICE] Factura creada y guardada exitosamente:', {
      invoiceId: savedInvoice._id,
      totalAmount: savedInvoice.totalAmount,
      status: savedInvoice.status,
      expiresAt: savedInvoice.expiresAt
    });

    return savedInvoice;
  }

  /**
   * Obtiene una factura por ID
   */
  async getInvoiceById(invoiceId: string, populate: boolean = false): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new Error('ID de factura inválido');
    }

    let query = Invoice.findById(invoiceId);

    if (populate) {
      query = query
        .populate('profileId', 'name email phone')
        .populate('userId', 'name email');
    }

    return await query;
  }

  /**
   * Obtiene facturas con filtros
   */
  async getInvoices(filters: InvoiceFilters = {}, page = 1, limit = 10): Promise<{
    invoices: IInvoice[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const query: any = {};

    if (filters._id) {
      if (!mongoose.Types.ObjectId.isValid(filters._id)) {
        throw new Error('ID de factura inválido');
      }
      query._id = new mongoose.Types.ObjectId(filters._id);
    }

    if (filters.profileId) {
      if (!mongoose.Types.ObjectId.isValid(filters.profileId)) {
        throw new Error('ID de perfil inválido');
      }
      query.profileId = new mongoose.Types.ObjectId(filters.profileId);
    }

    if (filters.userId) {
      if (!mongoose.Types.ObjectId.isValid(filters.userId)) {
        throw new Error('ID de usuario inválido');
      }
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      query.createdAt = {};
      if (filters.fromDate) {
        query.createdAt.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.createdAt.$lte = filters.toDate;
      }
    }

    const skip = (page - 1) * limit;
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('profileId', 'name email phone')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      invoices,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  /**
   * Obtiene facturas pendientes de un usuario
   */
  async getPendingInvoicesByUser(userId: string): Promise<IInvoice[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('ID de usuario inválido');
    }

    return await Invoice.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
      .populate('profileId', 'name email phone')
      .sort({ createdAt: -1 });
  }

  /**
   * Marca una factura como pagada
   */
  async markAsPaid(invoiceId: string, paymentMethod?: string): Promise<IInvoice> {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new Error('ID de factura inválido');
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    if (invoice.status !== 'pending') {
      throw new Error(`No se puede marcar como pagada una factura con estado: ${invoice.status}`);
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    if (paymentMethod) {
      invoice.paymentMethod = paymentMethod;
    }

    return await invoice.save();
  }

  /**
   * Cancela una factura
   */
  async cancelInvoice(invoiceId: string, reason?: string): Promise<IInvoice> {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new Error('ID de factura inválido');
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    if (invoice.status === 'paid') {
      throw new Error('No se puede cancelar una factura ya pagada');
    }

    invoice.status = 'cancelled';
    invoice.cancelledAt = new Date();
    if (reason) {
      invoice.notes = invoice.notes ? `${invoice.notes}\n\nCancelada: ${reason}` : `Cancelada: ${reason}`;
    }

    return await invoice.save();
  }

  /**
   * Actualiza el estado de una factura (solo para administradores)
   */
  async updateInvoiceStatus(invoiceId: string, newStatus: 'pending' | 'paid' | 'cancelled' | 'expired', reason?: string): Promise<IInvoice> {
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new Error('ID de factura inválido');
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    const oldStatus = invoice.status;
    invoice.status = newStatus;

    // Agregar timestamps específicos según el estado
    if (newStatus === 'paid' && oldStatus !== 'paid') {
      invoice.paidAt = new Date();
    } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      invoice.cancelledAt = new Date();
    }

    // Agregar nota sobre el cambio de estado
    if (reason) {
      const statusChangeNote = `Estado cambiado de '${oldStatus}' a '${newStatus}': ${reason}`;
      invoice.notes = invoice.notes ? `${invoice.notes}\n\n${statusChangeNote}` : statusChangeNote;
    }

    // Guardar la factura actualizada
    const updatedInvoice = await invoice.save();

    // NUEVA LÓGICA: Procesar cambios de estado que afectan el planAssignment del perfil
    try {
      if (newStatus === 'paid' && oldStatus !== 'paid') {
        // Factura marcada como pagada - aplicar el plan comprado
        console.log(`💰 [INVOICE SERVICE] Factura ${invoiceId} marcada como pagada, procesando planAssignment...`);
        const PaymentProcessorService = await import('./payment-processor.service');
        const result = await PaymentProcessorService.PaymentProcessorService.processInvoicePayment(invoiceId);
        console.log(`✅ [INVOICE SERVICE] PlanAssignment procesado:`, result.message);
      } else if (['cancelled', 'expired'].includes(newStatus) && oldStatus === 'pending') {
        // Factura cancelada o expirada - mantener plan actual (no hacer cambios)
        console.log(`🚫 [INVOICE SERVICE] Factura ${invoiceId} ${newStatus}, manteniendo plan actual del perfil`);
      } else if (newStatus === 'pending' && ['cancelled', 'expired'].includes(oldStatus)) {
        // Factura reactivada desde cancelada/expirada - no hacer cambios automáticos
        console.log(`🔄 [INVOICE SERVICE] Factura ${invoiceId} reactivada a pendiente desde ${oldStatus}`);
      }
    } catch (error) {
      console.error(`❌ [INVOICE SERVICE] Error procesando planAssignment para factura ${invoiceId}:`, error);
      // No lanzar error para no afectar la actualización del estado de la factura
      // El administrador puede intentar nuevamente o procesar manualmente
    }

    return updatedInvoice;
  }

  /**
   * Marca facturas vencidas como expiradas
   */
  async expireOverdueInvoices(): Promise<number> {
    const result = await Invoice.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() }
      },
      {
        $set: {
          status: 'expired',
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount;
  }

  /**
   * Obtiene estadísticas de facturas
   */
  async getInvoiceStats(userId?: string): Promise<{
    total: number;
    pending: number;
    paid: number;
    cancelled: number;
    expired: number;
    totalAmount: number;
    paidAmount: number;
  }> {
    const matchStage: any = {};
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('ID de usuario inválido');
      }
      matchStage.userId = new mongoose.Types.ObjectId(userId);
    }

    const stats = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          paid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          expired: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      pending: 0,
      paid: 0,
      cancelled: 0,
      expired: 0,
      totalAmount: 0,
      paidAmount: 0
    };
  }
}

export default new InvoiceService();