"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentWebhookController = void 0;
const invoice_model_1 = __importDefault(require("./invoice.model"));
const payment_processor_service_1 = __importDefault(require("./payment-processor.service"));
class PaymentWebhookController {
    static async confirmPayment(req, res) {
        try {
            const { invoiceId, paymentData } = req.body;
            if (!invoiceId) {
                return res.status(400).json({
                    error: 'invoiceId es requerido'
                });
            }
            const invoice = await invoice_model_1.default.findById(invoiceId);
            if (!invoice) {
                return res.status(404).json({
                    error: 'Factura no encontrada'
                });
            }
            if (invoice.status !== 'pending') {
                return res.status(400).json({
                    error: `La factura ya está en estado: ${invoice.status}`
                });
            }
            invoice.status = 'paid';
            invoice.paidAt = new Date();
            if (paymentData) {
                invoice.paymentData = paymentData;
            }
            await invoice.save();
            const result = await payment_processor_service_1.default.processInvoicePayment(invoiceId);
            if (!result.success) {
                return res.status(500).json({
                    error: 'Error procesando el pago',
                    details: result.message
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Pago confirmado y procesado exitosamente',
                invoice: {
                    id: invoice._id,
                    status: invoice.status,
                    paidAt: invoice.paidAt
                },
                profile: {
                    id: result.profile?._id,
                    isActive: result.profile?.isActive,
                    planAssignment: result.profile?.planAssignment
                }
            });
        }
        catch (error) {
            return res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    static async cancelPayment(req, res) {
        try {
            const { invoiceId, reason } = req.body;
            if (!invoiceId) {
                return res.status(400).json({
                    error: 'invoiceId es requerido'
                });
            }
            const invoice = await invoice_model_1.default.findById(invoiceId);
            if (!invoice) {
                return res.status(404).json({
                    error: 'Factura no encontrada'
                });
            }
            if (invoice.status !== 'pending') {
                return res.status(400).json({
                    error: `La factura ya está en estado: ${invoice.status}`
                });
            }
            invoice.status = 'cancelled';
            invoice.cancelledAt = new Date();
            if (reason) {
                invoice.cancellationReason = reason;
            }
            await invoice.save();
            const result = await payment_processor_service_1.default.processInvoiceCancellation(invoiceId);
            if (!result.success) {
                return res.status(500).json({
                    error: 'Error procesando la cancelación',
                    details: result.message
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Pago cancelado exitosamente',
                invoice: {
                    id: invoice._id,
                    status: invoice.status,
                    cancelledAt: invoice.cancelledAt,
                    reason: reason
                }
            });
        }
        catch (error) {
            return res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    static async getInvoiceStatus(req, res) {
        try {
            const { invoiceId } = req.params;
            const invoice = await invoice_model_1.default.findById(invoiceId)
                .populate('profileId', 'name isActive planAssignment')
                .populate('userId', 'email');
            if (!invoice) {
                return res.status(404).json({
                    error: 'Factura no encontrada'
                });
            }
            return res.status(200).json({
                invoice: {
                    id: invoice._id,
                    status: invoice.status,
                    totalAmount: invoice.totalAmount,
                    createdAt: invoice.createdAt,
                    expiresAt: invoice.expiresAt,
                    paidAt: invoice.paidAt,
                    cancelledAt: invoice.cancelledAt,
                    items: invoice.items,
                    profile: invoice.profileId,
                    user: invoice.userId
                }
            });
        }
        catch (error) {
            return res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
exports.PaymentWebhookController = PaymentWebhookController;
exports.default = PaymentWebhookController;
