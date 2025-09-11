"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeFeedStats = exports.batchUpdateLastShownAt = exports.updateLastShownAt = exports.getHomeFeed = void 0;
const profile_model_1 = require("../profile/profile.model");
const visibility_service_1 = require("../visibility/visibility.service");
const getHomeFeed = async (options = {}) => {
    const { page = 1, pageSize = 20 } = options;
    const now = new Date();
    const verifiedUserProfiles = await profile_model_1.ProfileModel.aggregate([
        {
            $match: {
                visible: true,
                isDeleted: { $ne: true },
                'planAssignment.expiresAt': { $gt: now }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        {
            $match: {
                'userInfo.isVerified': true
            }
        },
        {
            $addFields: {
                user: { $arrayElemAt: ['$userInfo', 0] }
            }
        },
        {
            $project: {
                userInfo: 0
            }
        }
    ]);
    const profileDocuments = verifiedUserProfiles.map(profile => new profile_model_1.ProfileModel(profile));
    const sortedProfiles = await (0, visibility_service_1.sortProfiles)(profileDocuments, now);
    const levelSeparators = [];
    const profilesWithLevels = await Promise.all(sortedProfiles.map(async (profile) => ({
        profile,
        level: await (0, visibility_service_1.getEffectiveLevel)(profile, now)
    })));
    let currentIndex = 0;
    for (let level = 1; level <= 5; level++) {
        const levelProfiles = profilesWithLevels.filter(p => p.level === level);
        if (levelProfiles.length > 0) {
            levelSeparators.push({
                level,
                startIndex: currentIndex,
                count: levelProfiles.length
            });
            currentIndex += levelProfiles.length;
        }
    }
    const total = sortedProfiles.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProfiles = sortedProfiles.slice(startIndex, endIndex);
    if (paginatedProfiles.length > 0) {
        await (0, exports.updateLastShownAt)(paginatedProfiles.map(p => p._id.toString()));
    }
    const adjustedSeparators = levelSeparators
        .map(separator => ({
        ...separator,
        startIndex: Math.max(0, separator.startIndex - startIndex),
        endIndex: separator.startIndex + separator.count - startIndex
    }))
        .filter(separator => separator.endIndex > 0 && separator.startIndex < pageSize)
        .map(separator => ({
        level: separator.level,
        startIndex: Math.max(0, separator.startIndex),
        count: Math.min(separator.endIndex, pageSize) - Math.max(0, separator.startIndex)
    }))
        .filter(separator => separator.count > 0);
    return {
        profiles: paginatedProfiles,
        pagination: {
            page,
            pageSize,
            total,
            totalPages
        },
        metadata: {
            levelSeparators: adjustedSeparators
        }
    };
};
exports.getHomeFeed = getHomeFeed;
const updateLastShownAt = async (profileIds) => {
    if (profileIds.length === 0)
        return;
    const now = new Date();
    await profile_model_1.ProfileModel.updateMany({ _id: { $in: profileIds } }, { $set: { lastShownAt: now } }).exec();
};
exports.updateLastShownAt = updateLastShownAt;
const batchUpdateLastShownAt = async (profileIds) => {
    if (profileIds.length === 0)
        return;
    const batchSize = 100;
    const now = new Date();
    for (let i = 0; i < profileIds.length; i += batchSize) {
        const batch = profileIds.slice(i, i + batchSize);
        await profile_model_1.ProfileModel.updateMany({ _id: { $in: batch } }, { $set: { lastShownAt: now } }).exec();
    }
};
exports.batchUpdateLastShownAt = batchUpdateLastShownAt;
const getHomeFeedStats = async () => {
    const now = new Date();
    const verifiedUserProfiles = await profile_model_1.ProfileModel.aggregate([
        {
            $match: {
                visible: true,
                isDeleted: { $ne: true },
                'planAssignment.expiresAt': { $gt: now }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        {
            $match: {
                'userInfo.isVerified': true
            }
        },
        {
            $addFields: {
                user: { $arrayElemAt: ['$userInfo', 0] }
            }
        },
        {
            $project: {
                userInfo: 0
            }
        }
    ]);
    const profileDocuments = verifiedUserProfiles.map(profile => new profile_model_1.ProfileModel(profile));
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const profile of profileDocuments) {
        const level = await (0, visibility_service_1.getEffectiveLevel)(profile, now);
        stats[level]++;
    }
    return stats;
};
exports.getHomeFeedStats = getHomeFeedStats;
