"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessValidationError = void 0;
exports.validatePaidProfileLimit = validatePaidProfileLimit;
exports.validateAmatistaLimit = validateAmatistaLimit;
exports.validateUpgradeEligibility = validateUpgradeEligibility;
exports.validatePurchaseIdempotency = validatePurchaseIdempotency;
exports.validatePaidPlanAssignment = validatePaidPlanAssignment;
exports.validateUpgradePurchase = validateUpgradePurchase;
exports.getUserUsageStats = getUserUsageStats;
const plan_model_1 = require("../plans/plan.model");
const profile_model_1 = require("../profile/profile.model");
class BusinessValidationError extends Error {
    constructor(message, code, statusCode = 409) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'BusinessValidationError';
    }
}
exports.BusinessValidationError = BusinessValidationError;
async function validatePaidProfileLimit(userId, excludeProfileId) {
    const now = new Date();
    const query = {
        user: userId,
        'planAssignment.expiresAt': { $gt: now },
    };
    if (excludeProfileId) {
        query._id = { $ne: excludeProfileId };
    }
    const paidProfilesCount = await profile_model_1.ProfileModel.countDocuments(query).exec();
    if (paidProfilesCount >= 10) {
        throw new BusinessValidationError('No puedes tener más de 10 perfiles con plan pago activo', 'PAID_PROFILE_LIMIT_EXCEEDED', 409);
    }
}
async function validateAmatistaLimit(userId, excludeProfileId) {
    const now = new Date();
    const amatistaPlan = await plan_model_1.PlanDefinitionModel.findOne({
        name: 'AMATISTA',
    }).exec();
    if (!amatistaPlan) {
        throw new BusinessValidationError('Plan AMATISTA no encontrado', 'AMATISTA_PLAN_NOT_FOUND', 500);
    }
    const query = {
        user: userId,
        visible: true,
        'planAssignment.planId': amatistaPlan._id,
        'planAssignment.expiresAt': { $gt: now },
    };
    if (excludeProfileId) {
        query._id = { $ne: excludeProfileId };
    }
    const amatistaProfilesCount = await profile_model_1.ProfileModel.countDocuments(query).exec();
    if (amatistaProfilesCount >= 3) {
        throw new BusinessValidationError('No puedes tener más de 3 perfiles AMATISTA visibles simultáneamente', 'AMATISTA_LIMIT_EXCEEDED', 409);
    }
}
async function validateUpgradeEligibility(profileId) {
    const profile = await profile_model_1.ProfileModel.findById(profileId).exec();
    if (!profile) {
        throw new BusinessValidationError('Perfil no encontrado', 'PROFILE_NOT_FOUND', 404);
    }
    if (!profile.visible) {
        throw new BusinessValidationError('No se pueden comprar upgrades para perfiles no visibles', 'PROFILE_NOT_VISIBLE', 409);
    }
    const now = new Date();
    if (!profile.planAssignment || profile.planAssignment.expiresAt <= now) {
        throw new BusinessValidationError('No se pueden comprar upgrades para perfiles sin plan vigente', 'NO_ACTIVE_PLAN', 409);
    }
}
async function validatePurchaseIdempotency(userId, orderId, operationType) {
    const existingTransaction = await profile_model_1.ProfileModel.findOne({
        user: userId,
        $or: [
            { 'planAssignment.orderId': orderId },
            { 'upgrades.orderId': orderId },
        ],
    }).exec();
    if (existingTransaction) {
        throw new BusinessValidationError(`Ya existe una transacción con el ID de orden: ${orderId}`, 'DUPLICATE_ORDER_ID', 409);
    }
}
async function validatePaidPlanAssignment(userId, planCode, profileId, orderId) {
    if (orderId) {
        await validatePurchaseIdempotency(userId, orderId, 'plan');
    }
    const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: planCode }).exec();
    if (!plan) {
        throw new BusinessValidationError(`Plan con código ${planCode} no encontrado`, 'PLAN_NOT_FOUND');
    }
    const isPaidPlan = plan.variants.some((variant) => variant.price > 0);
    if (isPaidPlan) {
        await validatePaidProfileLimit(userId, profileId);
    }
    if (planCode === 'AMATISTA') {
        await validateAmatistaLimit(userId, profileId);
    }
}
async function validateUpgradePurchase(userId, profileId, upgradeCode, orderId) {
    if (orderId) {
        await validatePurchaseIdempotency(userId, orderId, 'upgrade');
    }
    await validateUpgradeEligibility(profileId);
    const profile = await profile_model_1.ProfileModel.findOne({
        _id: profileId,
        user: userId,
    }).exec();
    if (!profile) {
        throw new BusinessValidationError('Perfil no encontrado o no pertenece al usuario', 'PROFILE_ACCESS_DENIED', 403);
    }
    if (upgradeCode === 'DESTACADO' && profile.planAssignment?.planCode === 'DIAMANTE') {
        throw new BusinessValidationError('El plan Diamante ya incluye "Destacado" permanente', 'UPGRADE_ALREADY_INCLUDED', 409);
    }
    const now = new Date();
    const activeUpgrades = profile.upgrades?.filter(u => new Date(u.endAt) > now) || [];
    const hasUpgradeActive = activeUpgrades.some(u => u.code === upgradeCode);
    if (hasUpgradeActive) {
        throw new BusinessValidationError(`El upgrade ${upgradeCode} ya está activo`, 'UPGRADE_ALREADY_ACTIVE', 409);
    }
    if (upgradeCode === 'IMPULSO') {
        const hasDestacado = activeUpgrades.some(u => u.code === 'DESTACADO') ||
            profile.planAssignment?.planCode === 'DIAMANTE';
        if (!hasDestacado) {
            throw new BusinessValidationError('Necesitas tener "Destacado" activo para comprar "Impulso"', 'MISSING_UPGRADE_DEPENDENCY', 409);
        }
    }
}
async function getUserUsageStats(userId) {
    const now = new Date();
    const amatistaPlan = await plan_model_1.PlanDefinitionModel.findOne({
        name: 'AMATISTA',
    }).exec();
    const [totalProfiles, paidProfiles, amatistaProfiles, visibleProfiles] = await Promise.all([
        profile_model_1.ProfileModel.countDocuments({ user: userId }).exec(),
        profile_model_1.ProfileModel.countDocuments({
            user: userId,
            'planAssignment.expiresAt': { $gt: now },
        }).exec(),
        amatistaPlan
            ? profile_model_1.ProfileModel.countDocuments({
                user: userId,
                visible: true,
                'planAssignment.planId': amatistaPlan._id,
                'planAssignment.expiresAt': { $gt: now },
            }).exec()
            : 0,
        profile_model_1.ProfileModel.countDocuments({
            user: userId,
            visible: true,
        }).exec(),
    ]);
    return {
        totalProfiles,
        paidProfiles,
        amatistaProfiles,
        visibleProfiles,
    };
}
