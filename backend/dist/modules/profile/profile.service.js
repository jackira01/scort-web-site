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
exports.getAllProfilesForAdmin = exports.getDeletedProfiles = exports.restoreProfile = exports.showProfile = exports.hardDeleteProfile = exports.softDeleteProfile = exports.hideProfile = exports.getActiveProfilesCount = exports.upgradePlan = exports.purchaseUpgrade = exports.validateProfilePlanUpgrade = exports.getUserProfilesSummary = exports.validateUserProfileLimits = exports.subscribeProfile = exports.getProfilesWithStories = exports.createMissingVerifications = exports.deleteProfile = exports.updateProfile = exports.getProfileById = exports.getProfilesForHome = exports.getProfiles = exports.createProfileWithInvoice = exports.createProfile = exports.checkProfileNameExists = void 0;
const mongoose_1 = require("mongoose");
const validateProfileFeatures_1 = require("../attribute-group/validateProfileFeatures");
const profile_verification_service_1 = require("../profile-verification/profile-verification.service");
const User_model_1 = __importDefault(require("../user/User.model"));
const profile_model_1 = require("./profile.model");
const plan_model_1 = require("../plans/plan.model");
const upgrade_model_1 = require("../plans/upgrade.model");
const config_parameter_service_1 = require("../config-parameter/config-parameter.service");
const invoice_service_1 = __importDefault(require("../payments/invoice.service"));
let defaultPlanConfigCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;
const getDefaultPlanConfig = async () => {
    const now = Date.now();
    if (defaultPlanConfigCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return defaultPlanConfigCache;
    }
    try {
        const config = await config_parameter_service_1.ConfigParameterService.getValue('system.default_plan');
        if (!config) {
            const fallbackPlan = await plan_model_1.PlanDefinitionModel.findOne({ code: 'AMATISTA', active: true });
            const fallbackConfig = {
                planId: fallbackPlan?._id?.toString() || null,
                planCode: 'AMATISTA',
                enabled: true
            };
            defaultPlanConfigCache = fallbackConfig;
            cacheTimestamp = now;
            return fallbackConfig;
        }
        const result = {
            planId: config.enabled ? config.planId : null,
            planCode: config.enabled ? config.planCode : null,
            enabled: config.enabled
        };
        defaultPlanConfigCache = result;
        cacheTimestamp = now;
        return result;
    }
    catch (error) {
        const fallbackPlan = await plan_model_1.PlanDefinitionModel.findOne({ code: 'AMATISTA', active: true });
        const errorFallbackConfig = {
            planId: fallbackPlan?._id?.toString() || null,
            planCode: 'AMATISTA',
            enabled: true
        };
        defaultPlanConfigCache = errorFallbackConfig;
        cacheTimestamp = now;
        return errorFallbackConfig;
    }
};
const generateWhatsAppMessage = async (userId, profileId, invoiceId, planCode, variantDays) => {
    try {
        const [companyName, companyWhatsApp] = await Promise.all([
            config_parameter_service_1.ConfigParameterService.getValue('company.name'),
            config_parameter_service_1.ConfigParameterService.getValue('company.whatsapp.number')
        ]);
        if (!companyName || !companyWhatsApp) {
            return null;
        }
        let planInfo = '';
        if (planCode && variantDays) {
            planInfo = `\n• Plan: ${planCode} (${variantDays} días)`;
        }
        else {
            const profile = await profile_model_1.ProfileModel.findById(profileId);
            if (profile?.planAssignment?.planCode && profile?.planAssignment?.variantDays) {
                planInfo = `\n• Plan: ${profile.planAssignment.planCode} (${profile.planAssignment.variantDays} días)`;
            }
        }
        const message = invoiceId
            ? `¡Hola ${companyName}! 👋\n\nEspero que estén muy bien. Acabo de adquirir un paquete en su plataforma y me gustaría conocer las opciones disponibles para realizar el pago.\n\n📋 **Detalles de mi compra:**\n• ID de Factura: ${invoiceId}\n• ID de Perfil: ${profileId}${planInfo}\n\n¿Podrían orientarme sobre los métodos de pago disponibles y los pasos a seguir?\n\nMuchas gracias por su atención. 😊`
            : `¡Hola ${companyName}! 👋\n\nEspero que estén muy bien. He creado un nuevo perfil en su plataforma y me gustaría obtener más información sobre sus servicios.\n\n📋 **Detalles:**\n• ID de Perfil: ${profileId}${planInfo}\n\n¿Podrían brindarme más información sobre las opciones disponibles?\n\nMuchas gracias por su atención. 😊`;
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
const checkProfileNameExists = async (name) => {
    const profile = await profile_model_1.ProfileModel.findOne({ name });
    if (profile) {
        return {
            user: profile.user,
            exists: true,
            message: 'El nombre del perfil ya está en uso',
        };
    }
    return {
        user: null,
        exists: false,
        message: 'El nombre del perfil no está en uso',
    };
};
exports.checkProfileNameExists = checkProfileNameExists;
const createProfile = async (data) => {
    await (0, validateProfileFeatures_1.validateProfileFeatures)(data.features);
    const profileLimitsValidation = await (0, exports.validateUserProfileLimits)(data.user.toString());
    if (!profileLimitsValidation.canCreate) {
        throw new Error(profileLimitsValidation.reason || 'No se puede crear el perfil debido a límites de usuario');
    }
    const { planAssignment, ...profileData } = data;
    let profile = await profile_model_1.ProfileModel.create({
        ...profileData,
        isActive: true,
        visible: false
    });
    await User_model_1.default.findByIdAndUpdate(data.user, { $push: { profiles: profile._id } }, { new: true });
    try {
        const defaultPlanConfig = await getDefaultPlanConfig();
        if (defaultPlanConfig.enabled && (defaultPlanConfig.planId || defaultPlanConfig.planCode)) {
            let defaultPlan;
            if (defaultPlanConfig.planId) {
                defaultPlan = await plan_model_1.PlanDefinitionModel.findById(defaultPlanConfig.planId);
            }
            else {
                defaultPlan = await plan_model_1.PlanDefinitionModel.findOne({
                    code: defaultPlanConfig.planCode,
                    active: true
                });
            }
            if (defaultPlan && defaultPlan.variants && defaultPlan.variants.length > 0) {
                const defaultVariant = defaultPlan.variants[0];
                const subscriptionResult = await (0, exports.subscribeProfile)(profile._id, defaultPlan.code, defaultVariant.days, false);
                if (subscriptionResult.profile) {
                    const updatedProfile = await profile_model_1.ProfileModel.findById(profile._id);
                    if (updatedProfile) {
                        profile = updatedProfile;
                    }
                }
            }
            else {
            }
        }
        else {
        }
    }
    catch (error) {
    }
    try {
        const verification = await (0, profile_verification_service_1.createProfileVerification)({
            profile: profile._id.toString(),
            verificationStatus: 'pending',
        });
        if (verification && verification._id) {
            const updatedProfile = await profile_model_1.ProfileModel.findByIdAndUpdate(profile._id, { verification: verification._id }, { new: true });
        }
    }
    catch (error) {
    }
    return profile;
};
exports.createProfile = createProfile;
const createProfileWithInvoice = async (data) => {
    const { planCode, planDays, ...profileData } = data;
    const profile = await (0, exports.createProfile)(profileData);
    const limitsValidation = await (0, exports.validateUserProfileLimits)(profileData.user.toString(), planCode);
    let shouldBeVisible = true;
    const defaultPlanConfig = await getDefaultPlanConfig();
    const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : null;
    if (!limitsValidation.canCreate && (!planCode || planCode === defaultPlanCode)) {
        shouldBeVisible = false;
    }
    let invoice = null;
    if (planCode && planDays && planCode !== defaultPlanCode) {
        try {
            const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: planCode });
            if (!plan) {
                throw new Error(`Plan con código ${planCode} no encontrado`);
            }
            const variant = plan.variants.find(v => v.days === planDays);
            if (!variant) {
                throw new Error(`Variante de ${planDays} días no encontrada para el plan ${planCode}`);
            }
            if (variant.price > 0) {
                invoice = await invoice_service_1.default.generateInvoice({
                    profileId: profile._id.toString(),
                    userId: profile.user.toString(),
                    planCode: planCode,
                    planDays: planDays,
                    notes: `Factura generada automáticamente para nuevo perfil ${profile.name || profile._id}`
                });
                await profile_model_1.ProfileModel.findByIdAndUpdate(profile._id, {
                    $push: { paymentHistory: new mongoose_1.Types.ObjectId(invoice._id) },
                    isActive: true,
                    visible: shouldBeVisible
                });
            }
            else {
                const whatsAppMessage = await generateWhatsAppMessage(profile.user.toString(), profile._id.toString());
                return { profile, invoice: null, whatsAppMessage };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        }
    }
    else {
        await profile_model_1.ProfileModel.findByIdAndUpdate(profile._id, {
            isActive: true,
            visible: shouldBeVisible
        });
    }
    const whatsAppMessage = await generateWhatsAppMessage(profile.user.toString(), profile._id.toString(), invoice?._id?.toString(), planCode, planDays);
    return { profile, invoice, whatsAppMessage };
};
exports.createProfileWithInvoice = createProfileWithInvoice;
const getProfiles = async (page = 1, limit = 10, fields) => {
    const skip = (page - 1) * limit;
    let query = profile_model_1.ProfileModel.find({
        visible: true,
        isDeleted: { $ne: true }
    });
    if (fields) {
        const cleaned = fields.split(',').map(f => f.trim()).filter(Boolean);
        const needsFeatured = cleaned.includes('featured');
        const hasUpgrades = cleaned.includes('upgrades') || cleaned.some(f => f.startsWith('upgrades'));
        if (needsFeatured && !hasUpgrades) {
            cleaned.push('upgrades.code', 'upgrades.startAt', 'upgrades.endAt');
        }
        const needsIsVerified = cleaned.includes('isVerified') || cleaned.includes('verification');
        if (needsIsVerified && !cleaned.includes('verification')) {
            cleaned.push('verification');
        }
        const selectStr = cleaned.join(' ');
        query = query.select(selectStr);
    }
    const rawProfiles = await query
        .populate({
        path: 'user',
        select: 'name email',
    })
        .populate({
        path: 'verification',
        model: 'ProfileVerification',
        select: 'verificationProgress verificationStatus'
    })
        .populate({
        path: 'features.group_id',
        select: 'name label',
    })
        .skip(skip)
        .limit(limit)
        .lean();
    const now = new Date();
    const profiles = rawProfiles.map(profile => {
        let isVerified = false;
        if (profile.verification) {
            const verification = profile.verification;
            const verifiedCount = Object.values(verification).filter(status => status === 'verified').length;
            const totalFields = Object.keys(verification).length;
            if (verifiedCount === totalFields && totalFields > 0) {
                isVerified = true;
            }
        }
        const featured = profile.upgrades?.some(upgrade => (upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT') &&
            new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now) || false;
        return {
            ...profile,
            isVerified,
            featured
        };
    });
    const total = await profile_model_1.ProfileModel.countDocuments({});
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;
    const pagingCounter = (page - 1) * limit + 1;
    return {
        profiles,
        pagination: {
            page,
            limit,
            total,
            pages: totalPages
        }
    };
};
exports.getProfiles = getProfiles;
const getProfilesForHome = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const now = new Date();
    const profiles = await profile_model_1.ProfileModel.find({
        isActive: true,
        visible: true,
        $or: [
            {
                'planAssignment.expiresAt': { $gt: now },
                'planAssignment.planCode': { $exists: true }
            },
            {
                planAssignment: null
            }
        ]
    })
        .select({
        name: 1,
        age: 1,
        user: 1,
        'location.city.label': 1,
        'location.department.label': 1,
        'media.gallery': { $slice: 1 },
        planAssignment: 1,
        upgrades: 1,
        lastLogin: 1,
        createdAt: 1,
        updatedAt: 1
    })
        .populate({
        path: 'user',
        model: 'User',
        select: 'name email isVerified',
        match: { isVerified: true }
    })
        .populate({
        path: 'verification',
        model: 'ProfileVerification',
        select: 'verificationProgress verificationStatus'
    })
        .populate({
        path: 'planAssignment.planId',
        model: 'PlanDefinition',
        select: 'name code level features includedUpgrades'
    })
        .lean();
    const profilesWithVerifiedUsers = profiles.filter(profile => {
        const hasVerifiedUser = profile.user !== null;
        if (!hasVerifiedUser) {
        }
        return hasVerifiedUser;
    });
    const planDefinitions = await plan_model_1.PlanDefinitionModel.find({ active: true }).lean();
    const planCodeToLevel = planDefinitions.reduce((acc, plan) => {
        acc[plan.code] = plan.level;
        return acc;
    }, {});
    const planCodeToFeatures = planDefinitions.reduce((acc, plan) => {
        acc[plan.code] = plan.features;
        return acc;
    }, {});
    let defaultPlanFeatures = null;
    try {
        const defaultPlanConfig = await config_parameter_service_1.ConfigParameterService.getValue('system.default_plan');
        if (defaultPlanConfig?.enabled && defaultPlanConfig?.planCode) {
            defaultPlanFeatures = planCodeToFeatures[defaultPlanConfig.planCode];
        }
    }
    catch (error) {
    }
    const filteredProfiles = profilesWithVerifiedUsers.filter(profile => {
        let planCode = null;
        if (profile.planAssignment?.planCode) {
            planCode = profile.planAssignment.planCode;
        }
        if (!planCode) {
            if (defaultPlanFeatures) {
                const shouldShow = defaultPlanFeatures.showInHome === true;
                return shouldShow;
            }
            return false;
        }
        const planFeatures = planCodeToFeatures[planCode];
        if (!planFeatures) {
            return false;
        }
        const shouldShow = planFeatures.showInHome === true;
        return shouldShow;
    });
    const enrichedProfiles = filteredProfiles.map(profile => {
        const activeUpgrades = profile.upgrades?.filter(upgrade => new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now) || [];
        let planLevel = 5;
        let planCode = 'GRATIS';
        if (profile.planAssignment?.planCode) {
            planLevel = planCodeToLevel[profile.planAssignment.planCode] || 5;
            planCode = profile.planAssignment.planCode;
        }
        let hasBoostUpgrade = activeUpgrades.some(upgrade => upgrade.code === 'IMPULSO' || upgrade.code === 'BOOST');
        let hasHighlightUpgrade = activeUpgrades.some(upgrade => upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT');
        if (planCode === 'DIAMANTE') {
            hasHighlightUpgrade = true;
        }
        return {
            ...profile,
            _hierarchyInfo: {
                planLevel,
                planCode,
                activeUpgrades,
                hasBoostUpgrade,
                hasHighlightUpgrade,
                lastActivity: profile.lastLogin || profile.updatedAt,
                createdAt: profile.createdAt
            }
        };
    });
    const sortedProfiles = enrichedProfiles.sort((a, b) => {
        const aInfo = a._hierarchyInfo;
        const bInfo = b._hierarchyInfo;
        if (aInfo.hasHighlightUpgrade || aInfo.hasBoostUpgrade) {
            if (!(bInfo.hasHighlightUpgrade || bInfo.hasBoostUpgrade)) {
                return -1;
            }
            let aEffectiveLevel = aInfo.planLevel;
            let bEffectiveLevel = bInfo.planLevel;
            if (aInfo.hasHighlightUpgrade && aInfo.planLevel > 1) {
                aEffectiveLevel = Math.max(1, aInfo.planLevel - 1);
            }
            if (bInfo.hasHighlightUpgrade && bInfo.planLevel > 1) {
                bEffectiveLevel = Math.max(1, bInfo.planLevel - 1);
            }
            if (aInfo.hasBoostUpgrade) {
                aEffectiveLevel = 1;
            }
            if (bInfo.hasBoostUpgrade) {
                bEffectiveLevel = 1;
            }
            if (aEffectiveLevel !== bEffectiveLevel) {
                return aEffectiveLevel - bEffectiveLevel;
            }
            const aPlanDurationRank = a.planAssignment?.variantDays ?
                planDefinitions.find(p => p.code === aInfo.planCode)?.variants.find(v => v.days === a.planAssignment?.variantDays)?.durationRank || 0 : 0;
            const bPlanDurationRank = b.planAssignment?.variantDays ?
                planDefinitions.find(p => p.code === bInfo.planCode)?.variants.find(v => v.days === b.planAssignment?.variantDays)?.durationRank || 0 : 0;
            if (aPlanDurationRank !== bPlanDurationRank) {
                return bPlanDurationRank - aPlanDurationRank;
            }
            if (aInfo.hasBoostUpgrade && !bInfo.hasBoostUpgrade) {
                return 1;
            }
            if (bInfo.hasBoostUpgrade && !aInfo.hasBoostUpgrade) {
                return -1;
            }
            const aLatestUpgrade = Math.max(...aInfo.activeUpgrades.map(u => new Date(u.startAt).getTime()));
            const bLatestUpgrade = Math.max(...bInfo.activeUpgrades.map(u => new Date(u.startAt).getTime()));
            return bLatestUpgrade - aLatestUpgrade;
        }
        if (bInfo.hasHighlightUpgrade || bInfo.hasBoostUpgrade) {
            return 1;
        }
        if (aInfo.planLevel !== bInfo.planLevel) {
            return aInfo.planLevel - bInfo.planLevel;
        }
        const aPlanDurationRank = a.planAssignment?.variantDays ?
            planDefinitions.find(p => p.code === aInfo.planCode)?.variants.find(v => v.days === a.planAssignment?.variantDays)?.durationRank || 0 : 0;
        const bPlanDurationRank = b.planAssignment?.variantDays ?
            planDefinitions.find(p => p.code === bInfo.planCode)?.variants.find(v => v.days === b.planAssignment?.variantDays)?.durationRank || 0 : 0;
        if (aPlanDurationRank !== bPlanDurationRank) {
            return bPlanDurationRank - aPlanDurationRank;
        }
        if (aInfo.planLevel <= 2) {
            const aActivity = new Date(aInfo.lastActivity).getTime();
            const bActivity = new Date(bInfo.lastActivity).getTime();
            return bActivity - aActivity;
        }
        else {
            const aCreated = new Date(aInfo.createdAt).getTime();
            const bCreated = new Date(bInfo.createdAt).getTime();
            return bCreated - aCreated;
        }
    });
    const paginatedProfiles = sortedProfiles.slice(skip, skip + limit);
    const cleanProfiles = paginatedProfiles.map(profile => {
        const { _hierarchyInfo, ...cleanProfile } = profile;
        let isVerified = false;
        let verificationLevel = 'pending';
        if (profile.verification) {
            const verification = profile.verification;
            const verifiedCount = Object.values(verification).filter(status => status === 'verified').length;
            const totalFields = Object.keys(verification).length;
            if (verifiedCount === totalFields && totalFields > 0) {
                isVerified = true;
                verificationLevel = 'verified';
            }
            else if (verifiedCount > 0) {
                verificationLevel = 'partial';
            }
        }
        return {
            ...cleanProfile,
            hasDestacadoUpgrade: _hierarchyInfo.hasHighlightUpgrade,
            hasImpulsoUpgrade: _hierarchyInfo.hasBoostUpgrade,
            verification: {
                ...(typeof profile.verification === 'object' && profile.verification !== null ? profile.verification : {}),
                isVerified,
                verificationLevel
            }
        };
    });
    const total = filteredProfiles.length;
    cleanProfiles.slice(0, 3).forEach((profile, index) => {
        const user = profile.user;
    });
    return {
        profiles: cleanProfiles,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};
exports.getProfilesForHome = getProfilesForHome;
const getProfileById = async (id) => {
    const profile = await profile_model_1.ProfileModel.findById(id)
        .populate('user', '_id name email')
        .populate('features.group_id');
    if (!profile) {
        return null;
    }
    const transformedProfile = profile.toObject();
    const services = [];
    const otherFeatures = [];
    profile.features.forEach((feature) => {
        if (!feature.group_id || typeof feature.group_id === 'string') {
            otherFeatures.push({
                group_id: feature.group_id,
                value: feature.value,
                groupName: 'Unknown',
            });
            return;
        }
        const transformedFeature = {
            group_id: feature.group_id._id,
            value: feature.value,
            groupName: feature.group_id.name,
        };
        if (feature.group_id.name === 'Servicios') {
            services.push(...feature.value);
        }
        else {
            otherFeatures.push(transformedFeature);
        }
    });
    transformedProfile.features = otherFeatures;
    transformedProfile.services = services;
    return transformedProfile;
};
exports.getProfileById = getProfileById;
const updateProfile = async (id, data) => {
    if (data.media) {
        const existingProfile = await profile_model_1.ProfileModel.findById(id);
        if (existingProfile && existingProfile.media) {
            data.media = {
                gallery: data.media.gallery !== undefined ? data.media.gallery : (existingProfile.media.gallery || []),
                videos: data.media.videos !== undefined ? data.media.videos : (existingProfile.media.videos || []),
                audios: data.media.audios !== undefined ? data.media.audios : (existingProfile.media.audios || []),
                stories: data.media.stories !== undefined ? data.media.stories : (existingProfile.media.stories || []),
            };
        }
    }
    return profile_model_1.ProfileModel.findByIdAndUpdate(id, data, { new: true });
};
exports.updateProfile = updateProfile;
const deleteProfile = async (id) => {
    return profile_model_1.ProfileModel.findByIdAndDelete(id);
};
exports.deleteProfile = deleteProfile;
const createMissingVerifications = async () => {
    try {
        const profilesWithoutVerification = await profile_model_1.ProfileModel.find({
            verification: { $in: [null, undefined] },
        });
        const results = [];
        for (const profile of profilesWithoutVerification) {
            try {
                const verification = await (0, profile_verification_service_1.createProfileVerification)({
                    profile: String(profile._id),
                    verificationStatus: 'pending',
                });
                if (!verification || !verification._id) {
                    throw new Error('No se pudo crear la verificación');
                }
                await profile_model_1.ProfileModel.findByIdAndUpdate(profile._id, { verification: verification._id }, { new: true });
                results.push({
                    profileId: profile._id,
                    profileName: profile.name,
                    verificationId: verification._id,
                    status: 'created',
                });
            }
            catch (error) {
                results.push({
                    profileId: profile._id,
                    profileName: profile.name,
                    status: 'error',
                    error: error?.message || 'Error desconocido',
                });
            }
        }
        return {
            total: profilesWithoutVerification.length,
            created: results.filter((r) => r.status === 'created').length,
            errors: results.filter((r) => r.status === 'error').length,
            results,
        };
    }
    catch (error) {
        throw new Error(`Error al crear verificaciones faltantes: ${error?.message || error}`);
    }
};
exports.createMissingVerifications = createMissingVerifications;
const getProfilesWithStories = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const query = profile_model_1.ProfileModel.find({
        'media.stories': { $exists: true, $ne: [] },
        isActive: true
    })
        .select('_id name media')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    const countQuery = profile_model_1.ProfileModel.countDocuments({
        'media.stories': { $exists: true, $ne: [] },
        isActive: true
    });
    const [profiles, total] = await Promise.all([query.exec(), countQuery]);
    return {
        profiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getProfilesWithStories = getProfilesWithStories;
const subscribeProfile = async (profileId, planCode, variantDays, generateInvoice = false) => {
    const defaultPlanConfig = await getDefaultPlanConfig();
    const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA';
    const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: planCode, active: true });
    if (!plan) {
        throw new Error(`Plan con código ${planCode} no encontrado`);
    }
    const variant = plan.variants.find(v => v.days === variantDays);
    if (!variant) {
        throw new Error(`Variante de ${variantDays} días no encontrada para el plan ${planCode}`);
    }
    const profile = await profile_model_1.ProfileModel.findById(profileId);
    if (!profile) {
        throw new Error('Perfil no encontrado');
    }
    const upgradeValidation = await (0, exports.validateProfilePlanUpgrade)(profileId, planCode);
    if (!upgradeValidation.canUpgrade) {
        throw new Error(upgradeValidation.reason || 'No se puede asignar el plan al perfil');
    }
    let invoice = null;
    if (generateInvoice && planCode !== defaultPlanCode && variant.price > 0) {
        try {
            invoice = await invoice_service_1.default.generateInvoice({
                profileId: profileId,
                userId: profile.user.toString(),
                planCode: planCode,
                planDays: variantDays,
                notes: `Factura generada automáticamente para suscripción de perfil ${profile.name || profileId}`
            });
            const updatedProfile = await profile_model_1.ProfileModel.findByIdAndUpdate(profileId, { isActive: false }, { new: true });
            return { profile: updatedProfile, invoice };
        }
        catch (error) {
        }
    }
    if (!generateInvoice || planCode === defaultPlanCode) {
        const startAt = new Date();
        const expiresAt = new Date(startAt.getTime() + (variantDays * 24 * 60 * 60 * 1000));
        const updateData = {
            planAssignment: {
                planId: plan._id,
                planCode,
                variantDays,
                startAt,
                expiresAt
            },
            visible: true,
            isActive: true
        };
        const updatedProfile = await profile_model_1.ProfileModel.findByIdAndUpdate(profileId, updateData, { new: true });
        return { profile: updatedProfile, invoice };
    }
    const currentProfile = await profile_model_1.ProfileModel.findById(profileId);
    return { profile: currentProfile, invoice };
};
exports.subscribeProfile = subscribeProfile;
const validateUserProfileLimits = async (userId, planCode) => {
    try {
        const defaultPlanConfig = await getDefaultPlanConfig();
        const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA';
        const user = await User_model_1.default.findById(userId).lean();
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        const accountType = user.accountType || 'common';
        let freeProfilesMax, paidProfilesMax, totalVisibleMax, requiresIndependentVerification;
        if (accountType === 'agency') {
            if (user.agencyInfo?.conversionStatus !== 'approved') {
                return {
                    canCreate: false,
                    reason: 'La conversión a agencia debe estar aprobada para crear perfiles adicionales',
                    limits: { accountType },
                    currentCounts: { freeProfilesCount: 0, paidProfilesCount: 0, totalProfiles: 0 }
                };
            }
            [freeProfilesMax, paidProfilesMax, totalVisibleMax, requiresIndependentVerification] = await Promise.all([
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.agency.free_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.agency.paid_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.agency.total_visible_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.agency.independent_verification_required')
            ]);
        }
        else {
            [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.free_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.paid_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.total_visible_max')
            ]);
            requiresIndependentVerification = false;
        }
        const limits = {
            freeProfilesMax: freeProfilesMax || (accountType === 'agency' ? 5 : 3),
            paidProfilesMax: paidProfilesMax || (accountType === 'agency' ? 50 : 10),
            totalVisibleMax: totalVisibleMax || (accountType === 'agency' ? 55 : 13),
            accountType,
            requiresIndependentVerification: requiresIndependentVerification || false
        };
        const userProfiles = await profile_model_1.ProfileModel.find({
            user: userId,
            isActive: true,
            visible: true,
            isDeleted: { $ne: true }
        }).lean();
        const now = new Date();
        let freeProfilesCount = 0;
        let paidProfilesCount = 0;
        for (const profile of userProfiles) {
            const hasActivePaidPlan = profile.planAssignment &&
                profile.planAssignment.expiresAt > now &&
                ((profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
                    (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode));
            if (hasActivePaidPlan) {
                paidProfilesCount++;
            }
            else {
                freeProfilesCount++;
            }
        }
        const totalProfiles = freeProfilesCount + paidProfilesCount;
        const isNewProfilePaid = planCode && planCode !== defaultPlanCode;
        if (isNewProfilePaid) {
            if (paidProfilesCount >= limits.paidProfilesMax) {
                return {
                    canCreate: false,
                    reason: `Máximo de perfiles de pago alcanzado (${limits.paidProfilesMax})`,
                    limits,
                    currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
                };
            }
        }
        else {
            if (freeProfilesCount >= limits.freeProfilesMax) {
                return {
                    canCreate: false,
                    reason: `Máximo de perfiles gratuitos alcanzado (${limits.freeProfilesMax})`,
                    limits,
                    currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
                };
            }
        }
        if (totalProfiles >= limits.totalVisibleMax) {
            return {
                canCreate: false,
                reason: `Máximo total de perfiles visibles alcanzado (${limits.totalVisibleMax})`,
                limits,
                currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
            };
        }
        if (accountType === 'agency') {
            const agencyInfo = user.agencyInfo;
            if (!agencyInfo || agencyInfo.conversionStatus !== 'approved') {
                return {
                    canCreate: false,
                    reason: 'La conversión a cuenta de agencia debe estar aprobada para crear perfiles adicionales',
                    limits,
                    currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
                };
            }
        }
        return {
            canCreate: true,
            limits,
            currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles },
            accountType,
            requiresIndependentVerification: accountType === 'agency' && totalProfiles > 0
        };
    }
    catch (error) {
        throw new Error('Error interno al validar límites de perfiles');
    }
};
exports.validateUserProfileLimits = validateUserProfileLimits;
const getUserProfilesSummary = async (userId) => {
    try {
        const defaultPlanConfig = await getDefaultPlanConfig();
        const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA';
        const user = await User_model_1.default.findById(userId).lean();
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        const accountType = user.accountType || 'common';
        let freeProfilesMax, paidProfilesMax, totalVisibleMax;
        if (accountType === 'agency') {
            [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.agency.free_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.agency.paid_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.agency.total_visible_max')
            ]);
        }
        else {
            [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.free_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.paid_profiles_max'),
                config_parameter_service_1.ConfigParameterService.getValue('profiles.limits.total_visible_max')
            ]);
        }
        const limits = {
            freeProfilesMax: freeProfilesMax || (accountType === 'agency' ? 5 : 3),
            paidProfilesMax: paidProfilesMax || (accountType === 'agency' ? 50 : 10),
            totalVisibleMax: totalVisibleMax || (accountType === 'agency' ? 55 : 13),
            accountType
        };
        const userProfiles = await profile_model_1.ProfileModel.find({
            user: userId,
            isActive: true,
            visible: true
        }).lean();
        const now = new Date();
        let freeProfilesCount = 0;
        let paidProfilesCount = 0;
        const expiredPaidProfiles = [];
        for (const profile of userProfiles) {
            const hasActivePaidPlan = profile.planAssignment &&
                profile.planAssignment.expiresAt > now &&
                ((profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
                    (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode));
            if (hasActivePaidPlan) {
                paidProfilesCount++;
            }
            else {
                freeProfilesCount++;
                const isExpiredPaidPlan = profile.planAssignment &&
                    profile.planAssignment.expiresAt <= now &&
                    ((profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
                        (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode));
                if (isExpiredPaidPlan && profile.planAssignment) {
                    expiredPaidProfiles.push({
                        profileId: profile._id,
                        profileName: profile.name,
                        expiredPlan: profile.planAssignment.planCode || 'Plan desconocido',
                        expiredAt: profile.planAssignment.expiresAt || null
                    });
                }
            }
        }
        const totalProfiles = freeProfilesCount + paidProfilesCount;
        return {
            freeProfiles: freeProfilesCount,
            paidProfiles: paidProfilesCount,
            totalProfiles,
            expiredPaidProfiles,
            limits,
            availableSlots: {
                freeSlots: Math.max(0, limits.freeProfilesMax - freeProfilesCount),
                paidSlots: Math.max(0, limits.paidProfilesMax - paidProfilesCount),
                totalSlots: Math.max(0, limits.totalVisibleMax - totalProfiles)
            }
        };
    }
    catch (error) {
        throw new Error('Error interno al obtener resumen de perfiles');
    }
};
exports.getUserProfilesSummary = getUserProfilesSummary;
const validateProfilePlanUpgrade = async (profileId, newPlanCode) => {
    try {
        const defaultPlanConfig = await getDefaultPlanConfig();
        const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA';
        const profile = await profile_model_1.ProfileModel.findById(profileId).lean();
        if (!profile) {
            throw new Error('Perfil no encontrado');
        }
        if (newPlanCode === defaultPlanCode) {
            return { canUpgrade: true };
        }
        const now = new Date();
        const currentlyHasPaidPlan = profile.planAssignment &&
            profile.planAssignment.expiresAt > now &&
            ((profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
                (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode));
        if (currentlyHasPaidPlan) {
            return { canUpgrade: true };
        }
        const validation = await (0, exports.validateUserProfileLimits)(profile.user.toString(), newPlanCode);
        if (!validation.canCreate) {
            return {
                canUpgrade: false,
                reason: validation.reason
            };
        }
        return { canUpgrade: true };
    }
    catch (error) {
        throw new Error('Error interno al validar upgrade de plan');
    }
};
exports.validateProfilePlanUpgrade = validateProfilePlanUpgrade;
const purchaseUpgrade = async (profileId, upgradeCode, userId) => {
    const upgrade = await upgrade_model_1.UpgradeDefinitionModel.findOne({ code: upgradeCode });
    if (!upgrade) {
        throw new Error(`Upgrade con código ${upgradeCode} no encontrado`);
    }
    const profile = await profile_model_1.ProfileModel.findById(profileId);
    if (!profile) {
        throw new Error('Perfil no encontrado');
    }
    if (!profile.planAssignment || profile.planAssignment.expiresAt < new Date()) {
        const error = new Error('No se pueden comprar upgrades sin un plan activo');
        error.status = 409;
        throw error;
    }
    if (upgrade.requires && upgrade.requires.length > 0) {
        const now = new Date();
        const activeUpgrades = profile.upgrades.filter(u => u.endAt > now);
        const activeUpgradeCodes = activeUpgrades.map(u => u.code);
        const missingRequirements = upgrade.requires.filter(req => !activeUpgradeCodes.includes(req));
        if (missingRequirements.length > 0) {
            throw new Error(`Upgrades requeridos no activos: ${missingRequirements.join(', ')}`);
        }
    }
    const now = new Date();
    const endAt = new Date(now.getTime() + (upgrade.durationHours * 60 * 60 * 1000));
    const existingUpgradeIndex = profile.upgrades.findIndex(u => u.code === upgradeCode && u.endAt > now);
    switch (upgrade.stackingPolicy) {
        case 'reject':
            if (existingUpgradeIndex !== -1) {
                const error = new Error('Upgrade ya activo');
                error.status = 409;
                throw error;
            }
            break;
    }
    let invoice = null;
    const upgradePrice = 0;
    try {
        invoice = await invoice_service_1.default.generateInvoice({
            profileId: profileId,
            userId: profile.user.toString(),
            upgradeCodes: [upgradeCode]
        });
        profile.paymentHistory.push(new mongoose_1.Types.ObjectId(invoice._id));
        profile.isActive = false;
        await profile.save();
        return {
            profile,
            invoice,
            upgradeCode,
            status: 'pending_payment',
            message: 'Upgrade pendiente de pago'
        };
    }
    catch (error) {
        throw new Error('Error al generar factura para el upgrade');
    }
};
exports.purchaseUpgrade = purchaseUpgrade;
const upgradePlan = async (profileId, newPlanCode, variantDays) => {
    if (!profileId) {
        throw new Error('profileId es requerido');
    }
    if (!newPlanCode || typeof newPlanCode !== 'string') {
        throw new Error('newPlanCode es requerido y debe ser un string');
    }
    const normalizedPlanCode = newPlanCode.trim().toUpperCase();
    const profile = await profile_model_1.ProfileModel.findById(profileId);
    if (!profile) {
        throw new Error('Perfil no encontrado');
    }
    const now = new Date();
    if (!profile.planAssignment) {
        throw new Error('El perfil debe tener un plan asignado para hacer upgrade');
    }
    const newPlan = await plan_model_1.PlanDefinitionModel.findOne({ code: normalizedPlanCode, active: true });
    if (!newPlan) {
        throw new Error(`Plan con código ${normalizedPlanCode} no encontrado`);
    }
    const defaultPlanConfig = await getDefaultPlanConfig();
    const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA';
    let selectedVariant;
    if (variantDays) {
        selectedVariant = newPlan.variants.find(v => v.days === variantDays);
        if (!selectedVariant) {
            throw new Error(`Variante de ${variantDays} días no encontrada para el plan ${normalizedPlanCode}`);
        }
    }
    else {
        selectedVariant = newPlan.variants.reduce((cheapest, current) => current.price < cheapest.price ? current : cheapest);
    }
    const upgradeValidation = await (0, exports.validateProfilePlanUpgrade)(profileId, normalizedPlanCode);
    if (!upgradeValidation.canUpgrade) {
        throw new Error(upgradeValidation.reason || 'No se puede hacer upgrade a este plan');
    }
    const currentExpiresAt = new Date(profile.planAssignment.expiresAt);
    let newExpiresAt;
    if (currentExpiresAt <= now) {
        newExpiresAt = new Date(now.getTime() + (selectedVariant.days * 24 * 60 * 60 * 1000));
    }
    else {
        const remainingTime = currentExpiresAt.getTime() - now.getTime();
        newExpiresAt = new Date(now.getTime() + remainingTime + (selectedVariant.days * 24 * 60 * 60 * 1000));
    }
    const updatedProfile = await profile_model_1.ProfileModel.findByIdAndUpdate(profileId, {
        planAssignment: {
            planId: newPlan._id,
            planCode: normalizedPlanCode,
            variantDays: selectedVariant.days,
            startAt: profile.planAssignment.startAt,
            expiresAt: newExpiresAt
        }
    }, { new: true });
    if (!updatedProfile) {
        throw new Error('Error al actualizar el perfil');
    }
    return updatedProfile;
};
exports.upgradePlan = upgradePlan;
const getActiveProfilesCount = async (userId) => {
    const now = new Date();
    const activeProfilesCount = await profile_model_1.ProfileModel.countDocuments({
        user_id: userId,
        'planAssignment.expiresAt': { $gt: now }
    });
    return activeProfilesCount;
};
exports.getActiveProfilesCount = getActiveProfilesCount;
const hideProfile = async (profileId, userId) => {
    try {
        const profile = await profile_model_1.ProfileModel.findOne({ _id: profileId, user: userId });
        if (!profile) {
            return { success: false, message: 'Perfil no encontrado o no tienes permisos para eliminarlo' };
        }
        if (!profile.visible) {
            return { success: false, message: 'El perfil ya está oculto' };
        }
        profile.visible = false;
        await profile.save();
        return { success: true, message: 'Perfil ocultado exitosamente' };
    }
    catch (error) {
        return { success: false, message: 'Error al ocultar el perfil' };
    }
};
exports.hideProfile = hideProfile;
const softDeleteProfile = async (profileId, userId) => {
    try {
        const query = userId ? { _id: profileId, user: userId } : { _id: profileId };
        const profile = await profile_model_1.ProfileModel.findOne(query);
        if (!profile) {
            return { success: false, message: userId ? 'Perfil no encontrado o no tienes permisos para eliminarlo' : 'Perfil no encontrado' };
        }
        if (profile.isDeleted) {
            return { success: false, message: 'El perfil ya está eliminado lógicamente' };
        }
        profile.isDeleted = true;
        profile.visible = false;
        await profile.save();
        return { success: true, message: 'Perfil eliminado lógicamente' };
    }
    catch (error) {
        return { success: false, message: 'Error al eliminar el perfil lógicamente' };
    }
};
exports.softDeleteProfile = softDeleteProfile;
const hardDeleteProfile = async (profileId) => {
    try {
        const profile = await profile_model_1.ProfileModel.findById(profileId);
        if (!profile) {
            return { success: false, message: 'Perfil no encontrado' };
        }
        const ProfileVerificationModel = (await Promise.resolve().then(() => __importStar(require('../profile-verification/profile-verification.model')))).ProfileVerification;
        await ProfileVerificationModel.deleteMany({ profile: profileId });
        const InvoiceModel = (await Promise.resolve().then(() => __importStar(require('../payments/invoice.model')))).default;
        await InvoiceModel.deleteMany({ profileId: profileId });
        await profile_model_1.ProfileModel.findByIdAndDelete(profileId);
        return { success: true, message: 'Perfil y todos sus datos eliminados permanentemente' };
    }
    catch (error) {
        return { success: false, message: 'Error al eliminar el perfil permanentemente' };
    }
};
exports.hardDeleteProfile = hardDeleteProfile;
const showProfile = async (profileId, userId) => {
    try {
        const profile = await profile_model_1.ProfileModel.findOne({ _id: profileId, user: userId });
        if (!profile) {
            return { success: false, message: 'Perfil no encontrado o no tienes permisos para mostrarlo' };
        }
        if (profile.isDeleted) {
            return { success: false, message: 'El perfil está eliminado lógicamente y solo puede ser restaurado por un administrador' };
        }
        if (profile.visible) {
            return { success: false, message: 'El perfil ya está visible' };
        }
        profile.visible = true;
        await profile.save();
        return { success: true, message: 'Perfil mostrado exitosamente' };
    }
    catch (error) {
        return { success: false, message: 'Error al mostrar el perfil' };
    }
};
exports.showProfile = showProfile;
const restoreProfile = async (profileId, userId) => {
    try {
        const profile = await profile_model_1.ProfileModel.findById(profileId);
        if (!profile) {
            return { success: false, message: 'Perfil no encontrado' };
        }
        if (!profile.isDeleted) {
            return { success: false, message: 'El perfil no está eliminado' };
        }
        profile.isDeleted = false;
        profile.visible = true;
        await profile.save();
        return { success: true, message: 'Perfil restaurado exitosamente' };
    }
    catch (error) {
        return { success: false, message: 'Error al restaurar el perfil' };
    }
};
exports.restoreProfile = restoreProfile;
const getDeletedProfiles = async (page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const profiles = await profile_model_1.ProfileModel.find({ isDeleted: true })
            .populate('user', 'name email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await profile_model_1.ProfileModel.countDocuments({ isDeleted: true });
        return {
            profiles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    catch (error) {
        throw new Error('Error al obtener perfiles eliminados');
    }
};
exports.getDeletedProfiles = getDeletedProfiles;
const getAllProfilesForAdmin = async (page = 1, limit = 10, fields) => {
    const skip = (page - 1) * limit;
    let query = profile_model_1.ProfileModel.find({});
    if (fields) {
        const cleaned = fields.split(',').map(f => f.trim()).filter(Boolean);
        const needsFeatured = cleaned.includes('featured');
        const hasUpgrades = cleaned.includes('upgrades') || cleaned.some(f => f.startsWith('upgrades'));
        if (needsFeatured && !hasUpgrades) {
            cleaned.push('upgrades.code', 'upgrades.startAt', 'upgrades.endAt');
        }
        const needsIsVerified = cleaned.includes('isVerified') || cleaned.includes('verification');
        if (needsIsVerified && !cleaned.includes('verification')) {
            cleaned.push('verification');
        }
        const selectStr = cleaned.join(' ');
        query = query.select(selectStr);
    }
    const rawProfiles = await query
        .populate({
        path: 'user',
        select: 'name email',
    })
        .populate({
        path: 'verification',
        model: 'ProfileVerification',
        select: 'verificationProgress verificationStatus'
    })
        .populate({
        path: 'features.group_id',
        select: 'name label',
    })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    const now = new Date();
    const profiles = rawProfiles.map(profile => {
        let isVerified = false;
        if (profile.verification) {
            const verification = profile.verification;
            const verifiedCount = Object.values(verification).filter(status => status === 'verified').length;
            const totalFields = Object.keys(verification).length;
            if (verifiedCount === totalFields && totalFields > 0) {
                isVerified = true;
            }
        }
        const featured = profile.upgrades?.some(upgrade => (upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT') &&
            new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now) || false;
        return {
            ...profile,
            isVerified,
            featured
        };
    });
    const total = await profile_model_1.ProfileModel.countDocuments({});
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;
    const pagingCounter = (page - 1) * limit + 1;
    return {
        docs: profiles,
        totalDocs: total,
        limit,
        page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        pagingCounter,
    };
};
exports.getAllProfilesForAdmin = getAllProfilesForAdmin;
