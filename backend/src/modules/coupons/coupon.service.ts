import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import CouponModel from './coupon.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import type {
  ICoupon,
  CreateCouponInput,
  UpdateCouponInput,
  CouponValidationResult,
  CouponApplicationResult,
  CouponQuery
} from './coupon.types';

export class CouponService {
  /**
   * Crear un nuevo cupón
   */
  async createCoupon(input: CreateCouponInput, createdBy: string): Promise<ICoupon> {
    try {
      // Validar que el código no exista
      const existingCoupon = await CouponModel.findByCode(input.code);
      if (existingCoupon) {
        throw new AppError('El código de cupón ya existe', 400);
      }

      // Validar plan si es de tipo plan_assignment
      if (input.type === 'plan_assignment' && input.planCode) {
        const planExists = await PlanDefinitionModel.findByCode(input.planCode);
        if (!planExists) {
          throw new AppError('El plan especificado no existe', 400);
        }
      }

      // Validar planes aplicables si se especifican
      if (input.applicablePlans && input.applicablePlans.length > 0) {
        for (const planCode of input.applicablePlans) {
          const planExists = await PlanDefinitionModel.findByCode(planCode);
          if (!planExists) {
            throw new AppError(`El plan ${planCode} no existe`, 400);
          }
        }
      }

      // Validar fechas
      if (new Date(input.validFrom) >= new Date(input.validUntil)) {
        throw new AppError('La fecha de inicio debe ser anterior a la fecha de vencimiento', 400);
      }

      const coupon = new CouponModel({
        ...input,
        createdBy: new Types.ObjectId(createdBy),
        currentUses: 0
      });

      await coupon.save();
      logger.info(`Cupón creado: ${coupon.code} por usuario ${createdBy}`);
      
      return coupon.toObject();
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al crear cupón:', error);
      throw new AppError('Error interno al crear el cupón', 500);
    }
  }

  /**
   * Obtener cupón por código
   */
  async getCouponByCode(code: string): Promise<ICoupon | null> {
    try {
      const coupon = await CouponModel.findByCode(code);
      if (coupon) {
        await coupon.populate('createdBy', 'name email');
        return coupon.toObject();
      }
      return null;
    } catch (error) {
      logger.error('Error al obtener cupón por código:', error);
      throw new AppError('Error interno al obtener el cupón', 500);
    }
  }

  /**
   * Obtener cupón por ID
   */
  async getCouponById(id: string): Promise<ICoupon | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError('ID de cupón inválido', 400);
      }

      const coupon = await CouponModel.findById(id);
      if (coupon) {
        await coupon.populate('createdBy', 'name email');
        return coupon.toObject();
      }
      return null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener cupón por ID:', error);
      throw new AppError('Error interno al obtener el cupón', 500);
    }
  }

  /**
   * Obtener lista de cupones con filtros
   */
  async getCoupons(query: CouponQuery = {}): Promise<{ coupons: ICoupon[]; total: number }> {
    try {
      const {
        code,
        type,
        isActive,
        validOnly = false,
        page = 1,
        limit = 20
      } = query;

      const filter: any = {};

      if (code) {
        filter.code = { $regex: code.toUpperCase(), $options: 'i' };
      }

      if (type) {
        filter.type = type;
      }

      if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
      }

      if (validOnly) {
        const now = new Date();
        filter.validFrom = { $lte: now };
        filter.validUntil = { $gte: now };
        filter.isActive = true;
      }

      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        CouponModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('createdBy', 'name email'),
        CouponModel.countDocuments(filter)
      ]);

      return {
        coupons: coupons.map(coupon => coupon.toObject()),
        total
      };
    } catch (error) {
      logger.error('Error al obtener cupones:', error);
      throw new AppError('Error interno al obtener los cupones', 500);
    }
  }

  /**
   * Actualizar cupón
   */
  async updateCoupon(id: string, input: UpdateCouponInput): Promise<ICoupon | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError('ID de cupón inválido', 400);
      }

      const coupon = await CouponModel.findById(id);
      if (!coupon) {
        throw new AppError('Cupón no encontrado', 404);
      }

      // Validar plan si se está actualizando y es de tipo plan_assignment
      if (input.planCode && coupon.type === 'plan_assignment') {
        const planExists = await PlanDefinitionModel.findByCode(input.planCode);
        if (!planExists) {
          throw new AppError('El plan especificado no existe', 400);
        }
      }

      // Validar planes aplicables si se están actualizando
      if (input.applicablePlans && input.applicablePlans.length > 0) {
        for (const planCode of input.applicablePlans) {
          const planExists = await PlanDefinitionModel.findByCode(planCode);
          if (!planExists) {
            throw new AppError(`El plan ${planCode} no existe`, 400);
          }
        }
      }

      // Validar fechas si se están actualizando
      const validFrom = input.validFrom || coupon.validFrom;
      const validUntil = input.validUntil || coupon.validUntil;
      if (new Date(validFrom) >= new Date(validUntil)) {
        throw new AppError('La fecha de inicio debe ser anterior a la fecha de vencimiento', 400);
      }

      Object.assign(coupon, input);
      await coupon.save();

      logger.info(`Cupón actualizado: ${coupon.code}`);
      return coupon.toObject();
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar cupón:', error);
      throw new AppError('Error interno al actualizar el cupón', 500);
    }
  }

  /**
   * Eliminar cupón (soft delete)
   */
  async deleteCoupon(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError('ID de cupón inválido', 400);
      }

      const coupon = await CouponModel.findById(id);
      if (!coupon) {
        throw new AppError('Cupón no encontrado', 404);
      }

      // Soft delete: marcar como inactivo
      coupon.isActive = false;
      await coupon.save();

      logger.info(`Cupón eliminado (soft delete): ${coupon.code}`);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar cupón:', error);
      throw new AppError('Error interno al eliminar el cupón', 500);
    }
  }

  /**
   * Validar cupón para uso
   */
  async validateCoupon(code: string, planCode?: string): Promise<CouponValidationResult> {
    try {
      const coupon = await CouponModel.findByCode(code);
      
      if (!coupon) {
        return {
          isValid: false,
          error: 'Cupón no encontrado'
        };
      }

      if (!coupon.isActive) {
        return {
          isValid: false,
          error: 'Cupón inactivo'
        };
      }

      const now = new Date();
      if (now < coupon.validFrom) {
        return {
          isValid: false,
          error: 'Cupón aún no válido'
        };
      }

      if (now > coupon.validUntil) {
        return {
          isValid: false,
          error: 'Cupón expirado'
        };
      }

      if (coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses) {
        return {
          isValid: false,
          error: 'Cupón agotado'
        };
      }

      // Validar si el cupón es aplicable al plan especificado
      if (planCode && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
        if (!coupon.applicablePlans.includes(planCode.toUpperCase())) {
          return {
            isValid: false,
            error: 'Cupón no aplicable a este plan'
          };
        }
      }

      return {
        isValid: true,
        coupon: coupon.toObject()
      };
    } catch (error) {
      logger.error('Error al validar cupón:', error);
      return {
        isValid: false,
        error: 'Error interno al validar el cupón'
      };
    }
  }

  /**
   * Aplicar cupón y calcular descuento
   */
  async applyCoupon(code: string, originalPrice: number, planCode?: string): Promise<CouponApplicationResult> {
    try {
      const validation = await this.validateCoupon(code, planCode);
      
      if (!validation.isValid || !validation.coupon) {
        return {
          success: false,
          originalPrice,
          finalPrice: originalPrice,
          discount: 0,
          error: validation.error
        };
      }

      const coupon = validation.coupon;
      let finalPrice = originalPrice;
      let discount = 0;
      let assignedPlanCode: string | undefined;

      switch (coupon.type) {
        case 'percentage':
          discount = (originalPrice * coupon.value) / 100;
          finalPrice = originalPrice - discount;
          break;

        case 'fixed_amount':
          finalPrice = coupon.value;
          discount = originalPrice - finalPrice;
          break;

        case 'plan_assignment':
          // Para asignación de plan, el precio se determina por el plan asignado
          if (coupon.planCode) {
            const assignedPlan = await PlanDefinitionModel.findByCode(coupon.planCode);
            if (assignedPlan && assignedPlan.variants.length > 0) {
              // Tomar el primer variant como precio base
              finalPrice = assignedPlan.variants[0].price;
              discount = originalPrice - finalPrice;
              assignedPlanCode = coupon.planCode;
            }
          }
          break;
      }

      // Asegurar que el precio final no sea negativo
      finalPrice = Math.max(0, finalPrice);
      discount = originalPrice - finalPrice;

      return {
        success: true,
        originalPrice,
        finalPrice,
        discount,
        planCode: assignedPlanCode
      };
    } catch (error) {
      logger.error('Error al aplicar cupón:', error);
      return {
        success: false,
        originalPrice,
        finalPrice: originalPrice,
        discount: 0,
        error: 'Error interno al aplicar el cupón'
      };
    }
  }

  /**
   * Incrementar uso de cupón
   */
  async incrementCouponUsage(code: string): Promise<boolean> {
    try {
      const coupon = await CouponModel.findByCode(code);
      if (!coupon) {
        throw new AppError('Cupón no encontrado', 404);
      }

      coupon.currentUses += 1;
      await coupon.save();

      logger.info(`Uso incrementado para cupón: ${code} (${coupon.currentUses}/${coupon.maxUses === -1 ? '∞' : coupon.maxUses})`);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al incrementar uso de cupón:', error);
      throw new AppError('Error interno al incrementar uso del cupón', 500);
    }
  }

  /**
   * Obtener estadísticas de cupones
   */
  async getCouponStats(): Promise<any> {
    try {
      const [totalCoupons, activeCoupons, expiredCoupons, exhaustedCoupons] = await Promise.all([
        CouponModel.countDocuments({}),
        CouponModel.countDocuments({ isActive: true }),
        CouponModel.countDocuments({ 
          isActive: true,
          validUntil: { $lt: new Date() }
        }),
        CouponModel.countDocuments({
          isActive: true,
          maxUses: { $ne: -1 },
          $expr: { $gte: ['$currentUses', '$maxUses'] }
        })
      ]);

      const typeStats = await CouponModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      return {
        total: totalCoupons,
        active: activeCoupons,
        expired: expiredCoupons,
        exhausted: exhaustedCoupons,
        byType: typeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de cupones:', error);
      throw new AppError('Error interno al obtener estadísticas', 500);
    }
  }
}

export const couponService = new CouponService();
export default couponService;