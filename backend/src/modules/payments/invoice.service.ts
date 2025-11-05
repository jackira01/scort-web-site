import mongoose from 'mongoose';
import Invoice, { type IInvoice, type InvoiceItem } from './invoice.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import { couponService } from '../coupons/coupon.service';

export interface CreateInvoiceData {
  profileId: string;
  userId: string;
  planId?: string; // ID del plan (nuevo, prioritario)
  planCode?: string; // Código del plan (mantener para compatibilidad)
  planDays?: number;
  upgradeCodes?: string[];
  couponCode?: string; // Código de cupón a aplicar
  notes?: string;
}

export interface InvoiceFilters {
  _id?: string;
  invoiceNumber?: string;
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
    const { profileId, userId, planId, planCode, planDays, upgradeCodes = [], couponCode, notes } = data;

    // Iniciando generación de factura

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      throw new Error('ID de perfil inválido');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('ID de usuario inválido');
    }

    const items: InvoiceItem[] = [];
    let totalAmount = 0;
    let planDetails = '';
    let resolvedPlanId: string | undefined; // Guardar el ID del plan para validación de cupones

    // Agregar plan si se especifica (por ID o código)
    if ((planId || planCode) && planDays) {

      let plan;
      if (planId) {
        plan = await PlanDefinitionModel.findById(planId);
      }

      if (!plan && planCode) {
        plan = await PlanDefinitionModel.findByCode(planCode);
      }
      if (!plan) {
        throw new Error(`Plan con ${planId ? `ID ${planId}` : `código ${planCode}`} no encontrado`);
      }

      // Guardar el ID del plan encontrado
      resolvedPlanId = plan._id.toString();

      const variant = plan.variants.find((v: any) => v.days === planDays);
      if (!variant) {
        throw new Error(`Variante de ${planDays} días no encontrada para el plan ${planCode}`);
      }

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

      // Construir detalles del plan para las notas
      planDetails = `Plan: ${plan.name} (${planCode}) - Variante: ${planDays} días - Precio: $${variant.price}`;

      // Item de plan agregado
    }

    // Agregar upgrades si se especifican
    if (upgradeCodes.length > 0) {
      for (const upgradeCode of upgradeCodes) {
        const upgrade = await UpgradeDefinitionModel.findOne({ code: upgradeCode, active: true });
        if (!upgrade) {
          throw new Error(`Upgrade con código ${upgradeCode} no encontrado`);
        }

        // Usar el precio del upgrade desde la base de datos
        const upgradePrice = upgrade.price || 0;

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
      // No se pueden crear facturas sin items
      throw new Error('No se pueden crear facturas sin items');
    }

    // Resumen de items procesados

    let finalAmount = totalAmount;
    let couponInfo: any = undefined;

    // Aplicar cupón si se proporciona
    if (couponCode) {
      // Usar planId en lugar de planCode para la validación
      const couponResult = await couponService.applyCoupon(couponCode, totalAmount, resolvedPlanId);

      if (couponResult.success) {
        finalAmount = couponResult.finalPrice;
        // Si es un cupón de asignación de plan, actualizar el plan
        if (couponResult.planCode && couponResult.planCode !== planCode) {
          // Reemplazar el item del plan con el nuevo plan del cupón
          const newPlan = await PlanDefinitionModel.findByCode(couponResult.planCode);
          if (newPlan && planDays) {
            const newVariant = newPlan.variants.find((v: any) => v.days === planDays);
            if (newVariant) {
              // Actualizar el item del plan existente
              const planItemIndex = items.findIndex(item => item.type === 'plan');
              if (planItemIndex !== -1) {
                items[planItemIndex] = {
                  type: 'plan' as const,
                  code: couponResult.planCode,
                  name: newPlan.name,
                  days: planDays,
                  price: newVariant.price,
                  quantity: 1
                };
              }
            }
          }
        }

        // Obtener información del cupón para guardar en la factura
        const couponData = await couponService.getCouponByCode(couponCode);
        if (couponData) {
          couponInfo = {
            code: couponData.code,
            name: couponData.name,
            type: couponData.type,
            value: couponData.value,
            originalAmount: totalAmount,
            discountAmount: couponResult.discount,
            finalAmount: finalAmount
          };
        }
      } else {
        // Si el cupón no es válido, lanzar error
        console.error('❌ [INVOICE SERVICE] Error aplicando cupón:', couponResult.error);
        throw new Error(`Error al aplicar cupón: ${couponResult.error}`);
      }
    }

    // Crear fecha de expiración (24 horas desde ahora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    // Fecha de expiración calculada

    // Construir notas automáticas con detalles del plan
    let enhancedNotes = notes || '';
    if (planDetails) {
      const planDetailsNote = `Detalles del plan: ${planDetails}`;
      enhancedNotes = enhancedNotes
        ? `${enhancedNotes}\n\n${planDetailsNote}`
        : planDetailsNote;
    }

    const invoiceData = {
      profileId: new mongoose.Types.ObjectId(profileId),
      userId: new mongoose.Types.ObjectId(userId),
      status: 'pending',
      items,
      totalAmount: finalAmount, // Usar el precio final después del cupón
      coupon: couponInfo,
      expiresAt,
      notes: enhancedNotes
    };
    // Creando factura con datos

    const invoice = new Invoice(invoiceData);
    const savedInvoice = await invoice.save();

    // Factura creada y guardada exitosamente
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
  async getInvoices(
    filters: InvoiceFilters = {},
    page = 1,
    limit = 10
  ): Promise<{
    invoices: IInvoice[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const query: any = {};

    // ----------------------------
    // 1️⃣ Construcción del filtro
    // ----------------------------
    if (filters._id) {
      if (filters._id.length >= 8) {
        if (!mongoose.Types.ObjectId.isValid(filters._id)) {
          throw new Error('ID de factura inválido');
        }
        query._id = new mongoose.Types.ObjectId(filters._id);
      } else {
        query._id = { $regex: new RegExp(filters._id, 'i') };
      }
    }

    if (filters.invoiceNumber) {
      const invoiceNumberValue = parseInt(filters.invoiceNumber);
      if (!isNaN(invoiceNumberValue)) {
        query.invoiceNumber = invoiceNumberValue;
      } else {
        query.invoiceNumber = { $regex: new RegExp(filters.invoiceNumber, 'i') };
      }
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
      if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
      if (filters.toDate) query.createdAt.$lte = filters.toDate;
    }

    // ----------------------------
    // 2️⃣ Expirar facturas vencidas
    // ----------------------------
    const now = new Date();

    await Invoice.updateMany(
      { status: 'pending', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );

    // Si quieres limitarlo solo al usuario filtrado (mejor práctica):
    // await Invoice.updateMany(
    //   {
    //     status: 'pending',
    //     expiresAt: { $lte: now },
    //     ...(filters.userId && { userId: new mongoose.Types.ObjectId(filters.userId) })
    //   },
    //   { $set: { status: 'expired' } }
    // );

    // ----------------------------
    // 3️⃣ Traer los datos actualizados
    // ----------------------------
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

    // Si la factura tiene un cupón aplicado, incrementar su uso
    if (invoice.coupon && invoice.coupon.code) {
      try {
        await couponService.incrementCouponUsage(invoice.coupon.code);
      } catch (error) {
        // Log el error pero no fallar el pago
        console.error(`Error al incrementar uso del cupón ${invoice.coupon.code}:`, error);
      }
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
        // Factura marcada como pagada, procesando planAssignment
        const PaymentProcessorService = await import('./payment-processor.service');
        const result = await PaymentProcessorService.PaymentProcessorService.processInvoicePayment(invoiceId);

        // INCREMENTAR CONTADOR DE USOS DEL CUPÓN SI LA FACTURA TIENE CUPÓN APLICADO
        if (updatedInvoice.coupon && updatedInvoice.coupon.code) {
          try {
            const { couponService } = await import('../coupons/coupon.service');
            await couponService.incrementCouponUsage(updatedInvoice.coupon.code);
          } catch (couponError) {
            console.error(`❌ Error incrementando contador de cupón ${updatedInvoice.coupon.code}:`, couponError);
            // No lanzar error para no afectar el proceso principal
          }
        }

        // PlanAssignment procesado
      } else if (['cancelled', 'expired'].includes(newStatus) && oldStatus === 'pending') {
        // Factura cancelada o expirada - mantener plan actual (no hacer cambios)
        // Factura con nuevo status, manteniendo plan actual del perfil
      } else if (newStatus === 'pending' && ['cancelled', 'expired'].includes(oldStatus)) {
        // Factura reactivada desde cancelada/expirada - no hacer cambios automáticos
        // Factura reactivada a pendiente
      }
    } catch (error) {
      // Error procesando planAssignment para factura
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