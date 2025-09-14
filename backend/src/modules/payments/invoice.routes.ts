import { Router } from 'express';
import { body, param, query } from 'express-validator';
import invoiceController from './invoice.controller';
import PaymentWebhookController from './payment-webhook.controller';

const router = Router();

// Validaciones comunes
const validateObjectId = (field: string) => [
  param(field).isMongoId().withMessage(`${field} debe ser un ID válido de MongoDB`)
];

const validateCreateInvoice = [
  body('profileId')
    .isMongoId()
    .withMessage('profileId debe ser un ID válido de MongoDB'),
  body('userId')
    .isMongoId()
    .withMessage('userId debe ser un ID válido de MongoDB'),
  body('planCode')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('planCode debe ser una cadena válida'),
  body('planDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('planDays debe ser un número entero positivo'),
  body('upgradeCodes')
    .optional()
    .isArray()
    .withMessage('upgradeCodes debe ser un array'),
  body('upgradeCodes.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Cada código de upgrade debe ser una cadena válida'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
];

const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe ser un número entre 1 y 100'),
  query('profileId')
    .optional()
    .isMongoId()
    .withMessage('profileId debe ser un ID válido de MongoDB'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('userId debe ser un ID válido de MongoDB'),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'cancelled', 'expired'])
    .withMessage('status debe ser: pending, paid, cancelled o expired'),
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('fromDate debe ser una fecha válida en formato ISO8601'),
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('toDate debe ser una fecha válida en formato ISO8601')
];

const validatePaymentMethod = [
  body('paymentMethod')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('paymentMethod debe ser una cadena válida')
];

const validateCancelReason = [
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('reason no puede exceder 500 caracteres')
];

// Rutas específicas (deben ir antes de las rutas con parámetros)
router.get('/stats', invoiceController.getInvoiceStats);
router.post('/expire-overdue', invoiceController.expireOverdueInvoices);

// Rutas con parámetros de usuario
router.get(
  '/user/:userId/pending',
  validateObjectId('userId'),
  invoiceController.getPendingInvoicesByUser
);

router.get(
  '/user/:userId',
  [
    validateObjectId('userId')[0],
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un número entero positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit debe ser un número entre 1 y 100'),
    query('status')
      .optional()
      .isIn(['pending', 'paid', 'cancelled', 'expired'])
      .withMessage('status debe ser: pending, paid, cancelled o expired')
  ],
  invoiceController.getAllInvoicesByUser
);

// Rutas principales
router.post(
  '/',
  validateCreateInvoice,
  invoiceController.createInvoice
);

router.get(
  '/',
  validatePaginationQuery,
  invoiceController.getInvoices
);

// Rutas con ID de factura
router.get(
  '/:id',
  validateObjectId('id'),
  invoiceController.getInvoiceById
);

router.get(
  '/:id/whatsapp-data',
  validateObjectId('id'),
  invoiceController.getWhatsAppData
);

router.put(
  '/:id/pay',
  validateObjectId('id'),
  validatePaymentMethod,
  invoiceController.markAsPaid
);

router.put(
  '/:id/cancel',
  validateObjectId('id'),
  validateCancelReason,
  invoiceController.cancelInvoice
);

router.patch(
  '/:id/status',
  validateObjectId('id'),
  [
    body('status')
      .isIn(['pending', 'paid', 'cancelled', 'expired'])
      .withMessage('Estado debe ser uno de: pending, paid, cancelled, expired'),
    body('reason')
      .optional()
      .isString()
      .withMessage('La razón debe ser una cadena de texto')
  ],
  invoiceController.updateInvoiceStatus
);

// Rutas de webhooks de pago
router.post(
  '/webhook/payment-confirmed',
  [
    body('invoiceId')
      .isMongoId()
      .withMessage('invoiceId debe ser un ID válido de MongoDB'),
    body('paymentData')
      .optional()
      .isObject()
      .withMessage('paymentData debe ser un objeto válido')
  ],
  PaymentWebhookController.confirmPayment
);

router.post(
  '/webhook/payment-cancelled',
  [
    body('invoiceId')
      .isMongoId()
      .withMessage('invoiceId debe ser un ID válido de MongoDB'),
    body('reason')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('reason no puede exceder 500 caracteres')
  ],
  PaymentWebhookController.cancelPayment
);

router.get(
  '/:id/status',
  validateObjectId('id'),
  PaymentWebhookController.getInvoiceStatus
);

export default router;