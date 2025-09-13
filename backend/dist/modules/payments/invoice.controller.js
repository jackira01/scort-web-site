"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invoice_service_1 = __importDefault(require("./invoice.service"));
const express_validator_1 = require("express-validator");
const whatsapp_service_1 = require("../../utils/whatsapp.service");
class InvoiceController {
    async createInvoice(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
                return;
            }
            const invoiceData = {
                profileId: req.body.profileId,
                userId: req.body.userId,
                planCode: req.body.planCode,
                planDays: req.body.planDays,
                upgradeCodes: req.body.upgradeCodes || [],
                notes: req.body.notes
            };
            const invoice = await invoice_service_1.default.generateInvoice(invoiceData);
            res.status(201).json({
                success: true,
                message: 'Factura creada exitosamente',
                data: invoice
            });
        }
        catch (error) {
            console.error('Error creating invoice:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async getInvoiceById(req, res) {
        try {
            const { id } = req.params;
            const invoice = await invoice_service_1.default.getInvoiceById(id);
            if (!invoice) {
                res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: invoice
            });
        }
        catch (error) {
            console.error('Error getting invoice:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async getInvoices(req, res) {
        try {
            const filters = {
                profileId: req.query.profileId,
                userId: req.query.userId,
                status: req.query.status,
                fromDate: req.query.fromDate ? new Date(req.query.fromDate) : undefined,
                toDate: req.query.toDate ? new Date(req.query.toDate) : undefined
            };
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await invoice_service_1.default.getInvoices(filters, page, limit);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error getting invoices:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async getPendingInvoicesByUser(req, res) {
        try {
            const { userId } = req.params;
            const invoices = await invoice_service_1.default.getPendingInvoicesByUser(userId);
            res.status(200).json({
                success: true,
                data: invoices
            });
        }
        catch (error) {
            console.error('Error getting pending invoices:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async getAllInvoicesByUser(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    errors: errors.array()
                });
                return;
            }
            const { userId } = req.params;
            const filters = {
                userId,
                status: req.query.status
            };
            if (req.query.invoiceId) {
                filters._id = req.query.invoiceId;
            }
            if (req.query.profileId) {
                filters.profileId = req.query.profileId;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await invoice_service_1.default.getInvoices(filters, page, limit);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error getting user invoices:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async markAsPaid(req, res) {
        try {
            const { id } = req.params;
            const { paymentMethod } = req.body;
            const invoice = await invoice_service_1.default.markAsPaid(id, paymentMethod);
            res.status(200).json({
                success: true,
                message: 'Factura marcada como pagada',
                data: invoice
            });
        }
        catch (error) {
            console.error('Error marking invoice as paid:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async cancelInvoice(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const invoice = await invoice_service_1.default.cancelInvoice(id, reason);
            res.status(200).json({
                success: true,
                message: 'Factura cancelada',
                data: invoice
            });
        }
        catch (error) {
            console.error('Error cancelling invoice:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async updateInvoiceStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;
            const validStatuses = ['pending', 'paid', 'cancelled', 'expired'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Estado inválido. Los estados válidos son: pending, paid, cancelled, expired'
                });
                return;
            }
            const invoice = await invoice_service_1.default.updateInvoiceStatus(id, status, reason);
            res.status(200).json({
                success: true,
                message: 'Estado de factura actualizado',
                data: invoice
            });
        }
        catch (error) {
            console.error('Error updating invoice status:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async getInvoiceStats(req, res) {
        try {
            const userId = req.query.userId;
            const stats = await invoice_service_1.default.getInvoiceStats(userId);
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error getting invoice stats:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async expireOverdueInvoices(req, res) {
        try {
            const expiredCount = await invoice_service_1.default.expireOverdueInvoices();
            res.status(200).json({
                success: true,
                message: `${expiredCount} facturas marcadas como vencidas`,
                data: { expiredCount }
            });
        }
        catch (error) {
            console.error('Error expiring overdue invoices:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    async getWhatsAppData(req, res) {
        try {
            const { id } = req.params;
            const { phoneNumber } = req.query;
            const invoice = await invoice_service_1.default.getInvoiceById(id);
            if (!invoice) {
                res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada'
                });
                return;
            }
            if (invoice.status !== 'pending') {
                res.status(400).json({
                    success: false,
                    message: 'Solo se pueden procesar facturas pendientes'
                });
                return;
            }
            if (phoneNumber && !whatsapp_service_1.WhatsAppService.isValidPhoneNumber(phoneNumber)) {
                res.status(400).json({
                    success: false,
                    message: 'Número de teléfono inválido'
                });
                return;
            }
            const populatedInvoice = await invoice_service_1.default.getInvoiceById(id, true);
            if (!populatedInvoice) {
                res.status(404).json({
                    success: false,
                    message: 'No se pudieron obtener los datos completos de la factura'
                });
                return;
            }
            const profile = populatedInvoice.profileId;
            const user = populatedInvoice.userId;
            const whatsappData = whatsapp_service_1.WhatsAppService.generateWhatsAppMessageData(populatedInvoice, profile, user, phoneNumber);
            res.status(200).json({
                success: true,
                data: {
                    invoiceId: invoice._id,
                    message: whatsappData.message,
                    whatsappUrl: whatsappData.url,
                    phoneNumber: whatsappData.phoneNumber,
                    totalAmount: invoice.totalAmount,
                    expiresAt: invoice.expiresAt,
                    items: invoice.items,
                    profileName: profile.name,
                    userName: user.name
                }
            });
        }
        catch (error) {
            console.error('Error generating WhatsApp data:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
}
exports.default = new InvoiceController();
