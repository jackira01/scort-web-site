"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileVisibilityStats = exports.runCleanupTasks = exports.cleanupExpiredUpgrades = exports.hideExpiredProfiles = void 0;
const profile_model_1 = require("../profile/profile.model");
const profile_service_1 = require("../profile/profile.service");
const logger_1 = require("../../utils/logger");
const hideExpiredProfiles = async (now = new Date()) => {
    try {
        const expiredProfiles = await profile_model_1.ProfileModel.find({
            visible: true,
            isActive: true,
            'planAssignment.expiresAt': { $lte: now }
        });
        let processedCount = 0;
        for (const profile of expiredProfiles) {
            try {
                await (0, profile_service_1.hideProfile)(profile._id.toString(), profile.user.toString());
                processedCount++;
            }
            catch (error) {
                continue;
            }
        }
        return processedCount;
    }
    catch (error) {
        throw error;
    }
};
exports.hideExpiredProfiles = hideExpiredProfiles;
const cleanupExpiredUpgrades = async (now = new Date(), keepHistory = true) => {
    try {
        if (keepHistory) {
            const profilesWithExpiredUpgrades = await profile_model_1.ProfileModel.find({
                'upgrades.endAt': { $lte: now }
            });
            let updatedCount = 0;
            for (const profile of profilesWithExpiredUpgrades) {
                const activeUpgrades = profile.upgrades.filter(upgrade => upgrade.endAt > now);
                const expiredUpgrades = profile.upgrades.filter(upgrade => upgrade.endAt <= now);
                if (expiredUpgrades.length > 0) {
                    profile.upgrades = activeUpgrades;
                    if (!profile.upgradeHistory) {
                        profile.upgradeHistory = [];
                    }
                    profile.upgradeHistory.push(...expiredUpgrades.map(upgrade => ({
                        ...upgrade.toObject(),
                        expiredAt: now
                    })));
                    await profile.save();
                    updatedCount++;
                }
            }
            logger_1.logger.info(`Moved expired upgrades to history for ${updatedCount} profiles`, { timestamp: now.toISOString() });
            return updatedCount;
        }
        else {
            const result = await profile_model_1.ProfileModel.updateMany({
                'upgrades.endAt': { $lte: now }
            }, {
                $pull: {
                    upgrades: { endAt: { $lte: now } }
                }
            });
            logger_1.logger.info(`Removed expired upgrades from ${result.modifiedCount} profiles`, { timestamp: now.toISOString() });
            return result.modifiedCount;
        }
    }
    catch (error) {
        const err = error;
        logger_1.logger.error('Error cleaning up expired upgrades', { error: err.message, stack: err.stack });
        throw error;
    }
};
exports.cleanupExpiredUpgrades = cleanupExpiredUpgrades;
const runCleanupTasks = async (now = new Date()) => {
    console.log(`[Cleanup] Starting cleanup tasks at ${now.toISOString()}`);
    try {
        const [hiddenProfiles, cleanedUpgrades] = await Promise.all([
            (0, exports.hideExpiredProfiles)(now),
            (0, exports.cleanupExpiredUpgrades)(now, true)
        ]);
        const summary = {
            hiddenProfiles,
            cleanedUpgrades,
            timestamp: now
        };
        console.log('[Cleanup] Tasks completed:', summary);
        return summary;
    }
    catch (error) {
        console.error('[Cleanup] Error running cleanup tasks:', error);
        throw error;
    }
};
exports.runCleanupTasks = runCleanupTasks;
const getProfileVisibilityStats = async () => {
    const now = new Date();
    try {
        const [visible, hidden, active, softDeleted, withActivePlan, withExpiredPlan, withActiveUpgrades] = await Promise.all([
            profile_model_1.ProfileModel.countDocuments({ visible: true, isDeleted: { $ne: true } }),
            profile_model_1.ProfileModel.countDocuments({ visible: false, isDeleted: { $ne: true } }),
            profile_model_1.ProfileModel.countDocuments({ isActive: true }),
            profile_model_1.ProfileModel.countDocuments({ isDeleted: true }),
            profile_model_1.ProfileModel.countDocuments({
                isActive: true,
                'planAssignment.expiresAt': { $gt: now }
            }),
            profile_model_1.ProfileModel.countDocuments({
                isActive: true,
                'planAssignment.expiresAt': { $lte: now }
            }),
            profile_model_1.ProfileModel.countDocuments({
                isActive: true,
                'upgrades': {
                    $elemMatch: {
                        startAt: { $lte: now },
                        endAt: { $gt: now }
                    }
                }
            })
        ]);
        return {
            visible,
            hidden,
            active,
            softDeleted,
            withActivePlan,
            withExpiredPlan,
            withActiveUpgrades
        };
    }
    catch (error) {
        throw error;
    }
};
exports.getProfileVisibilityStats = getProfileVisibilityStats;
