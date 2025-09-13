"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plansService = exports.PlansService = void 0;
const plan_model_1 = require("./plan.model");
const upgrade_model_1 = require("./upgrade.model");
const profile_model_1 = require("../profile/profile.model");
const config_parameter_service_1 = require("../config-parameter/config-parameter.service");
const invoice_service_1 = __importDefault(require("../payments/invoice.service"));
const mongoose_1 = require("mongoose");
const generateWhatsAppMessage = async (userId, profileId, invoiceId) => {
    try {
        const [companyName, companyWhatsApp] = await Promise.all([
            config_parameter_service_1.ConfigParameterService.getValue('company.name'),
            config_parameter_service_1.ConfigParameterService.getValue('company.whatsapp.number')
        ]);
        if (!companyName || !companyWhatsApp) {
            return null;
        }
        let message;
        if (invoiceId) {
            message = `¡Hola! 👋\n\nTu compra ha sido procesada exitosamente. ✅\n\n📋 **Detalles:**\n• ID de Factura: ${invoiceId}\n• Perfil: ${profileId}\n\n¡Gracias por confiar en ${companyName}! 🙏\n\nSi tienes alguna pregunta, no dudes en contactarnos.`;
        }
        else {
            message = `¡Hola! 👋\n\nTu plan gratuito ha sido activado exitosamente. ✅\n\n📋 **Detalles:**\n• Perfil: ${profileId}\n\n¡Bienvenido a ${companyName}! 🎉\n\nSi tienes alguna pregunta, no dudes en contactarnos.`;
        }
        return {
            userId,
            profileId,
            company: companyName,
            companyNumber: companyWhatsApp,
            message
        };
    }
    catch (error) {
        return null;
    }
};
class PlansService {
    async createPlan(planData) {
        try {
            if (planData.includedUpgrades && planData.includedUpgrades.length > 0) {
                for (const upgradeCode of planData.includedUpgrades) {
                    const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findByCode(upgradeCode);
                    if (!upgrade) {
                        throw new Error(`El upgrade '${upgradeCode}' no existe`);
                    }
                }
            }
            const plan = new plan_model_1.PlanDefinitionModel(planData);
            return await plan.save();
        }
        catch (error) {
            if (error.code === 11000) {
                throw new Error(`El código '${planData.code}' ya existe`);
            }
            throw error;
        }
    }
    async getAllPlans(options = {}) {
        const { page = 1, limit = 10, sortBy = 'level', sortOrder = 'asc', activeOnly = true, search } = options;
        const query = {};
        if (activeOnly) {
            query.active = true;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;
        const [plans, total] = await Promise.all([
            plan_model_1.PlanDefinitionModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            plan_model_1.PlanDefinitionModel.countDocuments(query)
        ]);
        return {
            plans,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    async getPlanById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new Error('ID de plan inválido');
        }
        return await plan_model_1.PlanDefinitionModel.findById(id);
    }
    async getPlanByCode(code) {
        return await plan_model_1.PlanDefinitionModel.findByCode(code);
    }
    async getPlansByLevel(level, activeOnly = true) {
        return await plan_model_1.PlanDefinitionModel.findByLevel(level, activeOnly);
    }
    async updatePlan(id, updateData) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new Error('ID de plan inválido');
        }
        if (updateData.includedUpgrades && updateData.includedUpgrades.length > 0) {
            for (const upgradeCode of updateData.includedUpgrades) {
                const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findByCode(upgradeCode);
                if (!upgrade) {
                    throw new Error(`El upgrade '${upgradeCode}' no existe`);
                }
            }
        }
        return await plan_model_1.PlanDefinitionModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
    async deletePlan(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new Error('ID de plan inválido');
        }
        const result = await plan_model_1.PlanDefinitionModel.findByIdAndDelete(id);
        return result !== null;
    }
    async createUpgrade(upgradeData) {
        try {
            const upgrade = new upgrade_model_1.UpgradeDefinitionModel(upgradeData);
            const isValid = await upgrade.validateCircularDependency();
            if (!isValid) {
                throw new Error('Dependencia circular detectada en los upgrades');
            }
            return await upgrade.save();
        }
        catch (error) {
            if (error.code === 11000) {
                throw new Error(`El código '${upgradeData.code}' ya existe`);
            }
            throw error;
        }
    }
    async getAllUpgrades(options = {}) {
        const { page = 1, limit = 10, sortBy = 'code', sortOrder = 'asc', activeOnly = true } = options;
        const query = activeOnly ? { active: true } : {};
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;
        const [upgrades, total] = await Promise.all([
            upgrade_model_1.UpgradeDefinitionModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            upgrade_model_1.UpgradeDefinitionModel.countDocuments(query)
        ]);
        return {
            upgrades,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    async getUpgradeById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new Error('ID de upgrade inválido');
        }
        return await upgrade_model_1.UpgradeDefinitionModel.findById(id);
    }
    async getUpgradeByCode(code) {
        return await upgrade_model_1.UpgradeDefinitionModel.findByCode(code);
    }
    async getUpgradesByRequirement(requirementCode, activeOnly = true) {
        return await upgrade_model_1.UpgradeDefinitionModel.findByRequirement(requirementCode, activeOnly);
    }
    async updateUpgrade(id, updateData) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new Error('ID de upgrade inválido');
        }
        if (updateData.requires) {
            const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findById(id);
            if (upgrade) {
                const tempUpgrade = { ...upgrade.toObject(), ...updateData };
                const testUpgrade = new upgrade_model_1.UpgradeDefinitionModel(tempUpgrade);
                const isValid = await testUpgrade.validateCircularDependency();
                if (!isValid) {
                    throw new Error('La actualización crearía una dependencia circular');
                }
            }
        }
        return await upgrade_model_1.UpgradeDefinitionModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
    async deleteUpgrade(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new Error('ID de upgrade inválido');
        }
        const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findById(id);
        if (upgrade) {
            const plansUsingUpgrade = await plan_model_1.PlanDefinitionModel.find({
                includedUpgrades: upgrade.code
            });
            if (plansUsingUpgrade.length > 0) {
                const planNames = plansUsingUpgrade.map(p => p.name).join(', ');
                throw new Error(`No se puede eliminar el upgrade '${upgrade.code}' porque está siendo usado por los planes: ${planNames}`);
            }
            const dependentUpgrades = await upgrade_model_1.UpgradeDefinitionModel.findByRequirement(upgrade.code);
            if (dependentUpgrades.length > 0) {
                const upgradeNames = dependentUpgrades.map(u => u.name).join(', ');
                throw new Error(`No se puede eliminar el upgrade '${upgrade.code}' porque es requerido por: ${upgradeNames}`);
            }
        }
        const result = await upgrade_model_1.UpgradeDefinitionModel.findByIdAndDelete(id);
        return result !== null;
    }
    async validatePlanUpgrades(planCode) {
        const plan = await plan_model_1.PlanDefinitionModel.findByCode(planCode);
        if (!plan) {
            throw new Error(`Plan '${planCode}' no encontrado`);
        }
        const invalidUpgrades = [];
        for (const upgradeCode of plan.includedUpgrades) {
            const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findByCode(upgradeCode);
            if (!upgrade || !upgrade.active) {
                invalidUpgrades.push(upgradeCode);
            }
        }
        return {
            valid: invalidUpgrades.length === 0,
            invalidUpgrades
        };
    }
    async getUpgradeDependencyTree(upgradeCode) {
        const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findByCode(upgradeCode);
        if (!upgrade) {
            return null;
        }
        const dependencies = [];
        for (const reqCode of upgrade.requires) {
            const dep = await upgrade_model_1.UpgradeDefinitionModel.findByCode(reqCode);
            if (dep)
                dependencies.push(dep);
        }
        const dependents = await upgrade_model_1.UpgradeDefinitionModel.findByRequirement(upgradeCode);
        return {
            upgrade,
            dependencies,
            dependents
        };
    }
    async purchasePlan(profileId, planCode, variantDays) {
        const profile = await profile_model_1.ProfileModel.findById(profileId);
        if (!profile) {
            throw new Error('Perfil no encontrado');
        }
        const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: planCode, active: true });
        if (!plan) {
            throw new Error('Plan no encontrado o inactivo');
        }
        const variant = plan.variants.find(v => v.days === variantDays);
        if (!variant) {
            throw new Error('Variante de plan no encontrada');
        }
        const now = new Date();
        if (profile.planAssignment && profile.planAssignment.expiresAt > now) {
            throw new Error('El perfil ya tiene un plan activo. No se puede comprar otro plan hasta que expire el actual.');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + variantDays);
        let invoiceId;
        if (variant.price > 0) {
            try {
                const invoice = await invoice_service_1.default.generateInvoice({
                    userId: profile.user.toString(),
                    profileId: profileId,
                    planCode: planCode,
                    planDays: variantDays,
                    upgradeCodes: []
                });
                invoiceId = invoice.id;
                profile.paymentHistory.push(new mongoose_1.Types.ObjectId(invoice._id));
                profile.isActive = false;
                const tempDate = new Date('1970-01-01');
                profile.planAssignment = {
                    planCode: planCode,
                    variantDays: variantDays,
                    startAt: tempDate,
                    expiresAt: tempDate
                };
                await profile.save();
            }
            catch (error) {
                throw new Error('Error al generar factura para el plan');
            }
        }
        else {
            profile.planAssignment = {
                planCode: planCode,
                variantDays: variantDays,
                startAt: now,
                expiresAt: expiresAt
            };
            profile.isActive = true;
            await profile.save();
        }
        const whatsAppMessage = await generateWhatsAppMessage(profile.user.toString(), profileId, invoiceId);
        return {
            profileId,
            planCode,
            variantDays,
            expiresAt,
            purchaseAt: now,
            price: variant.price,
            invoiceId,
            whatsAppMessage
        };
    }
    async renewPlan(profileId, planCode, variantDays) {
        const profile = await profile_model_1.ProfileModel.findById(profileId);
        if (!profile) {
            throw new Error('Perfil no encontrado');
        }
        const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: planCode, active: true });
        if (!plan) {
            throw new Error('Plan no encontrado o inactivo');
        }
        const variant = plan.variants.find(v => v.days === variantDays);
        if (!variant) {
            throw new Error('Variante de plan no encontrada');
        }
        const now = new Date();
        if (!profile.planAssignment || profile.planAssignment.planCode !== planCode) {
            throw new Error('El perfil no tiene un plan activo del tipo especificado para renovar');
        }
        const currentExpiresAt = profile.planAssignment.expiresAt;
        const newExpiresAt = new Date(currentExpiresAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + variantDays);
        let invoiceId;
        if (variant.price > 0) {
            try {
                const invoice = await invoice_service_1.default.generateInvoice({
                    userId: profile.user.toString(),
                    profileId: profileId,
                    planCode: planCode,
                    planDays: variantDays,
                    upgradeCodes: []
                });
                invoiceId = invoice.id;
                profile.paymentHistory.push(new mongoose_1.Types.ObjectId(invoice._id));
                profile.isActive = false;
                await profile.save();
            }
            catch (error) {
                throw new Error('Error al generar factura para la renovación del plan');
            }
        }
        else {
            profile.planAssignment.expiresAt = newExpiresAt;
            profile.planAssignment.variantDays = variantDays;
            await profile.save();
        }
        const whatsAppMessage = await generateWhatsAppMessage(profile.user.toString(), profileId, invoiceId);
        return {
            profileId,
            planCode,
            variantDays,
            previousExpiresAt: currentExpiresAt,
            newExpiresAt,
            renewedAt: now,
            price: variant.price,
            invoiceId,
            whatsAppMessage
        };
    }
}
exports.PlansService = PlansService;
exports.plansService = new PlansService();
