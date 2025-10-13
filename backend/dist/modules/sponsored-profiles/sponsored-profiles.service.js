"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProfileSponsored = exports.getSponsoredProfilesCount = exports.getSponsoredProfiles = void 0;
const profile_model_1 = require("../profile/profile.model");
const plan_model_1 = require("../plans/plan.model");
const getSponsoredProfiles = async (query = {}) => {
    try {
        const { page = 1, limit = 20, sortBy = 'lastShownAt', sortOrder = 'asc', fields = [] } = query;
        const pageNum = Math.max(1, page);
        const limitNum = Math.min(Math.max(1, limit), 100);
        const skip = (pageNum - 1) * limitNum;
        const baseFilters = {
            isActive: true,
            visible: true,
            isDeleted: false,
            'planAssignment.expiresAt': { $gt: new Date() },
            'planAssignment.planId': { $exists: true, $ne: null }
        };
        const sponsoredPlans = await plan_model_1.PlanDefinitionModel.find({
            'features.showInSponsored': true,
            active: true
        }).select('_id code name features');
        const sponsoredPlanIds = sponsoredPlans.map(plan => plan._id);
        if (sponsoredPlanIds.length === 0) {
            return {
                profiles: [],
                pagination: {
                    currentPage: pageNum,
                    totalPages: 0,
                    totalProfiles: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };
        }
        const finalFilters = {
            ...baseFilters,
            'planAssignment.planId': { $in: sponsoredPlanIds }
        };
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        let projection = {};
        if (fields.length > 0) {
            projection = fields.reduce((acc, field) => {
                acc[field] = 1;
                return acc;
            }, {});
        }
        const baseProfilesCount = await profile_model_1.ProfileModel.countDocuments(baseFilters);
        const profilesWithPlan = await profile_model_1.ProfileModel.countDocuments({
            ...baseFilters,
            'planAssignment.planId': { $exists: true, $ne: null }
        });
        const [profiles, totalCount] = await Promise.all([
            profile_model_1.ProfileModel
                .find(finalFilters, projection)
                .populate('user', 'email username')
                .populate('planAssignment.planId', 'code name level features')
                .populate('verification', 'status verifiedAt')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            profile_model_1.ProfileModel.countDocuments(finalFilters)
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        return {
            profiles: profiles,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalProfiles: totalCount,
                hasNextPage,
                hasPrevPage
            }
        };
    }
    catch (error) {
        console.error('Error en getSponsoredProfiles:', error);
        throw new Error('Error al obtener perfiles patrocinados');
    }
};
exports.getSponsoredProfiles = getSponsoredProfiles;
const getSponsoredProfilesCount = async () => {
    try {
        const baseFilters = {
            isActive: true,
            visible: true,
            isDeleted: false,
            'planAssignment.expiresAt': { $gt: new Date() },
            'planAssignment.planId': { $exists: true, $ne: null }
        };
        const sponsoredPlans = await plan_model_1.PlanDefinitionModel.find({
            'features.showInSponsored': true,
            active: true
        }).select('_id');
        const sponsoredPlanIds = sponsoredPlans.map(plan => plan._id);
        if (sponsoredPlanIds.length === 0) {
            return 0;
        }
        const count = await profile_model_1.ProfileModel.countDocuments({
            ...baseFilters,
            'planAssignment.planId': { $in: sponsoredPlanIds }
        });
        return count;
    }
    catch (error) {
        console.error('Error en getSponsoredProfilesCount:', error);
        throw new Error('Error al contar perfiles patrocinados');
    }
};
exports.getSponsoredProfilesCount = getSponsoredProfilesCount;
const isProfileSponsored = async (profileId) => {
    try {
        const profile = await profile_model_1.ProfileModel.findById(profileId)
            .populate('planAssignment.planId', 'features active')
            .lean();
        if (!profile) {
            return false;
        }
        if (!profile.isActive || !profile.visible || profile.isDeleted) {
            return false;
        }
        if (!profile.planAssignment?.planId || !profile.planAssignment?.expiresAt) {
            return false;
        }
        if (new Date(profile.planAssignment.expiresAt) <= new Date()) {
            return false;
        }
        const plan = profile.planAssignment.planId;
        return plan?.features?.showInSponsored === true && plan?.active === true;
    }
    catch (error) {
        console.error('Error en isProfileSponsored:', error);
        return false;
    }
};
exports.isProfileSponsored = isProfileSponsored;
