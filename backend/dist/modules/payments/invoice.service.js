"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const invoice_model_1 = __importDefault(require("./invoice.model"));
const plan_model_1 = require("../plans/plan.model");
const upgrade_model_1 = require("../plans/upgrade.model");
class InvoiceService {
    async generateInvoice(data) {
        const { profileId, userId, planCode, planDays, upgradeCodes = [], notes } = data;
        console.log('🟠 [INVOICE SERVICE] Iniciando generación de factura:', {
            profileId,
            userId,
            planCode,
            planDays,
            upgradeCodes,
            notes
        });
        if (!mongoose_1.default.Types.ObjectId.isValid(profileId)) {
            console.error('❌ [INVOICE SERVICE] ID de perfil inválido:', profileId);
            throw new Error('ID de perfil inválido');
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            console.error('❌ [INVOICE SERVICE] ID de usuario inválido:', userId);
            throw new Error('ID de usuario inválido');
        }
        console.log('✅ [INVOICE SERVICE] IDs validados correctamente');
        const items = [];
        let totalAmount = 0;
        if (planCode && planDays) {
            console.log('🟠 [INVOICE SERVICE] Procesando plan para factura:', { planCode, planDays });
            const plan = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
            if (!plan) {
                console.error('❌ [INVOICE SERVICE] Plan no encontrado:', planCode);
                throw new Error(`Plan con código ${planCode} no encontrado`);
            }
            console.log('✅ [INVOICE SERVICE] Plan encontrado:', { name: plan.name, code: plan.code });
            const variant = plan.variants.find((v) => v.days === planDays);
            if (!variant) {
                console.error('❌ [INVOICE SERVICE] Variante no encontrada:', { planCode, planDays });
                throw new Error(`Variante de ${planDays} días no encontrada para el plan ${planCode}`);
            }
            console.log('✅ [INVOICE SERVICE] Variante encontrada:', { days: variant.days, price: variant.price });
            const planItem = {
                type: 'plan',
                code: planCode,
                name: plan.name,
                days: planDays,
                price: variant.price,
                quantity: 1
            };
            items.push(planItem);
            totalAmount += variant.price;
            console.log('✅ [INVOICE SERVICE] Item de plan agregado:', planItem);
        }
        if (upgradeCodes.length > 0) {
            for (const upgradeCode of upgradeCodes) {
                const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findOne({ code: upgradeCode, active: true });
                if (!upgrade) {
                    throw new Error(`Upgrade con código ${upgradeCode} no encontrado`);
                }
                const upgradePrice = 0;
                const upgradeItem = {
                    type: 'upgrade',
                    code: upgradeCode,
                    name: upgrade.name,
                    price: upgradePrice,
                    quantity: 1
                };
                items.push(upgradeItem);
                totalAmount += upgradePrice;
            }
        }
        if (items.length === 0) {
            console.error('❌ [INVOICE SERVICE] No se pueden crear facturas sin items');
            throw new Error('No se pueden crear facturas sin items');
        }
        console.log('🟠 [INVOICE SERVICE] Resumen de items procesados:', {
            totalItems: items.length,
            totalAmount,
            items: items.map(item => ({ type: item.type, code: item.code, price: item.price }))
        });
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        console.log('🟠 [INVOICE SERVICE] Fecha de expiración calculada:', expiresAt);
        const invoiceData = {
            profileId: new mongoose_1.default.Types.ObjectId(profileId),
            userId: new mongoose_1.default.Types.ObjectId(userId),
            status: 'pending',
            items,
            totalAmount,
            expiresAt,
            notes
        };
        console.log('🟠 [INVOICE SERVICE] Creando factura con datos:', {
            profileId,
            userId,
            status: invoiceData.status,
            totalAmount: invoiceData.totalAmount,
            expiresAt: invoiceData.expiresAt,
            itemsCount: invoiceData.items.length
        });
        const invoice = new invoice_model_1.default(invoiceData);
        const savedInvoice = await invoice.save();
        console.log('✅ [INVOICE SERVICE] Factura creada y guardada exitosamente:', {
            invoiceId: savedInvoice._id,
            totalAmount: savedInvoice.totalAmount,
            status: savedInvoice.status,
            expiresAt: savedInvoice.expiresAt
        });
        return savedInvoice;
    }
    async getInvoiceById(invoiceId, populate = false) {
        if (!mongoose_1.default.Types.ObjectId.isValid(invoiceId)) {
            throw new Error('ID de factura inválido');
        }
        let query = invoice_model_1.default.findById(invoiceId);
        if (populate) {
            query = query
                .populate('profileId', 'name email phone')
                .populate('userId', 'name email');
        }
        return await query;
    }
    async getInvoices(filters = {}, page = 1, limit = 10) {
        const query = {};
        if (filters._id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(filters._id)) {
                throw new Error('ID de factura inválido');
            }
            query._id = new mongoose_1.default.Types.ObjectId(filters._id);
        }
        if (filters.profileId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(filters.profileId)) {
                throw new Error('ID de perfil inválido');
            }
            query.profileId = new mongoose_1.default.Types.ObjectId(filters.profileId);
        }
        if (filters.userId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(filters.userId)) {
                throw new Error('ID de usuario inválido');
            }
            query.userId = new mongoose_1.default.Types.ObjectId(filters.userId);
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.fromDate || filters.toDate) {
            query.createdAt = {};
            if (filters.fromDate) {
                query.createdAt.$gte = filters.fromDate;
            }
            if (filters.toDate) {
                query.createdAt.$lte = filters.toDate;
            }
        }
        const skip = (page - 1) * limit;
        const total = await invoice_model_1.default.countDocuments(query);
        const invoices = await invoice_model_1.default.find(query)
            .populate('profileId', 'name email phone')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return {
            invoices,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }
    async getPendingInvoicesByUser(userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new Error('ID de usuario inválido');
        }
        return await invoice_model_1.default.find({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
            .populate('profileId', 'name email phone')
            .sort({ createdAt: -1 });
    }
    async markAsPaid(invoiceId, paymentMethod) {
        if (!mongoose_1.default.Types.ObjectId.isValid(invoiceId)) {
            throw new Error('ID de factura inválido');
        }
        const invoice = await invoice_model_1.default.findById(invoiceId);
        if (!invoice) {
            throw new Error('Factura no encontrada');
        }
        if (invoice.status !== 'pending') {
            throw new Error(`No se puede marcar como pagada una factura con estado: ${invoice.status}`);
        }
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        if (paymentMethod) {
            invoice.paymentMethod = paymentMethod;
        }
        return await invoice.save();
    }
    async cancelInvoice(invoiceId, reason) {
        if (!mongoose_1.default.Types.ObjectId.isValid(invoiceId)) {
            throw new Error('ID de factura inválido');
        }
        const invoice = await invoice_model_1.default.findById(invoiceId);
        if (!invoice) {
            throw new Error('Factura no encontrada');
        }
        if (invoice.status === 'paid') {
            throw new Error('No se puede cancelar una factura ya pagada');
        }
        invoice.status = 'cancelled';
        invoice.cancelledAt = new Date();
        if (reason) {
            invoice.notes = invoice.notes ? `${invoice.notes}\n\nCancelada: ${reason}` : `Cancelada: ${reason}`;
        }
        return await invoice.save();
    }
    async updateInvoiceStatus(invoiceId, newStatus, reason) {
        if (!mongoose_1.default.Types.ObjectId.isValid(invoiceId)) {
            throw new Error('ID de factura inválido');
        }
        const invoice = await invoice_model_1.default.findById(invoiceId);
        if (!invoice) {
            throw new Error('Factura no encontrada');
        }
        const oldStatus = invoice.status;
        invoice.status = newStatus;
        if (newStatus === 'paid' && oldStatus !== 'paid') {
            invoice.paidAt = new Date();
        }
        else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
            invoice.cancelledAt = new Date();
        }
        if (reason) {
            const statusChangeNote = `Estado cambiado de '${oldStatus}' a '${newStatus}': ${reason}`;
            invoice.notes = invoice.notes ? `${invoice.notes}\n\n${statusChangeNote}` : statusChangeNote;
        }
        const updatedInvoice = await invoice.save();
        try {
            if (newStatus === 'paid' && oldStatus !== 'paid') {
                console.log(`💰 [INVOICE SERVICE] Factura ${invoiceId} marcada como pagada, procesando planAssignment...`);
                const PaymentProcessorService = await Promise.resolve().then(() => __importStar(require('./payment-processor.service')));
                const result = await PaymentProcessorService.PaymentProcessorService.processInvoicePayment(invoiceId);
                console.log(`✅ [INVOICE SERVICE] PlanAssignment procesado:`, result.message);
            }
            else if (['cancelled', 'expired'].includes(newStatus) && oldStatus === 'pending') {
                console.log(`🚫 [INVOICE SERVICE] Factura ${invoiceId} ${newStatus}, manteniendo plan actual del perfil`);
            }
            else if (newStatus === 'pending' && ['cancelled', 'expired'].includes(oldStatus)) {
                console.log(`🔄 [INVOICE SERVICE] Factura ${invoiceId} reactivada a pendiente desde ${oldStatus}`);
            }
        }
        catch (error) {
            console.error(`❌ [INVOICE SERVICE] Error procesando planAssignment para factura ${invoiceId}:`, error);
        }
        return updatedInvoice;
    }
    async expireOverdueInvoices() {
        const result = await invoice_model_1.default.updateMany({
            status: 'pending',
            expiresAt: { $lt: new Date() }
        }, {
            $set: {
                status: 'expired',
                updatedAt: new Date()
            }
        });
        return result.modifiedCount;
    }
    async getInvoiceStats(userId) {
        const matchStage = {};
        if (userId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                throw new Error('ID de usuario inválido');
            }
            matchStage.userId = new mongoose_1.default.Types.ObjectId(userId);
        }
        const stats = await invoice_model_1.default.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    paid: {
                        $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    expired: {
                        $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
                    },
                    totalAmount: { $sum: '$totalAmount' },
                    paidAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'paid'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        return stats[0] || {
            total: 0,
            pending: 0,
            paid: 0,
            cancelled: 0,
            expired: 0,
            totalAmount: 0,
            paidAmount: 0
        };
    }
}
exports.default = new InvoiceService();
