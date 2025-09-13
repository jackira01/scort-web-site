"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugUserProfilesController = exports.debugProfileStructureController = void 0;
const profile_model_1 = require("./profile.model");
const plan_model_1 = require("../plans/plan.model");
const upgrade_model_1 = require("../plans/upgrade.model");
const debugProfileStructureController = async (req, res) => {
    try {
        const { profileId } = req.params;
        if (!profileId) {
            return res.status(400).json({ error: 'profileId es requerido' });
        }
        const profile = await profile_model_1.ProfileModel.findById(profileId)
            .populate({
            path: 'verification',
            select: 'verificationStatus verificationProgress'
        })
            .lean();
        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        const now = new Date();
        const activeUpgrades = profile.upgrades?.filter(upgrade => new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now) || [];
        const hasDestacadoUpgrade = activeUpgrades.some(upgrade => upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT');
        const hasImpulsoUpgrade = activeUpgrades.some(upgrade => upgrade.code === 'IMPULSO' || upgrade.code === 'BOOST');
        let planInfo = null;
        if (profile.planAssignment?.planCode) {
            planInfo = await plan_model_1.PlanDefinitionModel.findOne({
                code: profile.planAssignment.planCode
            }).lean();
        }
        const upgradeDefinitions = await upgrade_model_1.UpgradeDefinitionModel.find({
            active: true
        }).lean();
        const debugInfo = {
            profileId: profile._id,
            profileName: profile.name,
            planAssignment: profile.planAssignment,
            planInfo: planInfo ? {
                code: planInfo.code,
                name: planInfo.name,
                level: planInfo.level,
                features: planInfo.features
            } : null,
            upgrades: profile.upgrades || [],
            activeUpgrades,
            upgradeFlags: {
                hasDestacadoUpgrade,
                hasImpulsoUpgrade
            },
            availableUpgrades: upgradeDefinitions.map(upgrade => ({
                code: upgrade.code,
                name: upgrade.name,
                durationHours: upgrade.durationHours,
                active: upgrade.active
            })),
            validationChecks: {
                hasActivePlan: profile.planAssignment &&
                    new Date(profile.planAssignment.expiresAt) > now,
                planExpired: profile.planAssignment ?
                    new Date(profile.planAssignment.expiresAt) <= now : null,
                canPurchaseDestacado: profile.planAssignment?.planCode !== 'DIAMANTE',
                canPurchaseImpulso: hasDestacadoUpgrade
            }
        };
        res.json({
            success: true,
            data: debugInfo,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};
exports.debugProfileStructureController = debugProfileStructureController;
const debugUserProfilesController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }
        const profiles = await profile_model_1.ProfileModel.find({ user: userId })
            .select('_id name planAssignment upgrades visible isActive')
            .lean();
        const now = new Date();
        const debugInfo = profiles.map(profile => {
            const activeUpgrades = profile.upgrades?.filter(upgrade => new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now) || [];
            return {
                profileId: profile._id,
                profileName: profile.name,
                visible: profile.visible,
                isActive: profile.isActive,
                planAssignment: profile.planAssignment,
                hasActivePlan: profile.planAssignment &&
                    new Date(profile.planAssignment.expiresAt) > now,
                upgradesCount: profile.upgrades?.length || 0,
                activeUpgradesCount: activeUpgrades.length,
                activeUpgrades: activeUpgrades.map(u => u.code)
            };
        });
        res.json({
            success: true,
            userId,
            profilesCount: profiles.length,
            profiles: debugInfo,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};
exports.debugUserProfilesController = debugUserProfilesController;
