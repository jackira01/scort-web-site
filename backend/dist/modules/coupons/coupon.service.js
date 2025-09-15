"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = exports.CouponService = void 0;
const mongoose_1 = require("mongoose");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
const coupon_model_1 = __importDefault(require("./coupon.model"));
const plan_model_1 = require("../plans/plan.model");
class CouponService {
    async createCoupon(input, createdBy) {
        try {
            const existingCoupon = await coupon_model_1.default.findByCode(input.code);
            if (existingCoupon) {
                throw new AppError_1.AppError('El código de cupón ya existe', 400);
            }
            if (input.type === 'plan_assignment' && input.planCode) {
                const planExists = await plan_model_1.PlanDefinitionModel.findByCode(input.planCode);
                if (!planExists) {
                    throw new AppError_1.AppError('El plan especificado no existe', 400);
                }
            }
            if (input.applicablePlans && input.applicablePlans.length > 0) {
                for (const planCode of input.applicablePlans) {
                    const planExists = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
                    if (!planExists) {
                        throw new AppError_1.AppError(`El plan ${planCode} no existe`, 400);
                    }
                }
            }
            if (new Date(input.validFrom) >= new Date(input.validUntil)) {
                throw new AppError_1.AppError('La fecha de inicio debe ser anterior a la fecha de vencimiento', 400);
            }
            const coupon = new coupon_model_1.default({
                ...input,
                createdBy: new mongoose_1.Types.ObjectId(createdBy),
                currentUses: 0
            });
            await coupon.save();
            logger_1.logger.info(`Cupón creado: ${coupon.code} por usuario ${createdBy}`);
            return coupon.toObject();
        }
        catch (error) {
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
            if (validOnly) {
                const now = new Date();
                filter.validFrom = { $lte: now };
                filter.validUntil = { $gte: now };
                filter.isActive = true;
            }
            const skip = (page - 1) * limit;
            const [coupons, total] = await Promise.all([
                coupon_model_1.default.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('createdBy', 'name email'),
                coupon_model_1.default.countDocuments(filter)
            ]);
            return {
                coupons: coupons.map(coupon => coupon.toObject()),
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
            if (input.planCode && coupon.type === 'plan_assignment') {
                const planExists = await plan_model_1.PlanDefinitionModel.findByCode(input.planCode);
                if (!planExists) {
                    throw new AppError_1.AppError('El plan especificado no existe', 400);
                }
            }
            if (input.applicablePlans && input.applicablePlans.length > 0) {
                for (const planCode of input.applicablePlans) {
                    const planExists = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
                    if (!planExists) {
                        throw new AppError_1.AppError(`El plan ${planCode} no existe`, 400);
                    }
                }
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
            coupon.isActive = false;
            await coupon.save();
            logger_1.logger.info(`Cupón eliminado (soft delete): ${coupon.code}`);
            return true;
        }
        catch (error) {
            if (error instanceof AppError_1.AppError)
                throw error;
            logger_1.logger.error('Error al eliminar cupón:', error);
            throw new AppError_1.AppError('Error interno al eliminar el cupón', 500);
        }
    }
    async validateCoupon(code, planCode) {
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
        }
        catch (error) {
            logger_1.logger.error('Error al validar cupón:', error);
            return {
                isValid: false,
                error: 'Error interno al validar el cupón'
            };
        }
    }
    async applyCoupon(code, originalPrice, planCode) {
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
            let assignedPlanCode;
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
                    if (coupon.planCode) {
                        const assignedPlan = await plan_model_1.PlanDefinitionModel.findByCode(coupon.planCode);
                        if (assignedPlan && assignedPlan.variants.length > 0) {
                            finalPrice = assignedPlan.variants[0].price;
                            discount = originalPrice - finalPrice;
                            assignedPlanCode = coupon.planCode;
                        }
                    }
                    break;
            }
            finalPrice = Math.max(0, finalPrice);
            discount = originalPrice - finalPrice;
            return {
                success: true,
                originalPrice,
                finalPrice,
                discount,
                planCode: assignedPlanCode
            };
        }
        catch (error) {
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
        try {
            const [totalCoupons, activeCoupons, expiredCoupons, exhaustedCoupons] = await Promise.all([
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
                })
            ]);
            const typeStats = await coupon_model_1.default.aggregate([
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
        }
        catch (error) {
            logger_1.logger.error('Error al obtener estadísticas de cupones:', error);
            throw new AppError_1.AppError('Error interno al obtener estadísticas', 500);
        }
    }
}
exports.CouponService = CouponService;
exports.couponService = new CouponService();
exports.default = exports.couponService;
