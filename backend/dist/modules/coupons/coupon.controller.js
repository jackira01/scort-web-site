"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponController = exports.CouponController = void 0;
const coupon_service_1 = require("./coupon.service");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
class CouponController {
    async createCoupon(req, res) {
        try {
            const input = req.body;
            const createdBy = req.user?.id;
            if (!createdBy) {
                throw new AppError_1.AppError('Usuario no autenticado', 401);
            }
            const coupon = await coupon_service_1.couponService.createCoupon(input, createdBy);
            res.status(201).json({
                success: true,
                message: 'Cupón creado exitosamente',
                data: coupon
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                logger_1.logger.error('Error en createCoupon:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }
    async getCouponById(req, res) {
        try {
            const { id } = req.params;
            const coupon = await coupon_service_1.couponService.getCouponById(id);
            if (!coupon) {
                res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
                return;
            }
            res.json({
                success: true,
                data: coupon
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                logger_1.logger.error('Error en getCouponById:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }
    async getCoupons(req, res) {
        try {
            const query = {
                code: req.query.code,
                type: req.query.type,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                validOnly: req.query.validOnly === 'true',
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20
            };
            const result = await coupon_service_1.couponService.getCoupons(query);
            res.json({
                success: true,
                data: result.coupons,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: result.total,
                    pages: Math.ceil(result.total / (query.limit || 20))
                }
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                logger_1.logger.error('Error en getCoupons:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }
    async updateCoupon(req, res) {
        try {
            const { id } = req.params;
            const input = req.body;
            const coupon = await coupon_service_1.couponService.updateCoupon(id, input);
            if (!coupon) {
                res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Cupón actualizado exitosamente',
                data: coupon
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                logger_1.logger.error('Error en updateCoupon:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }
    async deleteCoupon(req, res) {
        try {
            const { id } = req.params;
            const success = await coupon_service_1.couponService.deleteCoupon(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'Cupón no encontrado'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Cupón eliminado exitosamente'
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                logger_1.logger.error('Error en deleteCoupon:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }
    async validateCoupon(req, res) {
        try {
            const { code } = req.params;
            const { planCode } = req.query;
            const validation = await coupon_service_1.couponService.validateCoupon(code, planCode);
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: validation.error
                });
                return;
            }
            res.json({
                success: true,
                message: 'Cupón válido',
                data: {
                    code: validation.coupon?.code,
                    name: validation.coupon?.name,
                    type: validation.coupon?.type,
                    value: validation.coupon?.value,
                    planCode: validation.coupon?.planCode
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error en validateCoupon:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async applyCoupon(req, res) {
        try {
            const { code, originalPrice, planCode } = req.body;
            if (!code || typeof originalPrice !== 'number' || originalPrice < 0) {
                res.status(400).json({
                    success: false,
                    message: 'Código de cupón y precio original son requeridos'
                });
                return;
            }
            const result = await coupon_service_1.couponService.applyCoupon(code, originalPrice, planCode);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: result.error
                });
                return;
            }
            res.json({
                success: true,
                message: 'Cupón aplicado exitosamente',
                data: {
                    originalPrice: result.originalPrice,
                    finalPrice: result.finalPrice,
                    discount: result.discount,
                    discountPercentage: result.originalPrice > 0 ? Math.round((result.discount / result.originalPrice) * 100) : 0,
                    planCode: result.planCode
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error en applyCoupon:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async getCouponStats(req, res) {
        try {
            const stats = await coupon_service_1.couponService.getCouponStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                logger_1.logger.error('Error en getCouponStats:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }
}
exports.CouponController = CouponController;
exports.couponController = new CouponController();
exports.default = exports.couponController;
