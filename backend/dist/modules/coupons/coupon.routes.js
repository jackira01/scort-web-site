"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("./coupon.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const admin_middleware_1 = require("../../middlewares/admin.middleware");
const express_validator_1 = require("express-validator");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const coupon_middleware_1 = require("../../middlewares/coupon.middleware");
const router = (0, express_1.Router)();
const validateCreateCoupon = [
    (0, express_validator_1.body)('code')
        .isString()
        .isLength({ min: 3, max: 50 })
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('El código debe contener solo letras mayúsculas, números, guiones y guiones bajos'),
    (0, express_validator_1.body)('name')
        .isString()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    (0, express_validator_1.body)('type')
        .isIn(['percentage', 'fixed_amount', 'plan_assignment'])
        .withMessage('Tipo de cupón inválido'),
    (0, express_validator_1.body)('value')
        .isNumeric()
        .custom((value, { req }) => {
        if (req.body.type === 'percentage' && (value < 0 || value > 100)) {
            throw new Error('El valor porcentual debe estar entre 0 y 100');
        }
        if (req.body.type === 'fixed_amount' && value < 0) {
            throw new Error('El valor fijo debe ser mayor o igual a 0');
        }
        return true;
    }),
    (0, express_validator_1.body)('planCode')
        .optional()
        .isString()
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('El código de plan debe contener solo letras mayúsculas, números, guiones y guiones bajos'),
    (0, express_validator_1.body)('applicablePlans')
        .optional()
        .isArray()
        .withMessage('Los planes aplicables deben ser un array'),
    (0, express_validator_1.body)('applicablePlans.*')
        .optional()
        .isString()
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Los códigos de planes deben contener solo letras mayúsculas, números, guiones y guiones bajos'),
    (0, express_validator_1.body)('maxUses')
        .isInt({ min: -1 })
        .withMessage('Los usos máximos deben ser -1 (ilimitado) o mayor a 0'),
    (0, express_validator_1.body)('validFrom')
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
    (0, express_validator_1.body)('validUntil')
        .isISO8601()
        .withMessage('Fecha de vencimiento inválida')
        .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.validFrom)) {
            throw new Error('La fecha de vencimiento debe ser posterior a la fecha de inicio');
        }
        return true;
    }),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive debe ser un valor booleano')
];
const validateUpdateCoupon = [
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    (0, express_validator_1.body)('value')
        .optional()
        .isNumeric()
        .withMessage('El valor debe ser numérico'),
    (0, express_validator_1.body)('planCode')
        .optional()
        .isString()
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('El código de plan debe contener solo letras mayúsculas, números, guiones y guiones bajos'),
    (0, express_validator_1.body)('applicablePlans')
        .optional()
        .isArray()
        .withMessage('Los planes aplicables deben ser un array'),
    (0, express_validator_1.body)('applicablePlans.*')
        .optional()
        .isString()
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Los códigos de planes deben contener solo letras mayúsculas, números, guiones y guiones bajos'),
    (0, express_validator_1.body)('maxUses')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Los usos máximos deben ser -1 (ilimitado) o mayor a 0'),
    (0, express_validator_1.body)('validFrom')
        .optional()
        .isISO8601()
        .withMessage('Fecha de inicio inválida'),
    (0, express_validator_1.body)('validUntil')
        .optional()
        .isISO8601()
        .withMessage('Fecha de vencimiento inválida'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive debe ser un valor booleano')
];
const validateCouponCode = [
    (0, express_validator_1.param)('code')
        .isString()
        .isLength({ min: 3, max: 50 })
        .matches(/^[A-Z0-9_-]+$/i)
        .withMessage('Código de cupón inválido')
];
const validateApplyCoupon = [
    (0, express_validator_1.body)('code')
        .isString()
        .isLength({ min: 3, max: 50 })
        .withMessage('Código de cupón requerido'),
    (0, express_validator_1.body)('originalPrice')
        .isNumeric()
        .custom((value) => {
        if (value < 0) {
            throw new Error('El precio original debe ser mayor o igual a 0');
        }
        return true;
    }),
    (0, express_validator_1.body)('planCode')
        .optional()
        .isString()
        .matches(/^[A-Z0-9_-]+$/i)
        .withMessage('Código de plan inválido')
];
const validateQueryParams = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número mayor a 0'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100'),
    (0, express_validator_1.query)('type')
        .optional()
        .isIn(['percentage', 'fixed_amount', 'plan_assignment'])
        .withMessage('Tipo de cupón inválido'),
    (0, express_validator_1.query)('isActive')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('isActive debe ser true o false'),
    (0, express_validator_1.query)('validOnly')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('validOnly debe ser true o false')
];
router.post('/apply', (0, coupon_middleware_1.couponRateLimit)(5, 10 * 60 * 1000), coupon_middleware_1.sanitizeCouponCode, validateApplyCoupon, validation_middleware_1.validateRequest, coupon_middleware_1.logCouponUsage, coupon_controller_1.couponController.applyCoupon);
router.get('/validate/:code', (0, coupon_middleware_1.couponRateLimit)(10, 15 * 60 * 1000), coupon_middleware_1.sanitizeCouponCode, validateCouponCode, validation_middleware_1.validateRequest, coupon_middleware_1.validateCouponExists, coupon_middleware_1.validateCouponAvailability, coupon_middleware_1.validateCouponPlanCompatibility, coupon_middleware_1.logCouponUsage, coupon_controller_1.couponController.validateCoupon);
router.use(auth_middleware_1.authenticateToken);
router.use(admin_middleware_1.adminMiddleware);
router.post('/', coupon_middleware_1.sanitizeCouponCode, validateCreateCoupon, validation_middleware_1.validateRequest, coupon_controller_1.couponController.createCoupon);
router.get('/stats', coupon_controller_1.couponController.getCouponStats);
router.get('/', validateQueryParams, validation_middleware_1.validateRequest, coupon_controller_1.couponController.getCoupons);
router.get('/:id', (0, validation_middleware_1.validateObjectId)('id'), validation_middleware_1.validateRequest, coupon_controller_1.couponController.getCouponById);
router.put('/:id', coupon_middleware_1.sanitizeCouponCode, (0, validation_middleware_1.validateObjectId)('id'), validateUpdateCoupon, validation_middleware_1.validateRequest, coupon_controller_1.couponController.updateCoupon);
router.delete('/:id', (0, validation_middleware_1.validateObjectId)('id'), validation_middleware_1.validateRequest, coupon_controller_1.couponController.deleteCoupon);
exports.default = router;
