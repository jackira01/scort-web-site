import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { isCouponValidForPlan } from '../../utils/coupon-validation';
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
   * Crear un nuevo cupón - Con logging detallado
   */
  async createCoupon(input: CreateCouponInput, createdBy: string): Promise<ICoupon> {
    const startTime = Date.now();

    try {
      logger.info('Iniciando createCoupon service...', {
        code: input.code,
        type: input.type,
        createdBy
      });

      // Validar que el código no exista
      logger.info('Verificando si el código ya existe...');
      const codeCheckStart = Date.now();
      const existingCoupon = await CouponModel.findByCode(input.code);
      const codeCheckDuration = Date.now() - codeCheckStart;
      logger.info(`Verificación de código completada en ${codeCheckDuration}ms - Existe: ${!!existingCoupon}`);

      if (existingCoupon) {
        throw new AppError('El código de cupón ya existe', 400);
      }

      // Optimizar validaciones de planes usando Promise.all para ejecutar en paralelo
      const validationPromises: Promise<any>[] = [];

      // Validar plan si es de tipo plan_assignment
      if (input.type === 'plan_assignment' && input.planCode) {
        logger.info('Validando plan assignment...');
        validationPromises.push(
          PlanDefinitionModel.findByCode(input.planCode).then(plan => {
            if (!plan) {
              throw new AppError('El plan especificado no existe', 400);
            }

            // Validar que la variante de días existe en el plan
            if (input.variantDays) {
              const variant = plan.variants.find(v => v.days === input.variantDays);
              if (!variant) {
                throw new AppError(`La variante de ${input.variantDays} días no existe en el plan ${input.planCode}`, 400);
              }
            }

            return plan;
          })
        );
      }

      // Validar planes aplicables si se especifican
      if (input.applicablePlans && input.applicablePlans.length > 0) {
        logger.info(`Validando ${input.applicablePlans.length} planes aplicables...`);
        // Usar Promise.all para validar todos los planes en paralelo
        const planValidations = input.applicablePlans.map(planCode =>
          PlanDefinitionModel.findByCode(planCode).then(plan => {
            if (!plan) {
              throw new AppError(`El plan ${planCode} no existe`, 400);
            }
            return plan;
          })
        );
        validationPromises.push(...planValidations);
      }

      // Ejecutar todas las validaciones de planes en paralelo
      if (validationPromises.length > 0) {
        logger.info('Ejecutando validaciones de planes en paralelo...');
        const validationStart = Date.now();
        await Promise.all(validationPromises);
        const validationDuration = Date.now() - validationStart;
        logger.info(`Validaciones de planes completadas en ${validationDuration}ms`);
      }

      // Validar fechas
      logger.info('Validando fechas...');
      if (new Date(input.validFrom) >= new Date(input.validUntil)) {
        throw new AppError('La fecha de inicio debe ser anterior a la fecha de vencimiento', 400);
      }

      logger.info('Creando documento de cupón...');
      const createStart = Date.now();
      const coupon = new CouponModel({
        ...input,
        createdBy: new Types.ObjectId(createdBy),
        currentUses: 0
      });

      logger.info('Guardando cupón en base de datos...');
      await coupon.save();
      const createDuration = Date.now() - createStart;
      logger.info(`Cupón guardado en ${createDuration}ms`);

      const totalDuration = Date.now() - startTime;
      logger.info(`createCoupon service completado en ${totalDuration}ms - Cupón: ${coupon.code}`);

      return coupon.toObject();
    } catch (error) {
      const errorDuration = Date.now() - startTime;
      logger.error(`Error en createCoupon service después de ${errorDuration}ms:`, error);

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

      // Validar límite máximo
      const validLimit = Math.min(20, Math.max(1, limit));

      const filter: any = {};

      if (code) {
        filter.code = { $regex: code.toUpperCase(), $options: 'i' };
      }

      if (type) {
        filter.type = type;
      }

      // Solo filtrar por isActive si se especifica explícitamente
      if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
      }
      // Si no se especifica, mostrar TODOS los cupones (activos e inactivos)

      if (validOnly) {
        const now = new Date();
        filter.validFrom = { $lte: now };
        filter.validUntil = { $gte: now };
        filter.isActive = true;
      }

      const skip = (page - 1) * validLimit;

      // Consulta simple y directa
      const [coupons, total] = await Promise.all([
        CouponModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(validLimit)
          .populate('createdBy', 'name email')
          .lean(),
        CouponModel.countDocuments(filter)
      ]);

      return {
        coupons: coupons.map(coupon => ({
          ...coupon,
          _id: coupon._id.toString()
        })),
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

      // Optimizar validaciones de planes usando Promise.all para ejecutar en paralelo
      const validationPromises: Promise<any>[] = [];

      // Validar plan si se está actualizando y es de tipo plan_assignment
      if (input.planCode && coupon.type === 'plan_assignment') {
        validationPromises.push(
          PlanDefinitionModel.findByCode(input.planCode).then(plan => {
            if (!plan) {
              throw new AppError('El plan especificado no existe', 400);
            }

            // Validar que la variante de días existe en el plan
            const variantDays = input.variantDays || coupon.variantDays;
            if (variantDays) {
              const variant = plan.variants.find(v => v.days === variantDays);
              if (!variant) {
                throw new AppError(`La variante de ${variantDays} días no existe en el plan ${input.planCode}`, 400);
              }
            }

            return plan;
          })
        );
      }

      // Validar planes aplicables si se están actualizando
      if (input.applicablePlans && input.applicablePlans.length > 0) {
        const planValidations = input.applicablePlans.map(planCode =>
          PlanDefinitionModel.findByCode(planCode).then(plan => {
            if (!plan) {
              throw new AppError(`El plan ${planCode} no existe`, 400);
            }
            return plan;
          })
        );
        validationPromises.push(...planValidations);
      }

      // Ejecutar todas las validaciones de planes en paralelo
      if (validationPromises.length > 0) {
        await Promise.all(validationPromises);
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
   * Eliminar cupón (hard delete)
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

      // Hard delete: eliminar completamente de la base de datos
      await CouponModel.findByIdAndDelete(id);

      logger.info(`Cupón eliminado permanentemente: ${coupon.code}`);
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
  async validateCoupon(code: string, planCode?: string, variantDays?: number): Promise<CouponValidationResult> {
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

      // Validar si el cupón es aplicable al plan específico (incluyendo variante)
      if (planCode && variantDays && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
        // Buscar el plan por código para obtener su ID
        const plan = await PlanDefinitionModel.findByCode(planCode);
        if (!plan) {
          return {
            isValid: false,
            error: 'Plan no encontrado'
          };
        }

        // Construir el identificador plan-variante
        const planVariantId = `${plan._id}-${variantDays}`;

        if (!coupon.applicablePlans.includes(planVariantId)) {
          return {
            isValid: false,
            error: 'Cupón no aplicable a este plan y variante'
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
  async applyCoupon(code: string, originalPrice: number, planCode?: string, variantDays?: number, upgradeId?: string): Promise<CouponApplicationResult> {
    console.log('🎫 [COUPON SERVICE] Iniciando aplicación de cupón:', {
      code,
      originalPrice,
      planCode,
      variantDays,
      upgradeId,
      timestamp: new Date().toISOString()
    });

    try {
      // 🚫 REGLA DE NEGOCIO: No se pueden aplicar cupones a planes gratuitos
      if (originalPrice <= 0) {
        console.log('❌ [COUPON SERVICE] No se puede aplicar cupón a plan gratuito');
        return {
          success: false,
          originalPrice,
          finalPrice: originalPrice,
          discount: 0,
          error: 'El cupón no puede aplicarse a planes gratuitos'
        };
      }

      const validation = await this.validateCoupon(code, planCode);

      console.log('🔍 [COUPON SERVICE] Resultado de validación:', {
        isValid: validation.isValid,
        error: validation.error,
        couponFound: !!validation.coupon
      });

      if (!validation.isValid || !validation.coupon) {
        console.log('❌ [COUPON SERVICE] Cupón no válido');
        return {
          success: false,
          originalPrice,
          finalPrice: originalPrice,
          discount: 0,
          error: validation.error
        };
      }

      const coupon = validation.coupon;

      // 🎯 NUEVA VALIDACIÓN: Verificar si el cupón es válido para el plan/variante/upgrade específico
      if (!isCouponValidForPlan(coupon, planCode, variantDays, upgradeId)) {
        console.log('❌ [COUPON SERVICE] Cupón no válido para este plan/variante/upgrade:', {
          couponCode: coupon.code,
          couponType: coupon.type,
          planCode,
          variantDays,
          upgradeId,
          validPlanCodes: coupon.validPlanCodes,
          validVariantDays: coupon.validVariantDays,
          validPlanIds: coupon.validPlanIds,
          validUpgradeIds: coupon.validUpgradeIds
        });

        return {
          success: false,
          originalPrice,
          finalPrice: originalPrice,
          discount: 0,
          error: 'El cupón no es válido para el plan, variante o upgrade seleccionado'
        };
      }

      let finalPrice = originalPrice;
      let discount = 0;
      let assignedPlanCode: string | undefined;

      console.log('💰 [COUPON SERVICE] Iniciando cálculo de descuento:', {
        couponType: coupon.type,
        couponValue: coupon.value,
        originalPrice,
        planCode: coupon.planCode
      });

      switch (coupon.type) {
        case 'percentage':
          discount = (originalPrice * coupon.value) / 100;
          finalPrice = originalPrice - discount;
          console.log('📊 [COUPON SERVICE] Cálculo porcentual:', {
            percentage: coupon.value,
            calculatedDiscount: discount,
            finalPrice
          });

          // Si se especifica un planCode, usar la variante seleccionada o la más económica
          if (planCode) {
            const plan = await PlanDefinitionModel.findByCode(planCode);
            if (plan && plan.variants.length > 0) {
              let selectedVariant;

              if (variantDays) {
                // Usar la variante específica seleccionada por el usuario
                selectedVariant = plan.variants.find(v => v.days === variantDays);
                if (!selectedVariant) {
                  console.log('⚠️ [COUPON SERVICE] Variante especificada no encontrada, usando la más económica:', {
                    requestedVariantDays: variantDays,
                    availableVariants: plan.variants.map(v => ({ days: v.days, price: v.price }))
                  });
                  selectedVariant = plan.variants.reduce((min, variant) =>
                    variant.price < min.price ? variant : min
                  );
                }
              } else {
                // Si no se especifica variante, usar la más económica
                selectedVariant = plan.variants.reduce((min, variant) =>
                  variant.price < min.price ? variant : min
                );
              }

              assignedPlanCode = planCode;
              console.log('💰 [COUPON SERVICE] Aplicando variante para cupón porcentual:', {
                planCode,
                selectedVariantDays: selectedVariant.days,
                selectedVariantPrice: selectedVariant.price,
                wasUserSelected: !!variantDays
              });
            }
          }
          break;

        case 'fixed_amount':
          discount = coupon.value;
          finalPrice = originalPrice - discount;
          console.log('💵 [COUPON SERVICE] Cálculo monto fijo:', {
            fixedAmount: coupon.value,
            discount,
            finalPrice
          });

          // Si se especifica un planCode, usar la variante seleccionada o la más económica
          if (planCode) {
            const plan = await PlanDefinitionModel.findByCode(planCode);
            if (plan && plan.variants.length > 0) {
              let selectedVariant;

              if (variantDays) {
                // Usar la variante específica seleccionada por el usuario
                selectedVariant = plan.variants.find(v => v.days === variantDays);
                if (!selectedVariant) {
                  console.log('⚠️ [COUPON SERVICE] Variante especificada no encontrada, usando la más económica:', {
                    requestedVariantDays: variantDays,
                    availableVariants: plan.variants.map(v => ({ days: v.days, price: v.price }))
                  });
                  selectedVariant = plan.variants.reduce((min, variant) =>
                    variant.price < min.price ? variant : min
                  );
                }
              } else {
                // Si no se especifica variante, usar la más económica
                selectedVariant = plan.variants.reduce((min, variant) =>
                  variant.price < min.price ? variant : min
                );
              }

              assignedPlanCode = planCode;
              console.log('💰 [COUPON SERVICE] Aplicando variante para cupón de monto fijo:', {
                planCode,
                selectedVariantDays: selectedVariant.days,
                selectedVariantPrice: selectedVariant.price,
                wasUserSelected: !!variantDays
              });
            }
          }
          break;

        case 'plan_assignment':
          console.log('📋 [COUPON SERVICE] Procesando asignación de plan:', {
            assignedPlanCode: coupon.planCode,
            variantDays: coupon.variantDays
          });
          // Para asignación de plan, el descuento es del 100% (gratis)
          if (coupon.planCode) {
            const assignedPlan = await PlanDefinitionModel.findByCode(coupon.planCode);
            console.log('🔍 [COUPON SERVICE] Plan asignado encontrado:', {
              planFound: !!assignedPlan,
              planCode: coupon.planCode,
              variants: assignedPlan?.variants?.length || 0,
              variantDays: coupon.variantDays
            });
            if (assignedPlan && assignedPlan.variants.length > 0) {
              // Para cupones de asignación de plan, el precio final es 0 (gratis)
              finalPrice = 0;
              discount = originalPrice; // El descuento es el precio completo
              assignedPlanCode = coupon.planCode;
              console.log('💰 [COUPON SERVICE] Precio de plan asignado (100% descuento):', {
                originalPrice,
                finalPrice: 0,
                discount: originalPrice,
                assignedPlanCode,
                variantDays: coupon.variantDays
              });
            }
          }
          break;
      }

      // 🛡️ REGLA DE NEGOCIO: Asegurar que el precio final no sea negativo
      const originalFinalPrice = finalPrice;
      finalPrice = Math.max(0, finalPrice);
      discount = originalPrice - finalPrice;

      if (originalFinalPrice !== finalPrice) {
        console.log('⚠️ [COUPON SERVICE] Precio final ajustado (era negativo):', {
          calculatedFinalPrice: originalFinalPrice,
          adjustedFinalPrice: finalPrice,
          adjustedDiscount: discount,
          message: 'El descuento no puede exceder el valor del plan'
        });
      }

      const result = {
        success: true,
        originalPrice,
        finalPrice,
        discount,
        planCode: assignedPlanCode,
        variantDays: coupon.type === 'plan_assignment' ? coupon.variantDays :
          (assignedPlanCode && planCode ? (variantDays || await this.getCheapestVariantDays(assignedPlanCode)) : undefined)
      };

      console.log('✅ [COUPON SERVICE] Aplicación de cupón exitosa:', {
        result,
        savings: originalPrice - finalPrice,
        discountPercentage: originalPrice > 0 ? ((discount / originalPrice) * 100).toFixed(2) + '%' : '0%'
      });

      return result;
    } catch (error) {
      console.log('💥 [COUPON SERVICE] Error en aplicación de cupón:', {
        error: error instanceof Error ? error.message : String(error),
        code,
        originalPrice,
        planCode,
        stack: error instanceof Error ? error.stack : undefined
      });

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
   * Obtener los días de la variante más económica de un plan
   */
  private async getCheapestVariantDays(planCode: string): Promise<number | undefined> {
    try {
      const plan = await PlanDefinitionModel.findByCode(planCode);
      if (plan && plan.variants.length > 0) {
        const cheapestVariant = plan.variants.reduce((min, variant) =>
          variant.price < min.price ? variant : min
        );
        return cheapestVariant.days;
      }
      return undefined;
    } catch (error) {
      logger.error('Error al obtener variante más económica:', error);
      return undefined;
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
   * Obtener estadísticas de cupones (optimizado con logging detallado)
   */
  async getCouponStats(): Promise<any> {
    const startTime = Date.now();
    logger.info('Iniciando getCouponStats...');

    try {
      // Verificar si hay documentos en la colección
      const collectionCheckStart = Date.now();
      const totalDocs = await CouponModel.estimatedDocumentCount();
      const collectionCheckDuration = Date.now() - collectionCheckStart;
      logger.info(`Verificación de colección completada en ${collectionCheckDuration}ms - Total documentos: ${totalDocs}`);

      if (totalDocs === 0) {
        logger.info('No hay cupones en la base de datos, retornando estadísticas vacías');
        return {
          total: 0,
          active: 0,
          expired: 0,
          exhausted: 0,
          byType: {}
        };
      }

      // Usar consultas simples en lugar de agregación compleja
      const queryStart = Date.now();
      logger.info('Ejecutando consultas de estadísticas...');

      const [total, active, expired, exhausted, typeStats] = await Promise.all([
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
        }),
        CouponModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);

      const queryDuration = Date.now() - queryStart;
      logger.info(`Consultas completadas en ${queryDuration}ms`);

      const result = {
        total,
        active,
        expired,
        exhausted,
        byType: typeStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };

      const totalDuration = Date.now() - startTime;
      logger.info(`getCouponStats completado en ${totalDuration}ms - Resultado:`, result);

      return result;
    } catch (error) {
      const errorDuration = Date.now() - startTime;
      logger.error(`Error en getCouponStats después de ${errorDuration}ms:`, error);
      throw new AppError('Error interno al obtener estadísticas', 500);
    }
  }
}

export const couponService = new CouponService();
export default couponService;