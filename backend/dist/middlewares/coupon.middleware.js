"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeCouponCode = exports.requireCouponAdminPermissions = exports.logCouponUsage = exports.couponRateLimit = exports.validateCouponPlanCompatibility = exports.validateCouponAvailability = exports.validateCouponExists = void 0;
const coupon_service_1 = require("../modules/coupons/coupon.service");
const logger_1 = require("../utils/logger");
const validateCouponExists = async (req, res, next) => {
    try {
        const { code } = req.params;
        if (!code) {
            res.status(400).json({
                success: false,
                message: 'Código de cupón requerido'
            });
            return;
        }
        const coupon = await coupon_service_1.couponService.getCouponByCode(code);
        if (!coupon) {
            res.status(404).json({
                success: false,
                message: 'Cupón no encontrado'
            });
            return;
        }
        req.coupon = coupon;
        next();
    }
    catch (error) {
        logger_1.logger.error('Error en validateCouponExists:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.validateCouponExists = validateCouponExists;
const validateCouponAvailability = async (req, res, next) => {
    try {
        const coupon = req.coupon;
        if (!coupon) {
            res.status(400).json({
                success: false,
                message: 'Cupón no encontrado en la solicitud'
            });
            return;
        }
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);
        if (!coupon.isActive) {
            res.status(400).json({
                success: false,
                message: 'El cupón está inactivo',
                error: 'COUPON_INACTIVE'
            });
            return;
        }
        if (now < validFrom) {
            res.status(400).json({
                success: false,
                message: `El cupón será válido a partir del ${validFrom.toLocaleDateString()}`,
                error: 'COUPON_NOT_STARTED'
            });
            return;
        }
        if (now > validUntil) {
            res.status(400).json({
                success: false,
                message: `El cupón expiró el ${validUntil.toLocaleDateString()}`,
                error: 'COUPON_EXPIRED'
            });
            return;
        }
        if (coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses) {
            res.status(400).json({
                success: false,
                message: 'El cupón ha alcanzado su límite de usos',
                error: 'COUPON_EXHAUSTED'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error en validateCouponAvailability:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.validateCouponAvailability = validateCouponAvailability;
const validateCouponPlanCompatibility = (req, res, next) => {
    try {
        const coupon = req.coupon;
        const { planCode } = req.query;
        if (!coupon) {
            res.status(400).json({
                success: false,
                message: 'Cupón no encontrado en la solicitud'
            });
            return;
        }
        if (planCode && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
            const planCodeUpper = planCode.toUpperCase();
            if (!coupon.applicablePlans.includes(planCodeUpper)) {
                res.status(400).json({
                    success: false,
                    message: `El cupón no es aplicable al plan ${planCode}`,
                    error: 'COUPON_PLAN_INCOMPATIBLE',
                    details: {
                        applicablePlans: coupon.applicablePlans
                    }
                });
                return;
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error en validateCouponPlanCompatibility:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.validateCouponPlanCompatibility = validateCouponPlanCompatibility;
const couponRateLimit = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();
    return (req, res, next) => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();
        const clientAttempts = attempts.get(clientId);
        if (clientAttempts && now > clientAttempts.resetTime) {
            attempts.delete(clientId);
        }
        const current = attempts.get(clientId) || { count: 0, resetTime: now + windowMs };
        if (current.count >= maxAttempts) {
            const remainingTime = Math.ceil((current.resetTime - now) / 1000 / 60);
            res.status(429).json({
                success: false,
                message: `Demasiados intentos de validación de cupones. Intenta nuevamente en ${remainingTime} minutos.`,
                error: 'RATE_LIMIT_EXCEEDED'
            });
            return;
        }
        current.count++;
        attempts.set(clientId, current);
        next();
    };
};
exports.couponRateLimit = couponRateLimit;
const logCouponUsage = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        try {
            const coupon = req.coupon;
            const responseData = typeof data === 'string' ? JSON.parse(data) : data;
            if (coupon && responseData.success) {
                logger_1.logger.info('Cupón utilizado exitosamente', {
                    couponCode: coupon.code,
                    couponType: coupon.type,
                    userId: req.user?.id,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error en logCouponUsage:', error);
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.logCouponUsage = logCouponUsage;
const requireCouponAdminPermissions = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
            return;
        }
        if (user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Permisos insuficientes para gestionar cupones'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error en requireCouponAdminPermissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.requireCouponAdminPermissions = requireCouponAdminPermissions;
const sanitizeCouponCode = (req, res, next) => {
    try {
        if (req.params.code) {
            req.params.code = req.params.code.toUpperCase().trim();
        }
        if (req.body.code) {
            req.body.code = req.body.code.toUpperCase().trim();
        }
        if (req.body.planCode) {
            req.body.planCode = req.body.planCode.toUpperCase().trim();
        }
        if (req.body.applicablePlans && Array.isArray(req.body.applicablePlans)) {
            req.body.applicablePlans = req.body.applicablePlans.map((plan) => plan.toUpperCase().trim());
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Error en sanitizeCouponCode:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.sanitizeCouponCode = sanitizeCouponCode;
