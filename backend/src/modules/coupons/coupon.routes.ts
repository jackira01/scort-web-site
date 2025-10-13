import { Router, Request, Response, NextFunction } from 'express';
import { couponController } from './coupon.controller';
import { devAuthMiddleware } from '../../middlewares/auth.middleware';
import { adminMiddleware } from '../../middlewares/admin.middleware';
import { body, param, query } from 'express-validator';
import { validateRequest, validateObjectId, validateQuery } from '../../middlewares/validation.middleware';
import {
  validateCouponExists,
  validateCouponAvailability,
  validateCouponPlanCompatibility,
  couponRateLimit,
  logCouponUsage,
  sanitizeCouponCode
} from '../../middlewares/coupon.middleware';

const router = Router();

// Validaciones
const validateCreateCoupon = [
  body('code')
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('El código debe contener solo letras mayúsculas, números, guiones y guiones bajos'),
  body('name')
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('type')
    .isIn(['percentage', 'fixed_amount', 'plan_assignment'])
    .withMessage('Tipo de cupón inválido'),
  body('value')
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
  body('planCode')
    .optional()
    .isString()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Permitir valores vacíos
      }
      if (!/^[A-Z0-9_-]+$/.test(value)) {
        throw new Error('El código de plan debe contener solo letras mayúsculas, números, guiones y guiones bajos');
      }
      return true;
    }),
  body('applicablePlans')
    .optional()
    .isArray()
    .withMessage('Los planes aplicables deben ser un array'),
  body('applicablePlans.*')
    .optional()
    .isString()
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Los códigos de planes deben contener solo letras mayúsculas, números, guiones y guiones bajos'),
  body('maxUses')
    .isInt({ min: -1 })
    .withMessage('Los usos máximos deben ser -1 (ilimitado) o mayor a 0'),
  body('validFrom')
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('validUntil')
    .isISO8601()
    .withMessage('Fecha de vencimiento inválida')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('La fecha de vencimiento debe ser posterior a la fecha de inicio');
      }
      return true;
    }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano')
];

const validateUpdateCoupon = [
  body('name')
    .optional()
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('value')
    .optional()
    .isNumeric()
    .withMessage('El valor debe ser numérico'),
  body('planCode')
    .optional()
    .isString()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Permitir valores vacíos
      }
      if (!/^[A-Z0-9_-]+$/.test(value)) {
        throw new Error('El código de plan debe contener solo letras mayúsculas, números, guiones y guiones bajos');
      }
      return true;
    }),
  body('applicablePlans')
    .optional()
    .isArray()
    .withMessage('Los planes aplicables deben ser un array'),
  body('applicablePlans.*')
    .optional()
    .isString()
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Los códigos de planes deben contener solo letras mayúsculas, números, guiones y guiones bajos'),
  body('maxUses')
    .optional()
    .isInt({ min: -1 })
    .withMessage('Los usos máximos deben ser -1 (ilimitado) o mayor a 0'),
  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Fecha de vencimiento inválida'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano')
];

const validateCouponCode = [
  param('code')
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Código de cupón inválido')
];

const validateApplyCoupon = [
  body('code')
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage('Código de cupón requerido'),
  body('originalPrice')
    .isNumeric()
    .custom((value) => {
      if (value < 0) {
        throw new Error('El precio original debe ser mayor o igual a 0');
      }
      return true;
    }),
  body('planCode')
    .optional()
    .isString()
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Código de plan inválido')
];

const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  query('type')
    .optional()
    .isIn(['percentage', 'fixed_amount', 'plan_assignment'])
    .withMessage('Tipo de cupón inválido'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive debe ser true o false'),
  query('validOnly')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('validOnly debe ser true o false')
];

// Rutas públicas (sin autenticación)
router.post('/apply', 
  couponRateLimit(5, 10 * 60 * 1000), // 5 intentos por 10 minutos
  sanitizeCouponCode,
  validateRequest(validateApplyCoupon), 
  logCouponUsage,
  couponController.applyCoupon
);

// Validar cupón por código (endpoint original)
router.get('/validate/:code', 
  couponRateLimit(10, 15 * 60 * 1000), // 10 intentos por 15 minutos
  sanitizeCouponCode,
  validateRequest([...validateCouponCode]), 
  validateCouponExists,
  validateCouponAvailability,
  validateCouponPlanCompatibility,
  logCouponUsage,
  couponController.validateCoupon
);

// Validar cupón para frontend (endpoint simplificado)
router.post('/validate-frontend', 
  couponRateLimit(10, 15 * 60 * 1000), // 10 intentos por 15 minutos
  sanitizeCouponCode,
  validateRequest([
    body('code')
      .isString()
      .isLength({ min: 3, max: 50 })
      .matches(/^[A-Z0-9_-]+$/i)
      .withMessage('Código de cupón inválido')
  ]), 
  logCouponUsage,
  couponController.validateCouponForFrontend
);

// Rutas de administración (requieren autenticación y permisos de admin)
router.use(devAuthMiddleware);
router.use(adminMiddleware);

// CRUD de cupones - Reordenando para debugging
router.get('/stats', couponController.getCouponStats);
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Middleware antes de validateQueryParams - Query:', req.query);
  next();
}, validateQuery(validateQueryParams), (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Middleware después de validateQuery - Query:', req.query);
  next();
}, couponController.getCoupons);
router.post('/', sanitizeCouponCode, validateRequest(validateCreateCoupon), couponController.createCoupon);
router.get('/:id', validateRequest([validateObjectId('id')]), couponController.getCouponById);
router.put('/:id', sanitizeCouponCode, validateRequest([validateObjectId('id'), ...validateUpdateCoupon]), couponController.updateCoupon);
router.delete('/:id', validateRequest([validateObjectId('id')]), couponController.deleteCoupon);

export default router;