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
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradePlanController = exports.validatePlanOperationsController = exports.validateUpgradePurchaseController = exports.validateProfilePlanUpgradeController = exports.getProfilePlanInfoController = exports.getUserProfilesSummaryController = exports.validateUserProfileLimitsController = exports.getUserUsageStatsController = exports.getProfilesWithStories = exports.createMissingVerifications = exports.verifyProfileName = exports.getProfilesPost = exports.purchaseUpgradeController = exports.subscribeProfileController = exports.deleteProfile = exports.updateProfile = exports.getProfileById = exports.getAllProfilesForAdmin = exports.getProfilesForHome = exports.getProfiles = exports.getDeletedProfilesController = exports.restoreProfileController = exports.hardDeleteProfileController = exports.userSoftDeleteProfileController = exports.showProfileController = exports.softDeleteProfileController = exports.hideProfileController = exports.createProfile = void 0;
const service = __importStar(require("./profile.service"));
const profile_service_1 = require("./profile.service");
const config_parameter_service_1 = require("../config-parameter/config-parameter.service");
const upgrade_model_1 = require("../plans/upgrade.model");
const business_validation_service_1 = require("../validation/business-validation.service");
const createProfile = async (req, res) => {
    try {
        const { profileData, purchasedPlan } = req.body;
        if (!profileData) {
            return res.status(400).json({
                success: false,
                message: 'Los datos del perfil (profileData) son requeridos'
            });
        }
        let planId = null;
        let planCode = null;
        let planDays = null;
        let generateInvoice = true;
        let couponCode = null;
        if (purchasedPlan) {
            planId = purchasedPlan.planId;
            planCode = purchasedPlan.planCode;
            planDays = purchasedPlan.planDays || purchasedPlan.variantDays;
            couponCode = purchasedPlan.couponCode || null;
            if (purchasedPlan.hasOwnProperty('generateInvoice')) {
                generateInvoice = purchasedPlan.generateInvoice;
            }
            if ((!planId && !planCode) || !planDays) {
                return res.status(400).json({
                    success: false,
                    message: 'El plan comprado debe incluir planId (o planCode) y planDays/variantDays'
                });
            }
            const defaultPlanConfig = await config_parameter_service_1.ConfigParameterService.findByKey('system.default_plan');
            const defaultPlanCode = defaultPlanConfig?.value?.enabled && defaultPlanConfig?.value?.planCode
                ? defaultPlanConfig.value.planCode
                : 'AMATISTA';
            if (planCode !== 'GRATIS' && planCode !== defaultPlanCode) {
                await (0, business_validation_service_1.validatePaidPlanAssignment)(profileData.userId || profileData.user, planCode, undefined, purchasedPlan.orderId);
            }
        }
        const result = await (0, profile_service_1.createProfileWithInvoice)({
            ...profileData,
            planId: planId,
            planCode: planCode,
            planDays: planDays,
            generateInvoice: generateInvoice,
            couponCode: couponCode
        });
        if (!result.profile) {
            throw new Error('Error interno: No se pudo crear el perfil');
        }
        if (result.invoice) {
            res.status(201).json({
                success: true,
                message: 'Perfil creado exitosamente. Se ha generado una factura pendiente.',
                profile: {
                    _id: result.profile._id,
                    name: result.profile.name
                },
                invoice: {
                    _id: result.invoice._id,
                    invoiceNumber: result.invoice.invoiceNumber,
                    totalAmount: result.invoice.totalAmount,
                    expiresAt: result.invoice.expiresAt,
                    status: result.invoice.status
                },
                whatsAppMessage: result.whatsAppMessage,
                paymentRequired: true
            });
        }
        else {
            res.status(201).json({
                success: true,
                message: 'Perfil creado exitosamente.',
                profile: {
                    _id: result.profile._id,
                    name: result.profile.name
                },
                whatsAppMessage: result.whatsAppMessage,
                paymentRequired: false
            });
        }
    }
    catch (err) {
        if (err instanceof business_validation_service_1.BusinessValidationError) {
            return res.status(409).json({ message: err.message });
        }
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(400).json({ message });
    }
};
exports.createProfile = createProfile;
const hideProfileController = async (req, res) => {
    try {
        const { id: profileId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const result = await (0, profile_service_1.hideProfile)(profileId, userId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.hideProfileController = hideProfileController;
const softDeleteProfileController = async (req, res) => {
    try {
        const { id: profileId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const result = await (0, profile_service_1.softDeleteProfile)(profileId, userId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.softDeleteProfileController = softDeleteProfileController;
const showProfileController = async (req, res) => {
    try {
        const { id: profileId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const result = await (0, profile_service_1.showProfile)(profileId, userId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.showProfileController = showProfileController;
const userSoftDeleteProfileController = async (req, res) => {
    try {
        const { id: profileId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const result = await (0, profile_service_1.softDeleteProfile)(profileId, userId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.userSoftDeleteProfileController = userSoftDeleteProfileController;
const hardDeleteProfileController = async (req, res) => {
    try {
        const { id: profileId } = req.params;
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden eliminar perfiles permanentemente'
            });
        }
        const result = await (0, profile_service_1.hardDeleteProfile)(profileId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.hardDeleteProfileController = hardDeleteProfileController;
const restoreProfileController = async (req, res) => {
    try {
        const { id: profileId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const result = await (0, profile_service_1.restoreProfile)(profileId, userId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.restoreProfileController = restoreProfileController;
const getDeletedProfilesController = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden ver perfiles eliminados'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await (0, profile_service_1.getDeletedProfiles)(page, limit);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.getDeletedProfilesController = getDeletedProfilesController;
const getProfiles = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const fields = req.query.fields;
    const profiles = await service.getProfiles(page, limit, fields);
    res.json(profiles);
};
exports.getProfiles = getProfiles;
const getProfilesForHome = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const profiles = await service.getProfilesForHome(page, limit);
        res.json(profiles);
    }
    catch (error) {
        console.error('Error getting profiles for home:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getProfilesForHome = getProfilesForHome;
const getAllProfilesForAdmin = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden ver todos los perfiles'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const fields = req.query.fields;
        const userId = req.query.userId;
        const result = await service.getAllProfilesForAdmin(page, limit, fields, userId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error getting all profiles for admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.getAllProfilesForAdmin = getAllProfilesForAdmin;
const getProfileById = async (req, res) => {
    const profile = await service.getProfileById(req.params.id);
    if (!profile)
        return res.status(404).json({ message: 'Perfil no encontrado' });
    res.json(profile);
};
exports.getProfileById = getProfileById;
const updateProfile = async (req, res) => {
    const updated = await service.updateProfile(req.params.id, req.body);
    res.json(updated);
};
exports.updateProfile = updateProfile;
const deleteProfile = async (req, res) => {
    await service.deleteProfile(req.params.id);
    res.status(204).send();
};
exports.deleteProfile = deleteProfile;
const subscribeProfileController = async (req, res) => {
    try {
        const { id } = req.params;
        const { planCode, variantDays, orderId } = req.body;
        if (!planCode || !variantDays) {
            return res.status(400).json({ error: 'planCode y variantDays son requeridos' });
        }
        const profile = await service.getProfileById(id);
        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        await (0, business_validation_service_1.validatePaidPlanAssignment)(profile.user.toString(), planCode, id, orderId);
        const updatedProfile = await (0, profile_service_1.subscribeProfile)(id, planCode, variantDays);
        res.status(200).json(updatedProfile);
    }
    catch (error) {
        console.error('Error subscribing profile:', error);
        if (error instanceof business_validation_service_1.BusinessValidationError) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message.includes('no encontrado') || error.message.includes('no encontrada')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Máximo')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.subscribeProfileController = subscribeProfileController;
const purchaseUpgradeController = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, orderId, generateInvoice = true } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'code es requerido' });
        }
        const profile = await service.getProfileById(id);
        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        const user = req.user;
        const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
        if (isAdmin && !generateInvoice) {
            const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findOne({ code });
            if (!upgrade) {
                return res.status(404).json({ error: `Upgrade ${code} no encontrado` });
            }
            const now = new Date();
            const endAt = new Date(now.getTime() + (upgrade.durationHours * 60 * 60 * 1000));
            const existingUpgradeIndex = profile.upgrades.findIndex(u => u.code === code && u.endAt > now);
            if (existingUpgradeIndex !== -1) {
                if (upgrade.stackingPolicy === 'extend') {
                    profile.upgrades[existingUpgradeIndex].endAt = new Date(Math.max(profile.upgrades[existingUpgradeIndex].endAt.getTime(), endAt.getTime()));
                }
                else if (upgrade.stackingPolicy === 'replace') {
                    profile.upgrades[existingUpgradeIndex].endAt = endAt;
                    profile.upgrades[existingUpgradeIndex].startAt = now;
                }
            }
            else {
                profile.upgrades.push({
                    code,
                    startAt: now,
                    endAt,
                    purchaseAt: now
                });
            }
            await profile.save();
            return res.status(200).json({
                success: true,
                message: `Upgrade ${code} activado exitosamente`,
                profile,
                paymentRequired: false
            });
        }
        await (0, business_validation_service_1.validateUpgradePurchase)(profile.user._id.toString(), id, code, orderId);
        const result = await (0, profile_service_1.purchaseUpgrade)(id, code, profile.user._id.toString());
        res.status(200).json({
            profile: result.profile,
            invoice: result.invoice,
            upgradeCode: result.upgradeCode,
            status: result.status,
            message: result.message,
            whatsAppMessage: result.whatsAppMessage,
            paymentRequired: true
        });
    }
    catch (error) {
        console.error('Error purchasing upgrade:', error);
        if (error instanceof business_validation_service_1.BusinessValidationError) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.status === 409 || error.message.includes('ya activo') || error.message.includes('sin un plan activo')) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message.includes('requeridos no activos')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.purchaseUpgradeController = purchaseUpgradeController;
const getProfilesPost = async (req, res) => {
    try {
        const { page = 1, limit = 10, fields } = req.body;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const profiles = await service.getProfiles(pageNum, limitNum, fields);
        res.json(profiles);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(400).json({ message });
    }
};
exports.getProfilesPost = getProfilesPost;
const verifyProfileName = async (req, res) => {
    try {
        const { profileName } = req.query;
        const profile = await service.checkProfileNameExists(profileName);
        res.status(200).send(profile);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(400).json({ message });
    }
};
exports.verifyProfileName = verifyProfileName;
const createMissingVerifications = async (req, res) => {
    try {
        const result = await service.createMissingVerifications();
        res.status(200).json({
            success: true,
            message: `Proceso completado. ${result.created} verificaciones creadas, ${result.errors} errores.`,
            data: result
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(500).json({
            success: false,
            message: `Error al crear verificaciones faltantes: ${message}`
        });
    }
};
exports.createMissingVerifications = createMissingVerifications;
const getProfilesWithStories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const profiles = await service.getProfilesWithStories(page, limit);
        res.json(profiles);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(500).json({ message });
    }
};
exports.getProfilesWithStories = getProfilesWithStories;
const getUserUsageStatsController = async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = await (0, business_validation_service_1.getUserUsageStats)(userId);
        res.json(stats);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(500).json({ message });
    }
};
exports.getUserUsageStatsController = getUserUsageStatsController;
const validateUserProfileLimitsController = async (req, res) => {
    try {
        const { userId } = req.params;
        const { planCode } = req.query;
        const validation = await service.validateUserProfileLimits(userId, planCode);
        res.json(validation);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(500).json({ message });
    }
};
exports.validateUserProfileLimitsController = validateUserProfileLimitsController;
const getUserProfilesSummaryController = async (req, res) => {
    try {
        const { userId } = req.params;
        const summary = await service.getUserProfilesSummary(userId);
        res.json(summary);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(500).json({ message });
    }
};
exports.getUserProfilesSummaryController = getUserProfilesSummaryController;
const getProfilePlanInfoController = async (req, res) => {
    try {
        const { profileId } = req.params;
        const profile = await service.getProfileById(profileId);
        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        if (!profile.planAssignment) {
            return res.status(404).json({ error: 'El perfil no tiene un plan asignado' });
        }
        const now = new Date();
        const expiresAt = new Date(profile.planAssignment.expiresAt);
        const isActive = expiresAt > now;
        const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const planInfo = {
            planCode: profile.planAssignment.planCode,
            variantDays: profile.planAssignment.variantDays,
            startAt: profile.planAssignment.startAt,
            expiresAt: profile.planAssignment.expiresAt,
            isActive,
            daysRemaining
        };
        res.json(planInfo);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(400).json({ message });
    }
};
exports.getProfilePlanInfoController = getProfilePlanInfoController;
const validateProfilePlanUpgradeController = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { planCode } = req.query;
        if (!planCode) {
            return res.status(400).json({ error: 'planCode es requerido' });
        }
        const validation = await service.validateProfilePlanUpgrade(profileId, planCode);
        res.json(validation);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(400).json({ message });
    }
};
exports.validateProfilePlanUpgradeController = validateProfilePlanUpgradeController;
const validateUpgradePurchaseController = async (req, res) => {
    try {
        const { profileId, upgradeCode } = req.params;
        if (!upgradeCode) {
            return res.status(400).json({ error: 'upgradeCode es requerido' });
        }
        const profile = await service.getProfileById(profileId);
        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        const now = new Date();
        const hasActivePlan = profile.planAssignment &&
            new Date(profile.planAssignment.expiresAt) > now;
        if (!hasActivePlan) {
            return res.json({
                canPurchase: false,
                reason: 'Necesitas un plan activo para comprar upgrades'
            });
        }
        if (upgradeCode === 'IMPULSO') {
            const activeUpgrades = profile.upgrades?.filter(u => new Date(u.endAt) > now) || [];
            const hasDestacado = activeUpgrades.some(u => u.code === 'DESTACADO');
            if (!hasDestacado) {
                return res.json({
                    canPurchase: false,
                    reason: 'Necesitas tener "Destacado" activo para comprar "Impulso"'
                });
            }
        }
        if (upgradeCode === 'DESTACADO' && profile.planAssignment?.planCode === 'DIAMANTE') {
            return res.json({
                canPurchase: false,
                reason: 'El plan Diamante ya incluye "Destacado" permanente'
            });
        }
        const activeUpgrades = profile.upgrades?.filter(u => new Date(u.endAt) > now) || [];
        const hasUpgradeActive = activeUpgrades.some(u => u.code === upgradeCode);
        if (hasUpgradeActive) {
            return res.json({
                canPurchase: false,
                reason: `El upgrade ${upgradeCode} ya está activo`
            });
        }
        res.json({ canPurchase: true });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(500).json({ message });
    }
};
exports.validateUpgradePurchaseController = validateUpgradePurchaseController;
const validatePlanOperationsController = async (req, res) => {
    try {
        const { profileId } = req.params;
        if (!profileId) {
            res.status(400).json({ message: 'profileId es requerido' });
            return;
        }
        const profile = await service.getProfileById(profileId);
        if (!profile) {
            res.status(404).json({ message: 'Perfil no encontrado' });
            return;
        }
        const activeProfilesCount = await (0, profile_service_1.getActiveProfilesCount)(profile.user.toString());
        const maxActiveProfiles = 10;
        const canPurchase = activeProfilesCount < maxActiveProfiles;
        const canUpgrade = true;
        const canRenew = profile.planAssignment && new Date(profile.planAssignment.expiresAt) > new Date();
        let reason = '';
        if (!canPurchase) {
            reason = `Has alcanzado el límite máximo de ${maxActiveProfiles} perfiles con plan activo`;
        }
        res.json({
            canPurchase,
            canUpgrade,
            canRenew,
            activeProfilesCount,
            maxActiveProfiles,
            reason
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        res.status(500).json({ message });
    }
};
exports.validatePlanOperationsController = validatePlanOperationsController;
const upgradePlanController = async (req, res) => {
    try {
        const { id: profileId } = req.params;
        const { newPlanCode, variantDays } = req.body;
        if (!profileId) {
            return res.status(400).json({
                success: false,
                error: 'profileId es requerido'
            });
        }
        if (!newPlanCode) {
            return res.status(400).json({
                success: false,
                error: 'newPlanCode es requerido'
            });
        }
        const updatedProfile = await service.upgradePlan(profileId, newPlanCode, variantDays);
        res.json({
            success: true,
            message: 'Plan actualizado exitosamente',
            profile: updatedProfile
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Error al hacer upgrade del plan'
        });
    }
};
exports.upgradePlanController = upgradePlanController;
