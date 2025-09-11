"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortProfiles = exports.sortProfilesWithinLevel = exports.getPriorityScore = exports.getEffectiveLevel = void 0;
const plan_model_1 = require("../plans/plan.model");
const upgrade_model_1 = require("../plans/upgrade.model");
const getEffectiveLevel = async (profile, now = new Date()) => {
    if (!profile.planAssignment || !profile.planAssignment.planCode) {
        return 5;
    }
    const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: profile.planAssignment.planCode });
    if (!plan) {
        return 5;
    }
    let effectiveLevel = plan.level;
    if (profile.upgrades && profile.upgrades.length > 0) {
        const activeUpgrades = profile.upgrades.filter(upgrade => upgrade.startAt <= now && upgrade.endAt > now);
        for (const upgrade of activeUpgrades) {
            const upgradeDefinition = await upgrade_model_1.UpgradeDefinitionModel.findOne({ code: upgrade.code });
            if (!upgradeDefinition || !upgradeDefinition.effect)
                continue;
            if (upgradeDefinition.effect.setLevelTo !== undefined) {
                effectiveLevel = upgradeDefinition.effect.setLevelTo;
            }
            else if (upgradeDefinition.effect.levelDelta !== undefined) {
                effectiveLevel += upgradeDefinition.effect.levelDelta;
            }
        }
    }
    return Math.max(1, Math.min(5, effectiveLevel));
};
exports.getEffectiveLevel = getEffectiveLevel;
const getPriorityScore = async (profile, now = new Date()) => {
    let score = 0;
    if (profile.planAssignment && profile.planAssignment.planCode) {
        const plan = await plan_model_1.PlanDefinitionModel.findOne({ code: profile.planAssignment.planCode });
        if (plan) {
            const variant = plan.variants.find(v => v.days === profile.planAssignment.variantDays);
            if (variant) {
                score += variant.durationRank;
            }
        }
    }
    let hasBackPositionRule = false;
    if (profile.upgrades && profile.upgrades.length > 0) {
        const activeUpgrades = profile.upgrades.filter(upgrade => upgrade.startAt <= now && upgrade.endAt > now);
        for (const upgrade of activeUpgrades) {
            const upgradeDefinition = await upgrade_model_1.UpgradeDefinitionModel.findOne({ code: upgrade.code });
            if (!upgradeDefinition || !upgradeDefinition.effect)
                continue;
            if (upgradeDefinition.effect.priorityBonus !== undefined) {
                score += upgradeDefinition.effect.priorityBonus;
            }
            if (upgradeDefinition.effect.positionRule === 'BACK') {
                hasBackPositionRule = true;
            }
        }
    }
    if (profile.planAssignment && profile.planAssignment.startAt) {
        const daysSinceStart = (now.getTime() - profile.planAssignment.startAt.getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 100 - daysSinceStart);
        score += recencyScore;
    }
    if (hasBackPositionRule) {
        score -= 1000;
    }
    return score;
};
exports.getPriorityScore = getPriorityScore;
const sortProfilesWithinLevel = (profiles) => {
    return profiles.sort((a, b) => {
        const scoreA = a.priorityScore || 0;
        const scoreB = b.priorityScore || 0;
        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }
        const lastShownA = a.lastShownAt?.getTime() || 0;
        const lastShownB = b.lastShownAt?.getTime() || 0;
        if (lastShownA !== lastShownB) {
            return lastShownA - lastShownB;
        }
        const createdA = a.createdAt?.getTime() || a._id.getTimestamp?.() || 0;
        const createdB = b.createdAt?.getTime() || b._id.getTimestamp?.() || 0;
        return createdA - createdB;
    });
};
exports.sortProfilesWithinLevel = sortProfilesWithinLevel;
const sortProfiles = async (profiles, now = new Date()) => {
    const profilesWithMetadata = await Promise.all(profiles.map(async (profile) => {
        const effectiveLevel = await (0, exports.getEffectiveLevel)(profile, now);
        const priorityScore = await (0, exports.getPriorityScore)(profile, now);
        return {
            ...profile,
            effectiveLevel,
            priorityScore
        };
    }));
    const profilesByLevel = {};
    for (const profile of profilesWithMetadata) {
        if (!profilesByLevel[profile.effectiveLevel]) {
            profilesByLevel[profile.effectiveLevel] = [];
        }
        profilesByLevel[profile.effectiveLevel].push(profile);
    }
    const sortedProfiles = [];
    for (let level = 1; level <= 5; level++) {
        if (profilesByLevel[level]) {
            const sortedLevelProfiles = (0, exports.sortProfilesWithinLevel)(profilesByLevel[level]);
            sortedProfiles.push(...sortedLevelProfiles);
        }
    }
    return sortedProfiles;
};
exports.sortProfiles = sortProfiles;
