"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilterOptions = exports.getFilteredProfiles = void 0;
const attribute_group_model_1 = require("../attribute-group/attribute-group.model");
const profile_model_1 = require("../profile/profile.model");
const visibility_service_1 = require("../visibility/visibility.service");
const feeds_service_1 = require("../feeds/feeds.service");
const cache_service_1 = require("../../services/cache.service");
const logger_1 = require("../../utils/logger");
const getFilteredProfiles = async (filters) => {
    try {
        const { category, location, priceRange, availability, isActive, isVerified, profileVerified, documentVerified, hasDestacadoUpgrade, hasVideos, page = 1, limit = 20, fields, } = filters;
        const cacheKey = cache_service_1.cacheService.generateKey(cache_service_1.CACHE_KEYS.FILTERS, JSON.stringify(filters));
        const cachedResult = await cache_service_1.cacheService.get(cacheKey);
        if (cachedResult) {
            logger_1.logger.info(`Cache hit para filtros: ${cacheKey}`);
            return cachedResult;
        }
        let features = filters.features;
        const query = {};
        const now = new Date();
        query.visible = true;
        query.isDeleted = { $ne: true };
        if (isActive !== undefined) {
            query.isActive = isActive;
        }
        if (category) {
            if (!features) {
                features = {};
            }
            features.category = category;
        }
        if (location) {
            if (location.country) {
                query['location.country'] = location.country;
            }
            if (location.department) {
                query['location.department.value'] = location.department;
            }
            if (location.city) {
                query['location.city.value'] = location.city;
            }
        }
        if (isVerified !== undefined) {
            query['user.isVerified'] = isVerified;
        }
        if (profileVerified !== undefined) {
            const profileVerificationQuery = await profile_model_1.ProfileModel.aggregate([
                {
                    $lookup: {
                        from: 'profileverifications',
                        localField: 'verification',
                        foreignField: '_id',
                        as: 'verificationData'
                    }
                },
                {
                    $match: {
                        'verificationData.steps.videoVerification.isVerified': profileVerified
                    }
                },
                {
                    $project: {
                        _id: 1
                    }
                }
            ]);
            const verifiedProfileIds = profileVerificationQuery.map(p => p._id);
            if (profileVerified) {
                query._id = { $in: verifiedProfileIds };
            }
            else {
                query._id = { $nin: verifiedProfileIds };
            }
        }
        if (documentVerified !== undefined) {
            const documentVerificationQuery = await profile_model_1.ProfileModel.aggregate([
                {
                    $lookup: {
                        from: 'profileverifications',
                        localField: 'verification',
                        foreignField: '_id',
                        as: 'verificationData'
                    }
                },
                {
                    $match: {
                        'verificationData.steps.documentPhotos.isVerified': documentVerified
                    }
                },
                {
                    $project: {
                        _id: 1
                    }
                }
            ]);
            const documentVerifiedProfileIds = documentVerificationQuery.map(p => p._id);
            if (documentVerified) {
                if (query._id && query._id.$in) {
                    query._id = { $in: query._id.$in.filter((id) => documentVerifiedProfileIds.some(docId => docId.equals(id))) };
                }
                else if (query._id && query._id.$nin) {
                    query._id = { $in: documentVerifiedProfileIds, $nin: query._id.$nin };
                }
                else {
                    query._id = { $in: documentVerifiedProfileIds };
                }
            }
            else {
                if (query._id && query._id.$in) {
                    query._id = { $in: query._id.$in.filter((id) => !documentVerifiedProfileIds.some(docId => docId.equals(id))) };
                }
                else if (query._id && query._id.$nin) {
                    query._id = { $nin: [...query._id.$nin, ...documentVerifiedProfileIds] };
                }
                else {
                    query._id = { $nin: documentVerifiedProfileIds };
                }
            }
        }
        if (hasDestacadoUpgrade !== undefined && hasDestacadoUpgrade) {
            const now = new Date();
            query.$or = [
                {
                    upgrades: {
                        $elemMatch: {
                            code: { $in: ['DESTACADO', 'HIGHLIGHT'] },
                            startAt: { $lte: now },
                            endAt: { $gt: now }
                        }
                    }
                },
                {
                    'planAssignment.planCode': 'DIAMANTE'
                }
            ];
        }
        if (hasVideos !== undefined && hasVideos) {
            query['media.videos'] = { $exists: true, $not: { $size: 0 } };
        }
        if (features && Object.keys(features).length > 0) {
            const featureConditions = [];
            if (features.ageRange && typeof features.ageRange === 'object') {
                const { min, max } = features.ageRange;
                if (min !== undefined || max !== undefined) {
                    const ageConditions = [];
                    if (min !== undefined) {
                        ageConditions.push({
                            $expr: {
                                $gte: [{ $toInt: "$age" }, min]
                            }
                        });
                    }
                    if (max !== undefined) {
                        ageConditions.push({
                            $expr: {
                                $lte: [{ $toInt: "$age" }, max]
                            }
                        });
                    }
                    if (query.$and) {
                        query.$and.push(...ageConditions);
                    }
                    else {
                        query.$and = ageConditions;
                    }
                }
            }
            const otherFeatures = Object.fromEntries(Object.entries(features).filter(([key]) => key !== 'ageRange'));
            if (Object.keys(otherFeatures).length > 0) {
                const groupKeys = Object.keys(otherFeatures);
                const attributeGroups = await attribute_group_model_1.AttributeGroupModel.find({
                    key: { $in: groupKeys },
                });
                const groupKeyToId = new Map();
                attributeGroups.forEach((group) => {
                    groupKeyToId.set(group.key, group._id);
                });
                for (const [groupKey, value] of Object.entries(otherFeatures)) {
                    const groupId = groupKeyToId.get(groupKey);
                    if (!groupId) {
                        console.warn('⚠️ WARNING - No groupId found for feature key:', groupKey);
                        continue;
                    }
                    if (Array.isArray(value)) {
                        const normalizedValues = value.map((v) => v.toLowerCase().trim());
                        const condition = {
                            features: {
                                $elemMatch: {
                                    group_id: groupId,
                                    'value.key': { $in: normalizedValues },
                                },
                            },
                        };
                        featureConditions.push(condition);
                    }
                    else {
                        const normalizedValue = value.toLowerCase().trim();
                        const condition = {
                            features: {
                                $elemMatch: {
                                    group_id: groupId,
                                    'value.key': normalizedValue,
                                },
                            },
                        };
                        featureConditions.push(condition);
                    }
                }
                if (featureConditions.length > 0) {
                    query.$and = featureConditions;
                }
            }
        }
        if (priceRange) {
            const priceConditions = {};
            if (priceRange.min !== undefined) {
                priceConditions.$gte = priceRange.min;
            }
            if (priceRange.max !== undefined) {
                priceConditions.$lte = priceRange.max;
            }
            if (Object.keys(priceConditions).length > 0) {
                query['rates.price'] = priceConditions;
            }
        }
        if (availability) {
            const availabilityConditions = [];
            if (availability.dayOfWeek) {
                const dayCondition = {
                    availability: {
                        $elemMatch: {
                            dayOfWeek: availability.dayOfWeek,
                        },
                    },
                };
                availabilityConditions.push(dayCondition);
            }
            if (availability.timeSlot &&
                (availability.timeSlot.start || availability.timeSlot.end)) {
                const timeCondition = {
                    availability: {
                        $elemMatch: {
                            slots: {
                                $elemMatch: {
                                    ...(availability.timeSlot.start && {
                                        start: { $lte: availability.timeSlot.start },
                                    }),
                                    ...(availability.timeSlot.end && {
                                        end: { $gte: availability.timeSlot.end },
                                    }),
                                },
                            },
                        },
                    },
                };
                availabilityConditions.push(timeCondition);
            }
            if (availabilityConditions.length > 0) {
                if (query.$and) {
                    query.$and.push(...availabilityConditions);
                }
                else {
                    query.$and = availabilityConditions;
                }
            }
        }
        const skip = (page - 1) * limit;
        const requiredFields = ['planAssignment', 'upgrades', 'lastShownAt', 'createdAt'];
        const profileCardFields = [
            '_id',
            'name',
            'age',
            'location',
            'description',
            'verification',
            'media.gallery',
            'online',
            'hasVideo'
        ];
        const finalFields = Array.isArray(fields) && fields.length > 0
            ? Array.from(new Set([...fields, ...requiredFields]))
            : Array.from(new Set([...profileCardFields, ...requiredFields]));
        const selectFields = finalFields.join(' ');
        const startTime = Date.now();
        if (filters.category) {
            const sampleProfiles = await profile_model_1.ProfileModel.find({
                visible: true,
                isDeleted: { $ne: true }
            })
                .select('_id name category features visible isActive')
                .limit(10)
                .lean();
            sampleProfiles.forEach((profile, index) => {
                if (profile.features && profile.features.length > 0) {
                    const categoryFeatures = profile.features.filter((f) => {
                        return f.value && typeof f.value === 'string';
                    });
                }
            });
        }
        const aggregationPipeline = [
            {
                $match: query
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
                $addFields: {
                    user: { $arrayElemAt: ['$userInfo', 0] }
                }
            },
            {
                $project: {
                    userInfo: 0
                }
            }
        ];
        if (!fields || fields.includes('verification')) {
            aggregationPipeline.push({
                $lookup: {
                    from: 'profileverifications',
                    localField: 'verification',
                    foreignField: '_id',
                    as: 'verification'
                }
            });
            aggregationPipeline.push({
                $addFields: {
                    verification: { $arrayElemAt: ['$verification', 0] }
                }
            });
        }
        aggregationPipeline.push({
            $lookup: {
                from: 'plandefinitions',
                localField: 'planAssignment.plan',
                foreignField: '_id',
                as: 'planAssignmentPlan'
            }
        });
        aggregationPipeline.push({
            $addFields: {
                'planAssignment.plan': { $arrayElemAt: ['$planAssignmentPlan', 0] }
            }
        });
        aggregationPipeline.push({
            $project: {
                planAssignmentPlan: 0
            }
        });
        if (fields && fields.includes('features')) {
            aggregationPipeline.push({
                $lookup: {
                    from: 'attributegroups',
                    localField: 'features.group_id',
                    foreignField: '_id',
                    as: 'featureGroups'
                }
            });
        }
        const projectionFields = {};
        finalFields.forEach(field => {
            projectionFields[field] = 1;
        });
        projectionFields['user'] = 1;
        aggregationPipeline.push({
            $project: projectionFields
        });
        const [allProfiles, totalCountResult] = await Promise.all([
            profile_model_1.ProfileModel.aggregate(aggregationPipeline),
            profile_model_1.ProfileModel.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                },
                { $count: 'total' }
            ])
        ]);
        const totalCount = totalCountResult[0]?.total || 0;
        if (allProfiles.length > 0) {
            allProfiles.forEach((profile, index) => {
                if (profile.features && profile.features.length > 0) {
                    profile.features.slice(0, 3).forEach((feature) => {
                    });
                    if (profile.features.length > 3) {
                    }
                }
                if (filters.category) {
                    const categoryMatch = profile.features?.some((f) => f.value?.toLowerCase() === filters.category?.toLowerCase());
                }
            });
        }
        const sortedProfiles = await (0, visibility_service_1.sortProfiles)(allProfiles, now);
        const paginatedProfiles = sortedProfiles.slice(skip, skip + limit);
        if (paginatedProfiles.length > 0) {
            await (0, feeds_service_1.updateLastShownAt)(paginatedProfiles.map(p => p._id.toString()));
        }
        const executionTime = Date.now() - startTime;
        void executionTime;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        const paginationInfo = {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit,
        };
        const profilesWithVerification = paginatedProfiles.map(profile => {
            let isVerified = false;
            let verificationLevel = 'pending';
            if (profile.verification) {
                const verifiedCount = Object.values(profile.verification).filter(status => status === 'verified').length;
                const totalFields = Object.keys(profile.verification).length;
                if (verifiedCount === totalFields && totalFields > 0) {
                    isVerified = true;
                    verificationLevel = 'verified';
                }
                else if (verifiedCount > 0) {
                    verificationLevel = 'partial';
                }
            }
            const now = new Date();
            let hasDestacadoUpgrade = false;
            if (profile.planAssignment?.planCode === 'DIAMANTE') {
                hasDestacadoUpgrade = true;
            }
            else if (profile.upgrades && Array.isArray(profile.upgrades)) {
                hasDestacadoUpgrade = profile.upgrades.some((upgrade) => ['DESTACADO', 'HIGHLIGHT'].includes(upgrade.code) &&
                    new Date(upgrade.startAt) <= now &&
                    new Date(upgrade.endAt) > now);
            }
            return {
                ...profile,
                hasDestacadoUpgrade,
                verification: {
                    isVerified,
                    verificationLevel
                }
            };
        });
        const result = {
            ...paginationInfo,
            profiles: profilesWithVerification,
        };
        await cache_service_1.cacheService.set(cacheKey, result, cache_service_1.CACHE_TTL.MEDIUM);
        return result;
    }
    catch (error) {
        throw error;
    }
};
exports.getFilteredProfiles = getFilteredProfiles;
const getFilterOptions = async () => {
    try {
        const cacheKey = cache_service_1.cacheService.generateKey(cache_service_1.CACHE_KEYS.FILTERS, 'options');
        const cachedOptions = await cache_service_1.cacheService.get(cacheKey);
        if (cachedOptions) {
            logger_1.logger.info('Cache hit para opciones de filtros');
            return cachedOptions;
        }
        const [locations, attributeGroups, priceRange] = await Promise.all([
            profile_model_1.ProfileModel.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                {
                    $group: {
                        _id: null,
                        countries: { $addToSet: '$location.country' },
                        departments: { $addToSet: '$location.department' },
                        cities: { $addToSet: '$location.city' },
                    },
                },
            ]),
            attribute_group_model_1.AttributeGroupModel.find(),
            profile_model_1.ProfileModel.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $unwind: '$rates' },
                {
                    $group: {
                        _id: null,
                        minPrice: { $min: '$rates.price' },
                        maxPrice: { $max: '$rates.price' },
                    },
                },
            ]),
        ]);
        const categoryGroup = attributeGroups.find((group) => group.key === 'category');
        const categories = categoryGroup
            ? categoryGroup.variants
                .filter((variant) => variant.active)
                .map((variant) => ({
                label: variant.label || variant.value,
                value: variant.value,
            }))
            : [];
        const features = {};
        attributeGroups.forEach((group) => {
            features[group.key] = group.variants
                .filter((variant) => variant.active)
                .map((variant) => ({
                label: variant.label || variant.value,
                value: variant.value,
            }));
        });
        const result = {
            categories: categoryGroup
                ? categoryGroup.variants
                    .filter((variant) => variant.active)
                    .map((variant) => ({
                    label: variant.label || variant.value,
                    value: variant.value,
                }))
                    .filter(Boolean)
                : [],
            locations: {
                countries: (locations[0]?.countries || []).filter(Boolean),
                departments: (locations[0]?.departments || []).filter(Boolean),
                cities: (locations[0]?.cities || []).filter(Boolean),
            },
            features,
            priceRange: {
                min: priceRange[0]?.minPrice || 0,
                max: priceRange[0]?.maxPrice || 0,
            },
        };
        await cache_service_1.cacheService.set(cacheKey, result, cache_service_1.CACHE_TTL.LONG);
        logger_1.logger.info('Opciones de filtros guardadas en caché');
        return result;
    }
    catch (error) {
        throw error;
    }
};
exports.getFilterOptions = getFilterOptions;
