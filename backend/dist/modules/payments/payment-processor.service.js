"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessorService = void 0;
const profile_model_1 = require("../profile/profile.model");
const invoice_model_1 = __importDefault(require("./invoice.model"));
const plan_model_1 = require("../plans/plan.model");
const upgrade_model_1 = require("../plans/upgrade.model");
class PaymentProcessorService {
    static async processInvoicePayment(invoiceId) {
        try {
            const invoice = await invoice_model_1.default.findById(invoiceId);
            if (!invoice) {
                throw new Error('Factura no encontrada');
            }
            if (invoice.status !== 'paid') {
                throw new Error('La factura no está marcada como pagada');
            }
            const profile = await profile_model_1.ProfileModel.findById(invoice.profileId);
            if (!profile) {
                throw new Error('Perfil no encontrado');
            }
            for (const item of invoice.items) {
                if (item.type === 'plan') {
                    await this.processPlanPayment(profile, item);
                }
                else if (item.type === 'upgrade') {
                    await this.processUpgradePayment(profile, item);
                }
            }
            profile.isActive = true;
            profile.visible = true;
            await profile.save();
            return {
                success: true,
                profile,
                message: 'Pago procesado exitosamente'
            };
        }
        catch (error) {
            console.error('❌ Error procesando pago de factura:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    static async processPlanPayment(profile, planItem) {
        console.log(`📦 Procesando pago de plan ${planItem.code}`);
        const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: planItem.code });
        if (!plan) {
            throw new Error(`Plan ${planItem.code} no encontrado`);
        }
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + planItem.days);
        profile.planAssignment = {
            planId: plan._id,
            planCode: planItem.code,
            variantDays: planItem.days,
            startAt: now,
            expiresAt: expiresAt
        };
        if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
            for (const upgradeCode of plan.includedUpgrades) {
                const existingUpgrade = profile.upgrades.find(upgrade => upgrade.code === upgradeCode && upgrade.endAt > now);
                if (!existingUpgrade) {
                    const newUpgrade = {
                        code: upgradeCode,
                        startAt: now,
                        endAt: expiresAt,
                        purchaseAt: now
                    };
                    profile.upgrades.push(newUpgrade);
                }
            }
        }
        console.log(`✅ Plan ${planItem.code} asignado al perfil ${profile._id}, reemplazando plan anterior`);
    }
    static async processUpgradePayment(profile, upgradeItem) {
        console.log(`⚡ Procesando pago de upgrade ${upgradeItem.code}`);
        const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findOne({ code: upgradeItem.code });
        if (!upgrade) {
            throw new Error(`Upgrade ${upgradeItem.code} no encontrado`);
        }
        const now = new Date();
        const endAt = new Date(now.getTime() + (upgrade.durationHours * 60 * 60 * 1000));
        const existingUpgradeIndex = profile.upgrades.findIndex(u => u.code === upgradeItem.code && u.endAt > now);
        switch (upgrade.stackingPolicy) {
            case 'replace':
                if (existingUpgradeIndex !== -1) {
                    profile.upgrades.splice(existingUpgradeIndex, 1);
                }
                break;
            case 'extend':
                if (existingUpgradeIndex !== -1) {
                    const existingUpgrade = profile.upgrades[existingUpgradeIndex];
                    existingUpgrade.endAt = new Date(existingUpgrade.endAt.getTime() + (upgrade.durationHours * 60 * 60 * 1000));
                    return;
                }
                break;
            case 'reject':
                if (existingUpgradeIndex !== -1) {
                    return;
                }
                break;
        }
        const newUpgrade = {
            code: upgradeItem.code,
            startAt: now,
            endAt,
            purchaseAt: now
        };
        profile.upgrades.push(newUpgrade);
    }
    static async processInvoiceCancellation(invoiceId) {
        try {
            console.log(`❌ Procesando cancelación de factura ${invoiceId}`);
            const invoice = await invoice_model_1.default.findById(invoiceId);
            if (!invoice) {
                throw new Error('Factura no encontrada');
            }
            const profile = await profile_model_1.ProfileModel.findById(invoice.profileId);
            if (!profile) {
                throw new Error('Perfil no encontrado');
            }
            console.log(`🔄 Reactivando perfil ${profile._id} con plan actual: ${profile.planAssignment?.planCode}`);
            profile.isActive = true;
            await profile.save();
            console.log(`✅ Perfil ${profile._id} reactivado con plan ${profile.planAssignment?.planCode} después de cancelación`);
            return {
                success: true,
                message: 'Cancelación procesada exitosamente - perfil reactivado con plan actual'
            };
        }
        catch (error) {
            console.error('❌ Error procesando cancelación de factura:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
}
exports.PaymentProcessorService = PaymentProcessorService;
exports.default = PaymentProcessorService;
