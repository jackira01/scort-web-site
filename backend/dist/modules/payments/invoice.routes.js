"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const invoice_controller_1 = __importDefault(require("./invoice.controller"));
const payment_webhook_controller_1 = __importDefault(require("./payment-webhook.controller"));
const router = (0, express_1.Router)();
const validateObjectId = (field) => [
    (0, express_validator_1.param)(field).isMongoId().withMessage(`${field} debe ser un ID válido de MongoDB`)
];
const validateCreateInvoice = [
    (0, express_validator_1.body)('profileId')
        .isMongoId()
        .withMessage('profileId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.body)('userId')
        .isMongoId()
        .withMessage('userId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.body)('planCode')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('planCode debe ser una cadena válida'),
    (0, express_validator_1.body)('planDays')
        .optional()
        .isInt({ min: 1 })
        .withMessage('planDays debe ser un número entero positivo'),
    (0, express_validator_1.body)('upgradeCodes')
        .optional()
        .isArray()
        .withMessage('upgradeCodes debe ser un array'),
    (0, express_validator_1.body)('upgradeCodes.*')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Cada código de upgrade debe ser una cadena válida'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres')
];
const validatePaginationQuery = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero positivo'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe ser un número entre 1 y 100'),
    (0, express_validator_1.query)('profileId')
        .optional()
        .isMongoId()
        .withMessage('profileId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.query)('userId')
        .optional()
        .isMongoId()
        .withMessage('userId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'paid', 'cancelled', 'expired'])
        .withMessage('status debe ser: pending, paid, cancelled o expired'),
    (0, express_validator_1.query)('fromDate')
        .optional()
        .isISO8601()
        .withMessage('fromDate debe ser una fecha válida en formato ISO8601'),
    (0, express_validator_1.query)('toDate')
        .optional()
        .isISO8601()
        .withMessage('toDate debe ser una fecha válida en formato ISO8601')
];
const validatePaymentMethod = [
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('paymentMethod debe ser una cadena válida')
];
const validateCancelReason = [
    (0, express_validator_1.body)('reason')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('reason no puede exceder 500 caracteres')
];
router.get('/stats', invoice_controller_1.default.getInvoiceStats);
router.post('/expire-overdue', invoice_controller_1.default.expireOverdueInvoices);
router.post('/webhook/payment-confirmed', [
    (0, express_validator_1.body)('invoiceId')
        .isMongoId()
        .withMessage('invoiceId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.body)('paymentData')
        .optional()
        .isObject()
        .withMessage('paymentData debe ser un objeto válido')
], payment_webhook_controller_1.default.confirmPayment);
router.post('/webhook/payment-cancelled', [
    (0, express_validator_1.body)('invoiceId')
        .isMongoId()
        .withMessage('invoiceId debe ser un ID válido de MongoDB'),
    (0, express_validator_1.body)('reason')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('reason no puede exceder 500 caracteres')
], payment_webhook_controller_1.default.cancelPayment);
router.get('/user/:userId/pending', validateObjectId('userId'), invoice_controller_1.default.getPendingInvoicesByUser);
router.get('/user/:userId', [
    validateObjectId('userId')[0],
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero positivo'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe ser un número entre 1 y 100'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'paid', 'cancelled', 'expired'])
        .withMessage('status debe ser: pending, paid, cancelled o expired')
], invoice_controller_1.default.getAllInvoicesByUser);
router.post('/', validateCreateInvoice, invoice_controller_1.default.createInvoice);
router.get('/', validatePaginationQuery, invoice_controller_1.default.getInvoices);
router.get('/:id/whatsapp-data', validateObjectId('id'), invoice_controller_1.default.getWhatsAppData);
router.get('/:id/status', validateObjectId('id'), payment_webhook_controller_1.default.getInvoiceStatus);
router.put('/:id/pay', validateObjectId('id'), validatePaymentMethod, invoice_controller_1.default.markAsPaid);
router.put('/:id/cancel', validateObjectId('id'), validateCancelReason, invoice_controller_1.default.cancelInvoice);
router.patch('/:id/status', validateObjectId('id'), [
    (0, express_validator_1.body)('status')
        .isIn(['pending', 'paid', 'cancelled', 'expired'])
        .withMessage('Estado debe ser uno de: pending, paid, cancelled, expired'),
    (0, express_validator_1.body)('reason')
        .optional()
        .isString()
        .withMessage('La razón debe ser una cadena de texto')
], invoice_controller_1.default.updateInvoiceStatus);
router.get('/:id', validateObjectId('id'), invoice_controller_1.default.getInvoiceById);
exports.default = router;
