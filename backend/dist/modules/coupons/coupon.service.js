"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = exports.CouponService = void 0;
const mongoose_1 = require("mongoose");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
const coupon_validation_1 = require("../../utils/coupon-validation");
const coupon_model_1 = __importDefault(require("./coupon.model"));
const plan_model_1 = require("../plans/plan.model");
class CouponService {
    async createCoupon(input, createdBy) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Iniciando createCoupon service...', {
                code: input.code,
                type: input.type,
                createdBy
            });
            logger_1.logger.info('Verificando si el código ya existe...');
            const codeCheckStart = Date.now();
            const existingCoupon = await coupon_model_1.default.findByCode(input.code);
            const codeCheckDuration = Date.now() - codeCheckStart;
            logger_1.logger.info(`Verificación de código completada en ${codeCheckDuration}ms - Existe: ${!!existingCoupon}`);
            if (existingCoupon) {
                throw new AppError_1.AppError('El código de cupón ya existe', 400);
            }
            const validationPromises = [];
            if (input.type === 'plan_assignment' && input.planCode) {
                logger_1.logger.info('Validando plan assignment...');
                validationPromises.push(plan_model_1.PlanDefinitionModel.findByCode(input.planCode).then(plan => {
                    if (!plan) {
                        throw new AppError_1.AppError('El plan especificado no existe', 400);
                    }
                    if (input.variantDays) {
                        const variant = plan.variants.find(v => v.days === input.variantDays);
                        if (!variant) {
                            throw new AppError_1.AppError(`La variante de ${input.variantDays} días no existe en el plan ${input.planCode}`, 400);
                        }
                    }
                    return plan;
                }));
            }
            if (input.applicablePlans && input.applicablePlans.length > 0) {
                logger_1.logger.info(`Validando ${input.applicablePlans.length} planes aplicables...`);
                const planValidations = input.applicablePlans.map(planCode => plan_model_1.PlanDefinitionModel.findByCode(planCode).then(plan => {
                    if (!plan) {
                        throw new AppError_1.AppError(`El plan ${planCode} no existe`, 400);
                    }
                    return plan;
                }));
                validationPromises.push(...planValidations);
            }
            if (validationPromises.length > 0) {
                logger_1.logger.info('Ejecutando validaciones de planes en paralelo...');
                const validationStart = Date.now();
                await Promise.all(validationPromises);
                const validationDuration = Date.now() - validationStart;
                logger_1.logger.info(`Validaciones de planes completadas en ${validationDuration}ms`);
            }
            logger_1.logger.info('Validando fechas...');
            if (new Date(input.validFrom) >= new Date(input.validUntil)) {
                throw new AppError_1.AppError('La fecha de inicio debe ser anterior a la fecha de vencimiento', 400);
            }
            logger_1.logger.info('Creando documento de cupón...');
            const createStart = Date.now();
            const coupon = new coupon_model_1.default({
                ...input,
                createdBy: new mongoose_1.Types.ObjectId(createdBy),
                currentUses: 0
            });
            logger_1.logger.info('Guardando cupón en base de datos...');
            await coupon.save();
            const createDuration = Date.now() - createStart;
            logger_1.logger.info(`Cupón guardado en ${createDuration}ms`);
            const totalDuration = Date.now() - startTime;
            logger_1.logger.info(`createCoupon service completado en ${totalDuration}ms - Cupón: ${coupon.code}`);
            return coupon.toObject();
        }
        catch (error) {
            const errorDuration = Date.now() - startTime;
            logger_1.logger.error(`Error en createCoupon service después de ${errorDuration}ms:`, error);
            if (error instanceof AppError_1.AppError)
                throw error;
            logger_1.logger.error('Error al crear cupón:', error);
            throw new AppError_1.AppError('Error interno al crear el cupón', 500);
        }
    }
    async getCouponByCode(code) {
        try {
            const coupon = await coupon_model_1.default.findByCode(code);
            if (coupon) {
                await coupon.populate('createdBy', 'name email');
                return coupon.toObject();
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error al obtener cupón por código:', error);
            throw new AppError_1.AppError('Error interno al obtener el cupón', 500);
        }
    }
    async getCouponById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new AppError_1.AppError('ID de cupón inválido', 400);
            }
            const coupon = await coupon_model_1.default.findById(id);
            if (coupon) {
                await coupon.populate('createdBy', 'name email');
                return coupon.toObject();
            }
            return null;
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            logger_1.logger.error('Error al obtener cupón por ID:', error);
            throw new AppError_1.AppError('Error interno al obtener el cupón', 500);
        }
    }
    async getCoupons(query = {}) {
        try {
            const { code, type, isActive, validOnly = false, page = 1, limit = 20 } = query;
            const validLimit = Math.min(20, Math.max(1, limit));
            const filter = {};
            if (code) {
                filter.code = { $regex: code.toUpperCase(), $options: 'i' };
            }
            if (type) {
                filter.type = type;
            }
            if (typeof isActive === 'boolean') {
                filter.isActive = isActive;
            }
            else {
                filter.isActive = true;
            }
            if (validOnly) {
                const now = new Date();
                filter.validFrom = { $lte: now };
                filter.validUntil = { $gte: now };
                filter.isActive = true;
            }
            const skip = (page - 1) * validLimit;
            const [coupons, total] = await Promise.all([
                coupon_model_1.default.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(validLimit)
                    .populate('createdBy', 'name email')
                    .lean(),
                coupon_model_1.default.countDocuments(filter)
            ]);
            return {
                coupons: coupons.map(coupon => ({
                    ...coupon,
                    _id: coupon._id.toString()
                })),
                total
            };
        }
        catch (error) {
            logger_1.logger.error('Error al obtener cupones:', error);
            throw new AppError_1.AppError('Error interno al obtener los cupones', 500);
        }
    }
    async updateCoupon(id, input) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new AppError_1.AppError('ID de cupón inválido', 400);
            }
            const coupon = await coupon_model_1.default.findById(id);
            if (!coupon) {
                throw new AppError_1.AppError('Cupón no encontrado', 404);
            }
            const validationPromises = [];
            if (input.planCode && coupon.type === 'plan_assignment') {
                validationPromises.push(plan_model_1.PlanDefinitionModel.findByCode(input.planCode).then(plan => {
                    if (!plan) {
                        throw new AppError_1.AppError('El plan especificado no existe', 400);
                    }
                    const variantDays = input.variantDays || coupon.variantDays;
                    if (variantDays) {
                        const variant = plan.variants.find(v => v.days === variantDays);
                        if (!variant) {
                            throw new AppError_1.AppError(`La variante de ${variantDays} días no existe en el plan ${input.planCode}`, 400);
                        }
                    }
                    return plan;
                }));
            }
            if (input.applicablePlans && input.applicablePlans.length > 0) {
                const planValidations = input.applicablePlans.map(planCode => plan_model_1.PlanDefinitionModel.findByCode(planCode).then(plan => {
                    if (!plan) {
                        throw new AppError_1.AppError(`El plan ${planCode} no existe`, 400);
                    }
                    return plan;
                }));
                validationPromises.push(...planValidations);
            }
            if (validationPromises.length > 0) {
                await Promise.all(validationPromises);
            }
            const validFrom = input.validFrom || coupon.validFrom;
            const validUntil = input.validUntil || coupon.validUntil;
            if (new Date(validFrom) >= new Date(validUntil)) {
                throw new AppError_1.AppError('La fecha de inicio debe ser anterior a la fecha de vencimiento', 400);
            }
            Object.assign(coupon, input);
            await coupon.save();
            logger_1.logger.info(`Cupón actualizado: ${coupon.code}`);
            return coupon.toObject();
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            logger_1.logger.error('Error al actualizar cupón:', error);
            throw new AppError_1.AppError('Error interno al actualizar el cupón', 500);
        }
    }
    async deleteCoupon(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new AppError_1.AppError('ID de cupón inválido', 400);
            }
            const coupon = await coupon_model_1.default.findById(id);
            if (!coupon) {
                throw new AppError_1.AppError('Cupón no encontrado', 404);
            }
            await coupon_model_1.default.findByIdAndDelete(id);
            logger_1.logger.info(`Cupón eliminado permanentemente: ${coupon.code}`);
            return true;
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            logger_1.logger.error('Error al eliminar cupón:', error);
            throw new AppError_1.AppError('Error interno al eliminar el cupón', 500);
        }
    }
    async validateCoupon(code, planCode, variantDays) {
        try {
            const coupon = await coupon_model_1.default.findByCode(code);
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
            if (planCode && variantDays && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
                const plan = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
                if (!plan) {
                    return {
                        isValid: false,
                        error: 'Plan no encontrado'
                    };
                }
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
        }
        catch (error) {
            logger_1.logger.error('Error al validar cupón:', error);
            return {
                isValid: false,
                error: 'Error interno al validar el cupón'
            };
        }
    }
    async applyCoupon(code, originalPrice, planCode, variantDays, upgradeId) {
        console.log('🎫 [COUPON SERVICE] Iniciando aplicación de cupón:', {
            code,
            originalPrice,
            planCode,
            variantDays,
            upgradeId,
            timestamp: new Date().toISOString()
        });
        try {
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
            if (!(0, coupon_validation_1.isCouponValidForPlan)(coupon, planCode, upgradeId)) {
                console.log('❌ [COUPON SERVICE] Cupón no válido para este plan/upgrade:', {
                    couponCode: coupon.code,
                    couponType: coupon.type,
                    planCode,
                    upgradeId,
                    validPlanIds: coupon.validPlanIds,
                    validUpgradeIds: coupon.validUpgradeIds
                });
                return {
                    success: false,
                    originalPrice,
                    finalPrice: originalPrice,
                    discount: 0,
                    error: 'El cupón no es válido para el plan o upgrade seleccionado'
                };
            }
            let finalPrice = originalPrice;
            let discount = 0;
            let assignedPlanCode;
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
                    if (planCode) {
                        const plan = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
                        if (plan && plan.variants.length > 0) {
                            let selectedVariant;
                            if (variantDays) {
                                selectedVariant = plan.variants.find(v => v.days === variantDays);
                                if (!selectedVariant) {
                                    console.log('⚠️ [COUPON SERVICE] Variante especificada no encontrada, usando la más económica:', {
                                        requestedVariantDays: variantDays,
                                        availableVariants: plan.variants.map(v => ({ days: v.days, price: v.price }))
                                    });
                                    selectedVariant = plan.variants.reduce((min, variant) => variant.price < min.price ? variant : min);
                                }
                            }
                            else {
                                selectedVariant = plan.variants.reduce((min, variant) => variant.price < min.price ? variant : min);
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
                    if (planCode) {
                        const plan = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
                        if (plan && plan.variants.length > 0) {
                            let selectedVariant;
                            if (variantDays) {
                                selectedVariant = plan.variants.find(v => v.days === variantDays);
                                if (!selectedVariant) {
                                    console.log('⚠️ [COUPON SERVICE] Variante especificada no encontrada, usando la más económica:', {
                                        requestedVariantDays: variantDays,
                                        availableVariants: plan.variants.map(v => ({ days: v.days, price: v.price }))
                                    });
                                    selectedVariant = plan.variants.reduce((min, variant) => variant.price < min.price ? variant : min);
                                }
                            }
                            else {
                                selectedVariant = plan.variants.reduce((min, variant) => variant.price < min.price ? variant : min);
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
                    if (coupon.planCode) {
                        const assignedPlan = await plan_model_1.PlanDefinitionModel.findByCode(coupon.planCode);
                        console.log('🔍 [COUPON SERVICE] Plan asignado encontrado:', {
                            planFound: !!assignedPlan,
                            planCode: coupon.planCode,
                            variants: assignedPlan?.variants?.length || 0,
                            variantDays: coupon.variantDays
                        });
                        if (assignedPlan && assignedPlan.variants.length > 0) {
                            finalPrice = 0;
                            discount = originalPrice;
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
        }
        catch (error) {
            console.log('💥 [COUPON SERVICE] Error en aplicación de cupón:', {
                error: error instanceof Error ? error.message : String(error),
                code,
                originalPrice,
                planCode,
                stack: error instanceof Error ? error.stack : undefined
            });
            logger_1.logger.error('Error al aplicar cupón:', error);
            return {
                success: false,
                originalPrice,
                finalPrice: originalPrice,
                discount: 0,
                error: 'Error interno al aplicar el cupón'
            };
        }
    }
    async getCheapestVariantDays(planCode) {
        try {
            const plan = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
            if (plan && plan.variants.length > 0) {
                const cheapestVariant = plan.variants.reduce((min, variant) => variant.price < min.price ? variant : min);
                return cheapestVariant.days;
            }
            return undefined;
        }
        catch (error) {
            logger_1.logger.error('Error al obtener variante más económica:', error);
            return undefined;
        }
    }
    async incrementCouponUsage(code) {
        try {
            const coupon = await coupon_model_1.default.findByCode(code);
            if (!coupon) {
                throw new AppError_1.AppError('Cupón no encontrado', 404);
            }
            coupon.currentUses += 1;
            await coupon.save();
            logger_1.logger.info(`Uso incrementado para cupón: ${code} (${coupon.currentUses}/${coupon.maxUses === -1 ? '∞' : coupon.maxUses})`);
            return true;
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            logger_1.logger.error('Error al incrementar uso de cupón:', error);
            throw new AppError_1.AppError('Error interno al incrementar uso del cupón', 500);
        }
    }
    async getCouponStats() {
        const startTime = Date.now();
        logger_1.logger.info('Iniciando getCouponStats...');
        try {
            const collectionCheckStart = Date.now();
            const totalDocs = await coupon_model_1.default.estimatedDocumentCount();
            const collectionCheckDuration = Date.now() - collectionCheckStart;
            logger_1.logger.info(`Verificación de colección completada en ${collectionCheckDuration}ms - Total documentos: ${totalDocs}`);
            if (totalDocs === 0) {
                logger_1.logger.info('No hay cupones en la base de datos, retornando estadísticas vacías');
                return {
                    total: 0,
                    active: 0,
                    expired: 0,
                    exhausted: 0,
                    byType: {}
                };
            }
            const queryStart = Date.now();
            logger_1.logger.info('Ejecutando consultas de estadísticas...');
            const [total, active, expired, exhausted, typeStats] = await Promise.all([
                coupon_model_1.default.countDocuments({}),
                coupon_model_1.default.countDocuments({ isActive: true }),
                coupon_model_1.default.countDocuments({
                    isActive: true,
                    validUntil: { $lt: new Date() }
                }),
                coupon_model_1.default.countDocuments({
                    isActive: true,
                    maxUses: { $ne: -1 },
                    $expr: { $gte: ['$currentUses', '$maxUses'] }
                }),
                coupon_model_1.default.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ])
            ]);
            const queryDuration = Date.now() - queryStart;
            logger_1.logger.info(`Consultas completadas en ${queryDuration}ms`);
            const result = {
                total,
                active,
                expired,
                exhausted,
                byType: typeStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {})
            };
            const totalDuration = Date.now() - startTime;
            logger_1.logger.info(`getCouponStats completado en ${totalDuration}ms - Resultado:`, result);
            return result;
        }
        catch (error) {
            const errorDuration = Date.now() - startTime;
            logger_1.logger.error(`Error en getCouponStats después de ${errorDuration}ms:`, error);
            throw new AppError_1.AppError('Error interno al obtener estadísticas', 500);
        }
    }
}
exports.CouponService = CouponService;
exports.couponService = new CouponService();
exports.default = exports.couponService;
