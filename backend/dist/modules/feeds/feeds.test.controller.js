"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFairnessStatsController = exports.resetLastShownAtController = exports.testFairnessRotationController = void 0;
const feeds_service_1 = require("./feeds.service");
const profile_model_1 = require("../profile/profile.model");
const visibility_service_1 = require("../visibility/visibility.service");
const testFairnessRotationController = async (req, res) => {
    try {
        const { iterations = 3, pageSize = 5 } = req.query;
        const now = new Date();
        const visibleProfiles = await profile_model_1.ProfileModel.find({
            visible: true,
            'planAssignment.expiresAt': { $gt: now }
        }).limit(20).exec();
        const profileAnalysis = await Promise.all(visibleProfiles.slice(0, 10).map(async (profile) => {
            const effectiveLevel = await (0, visibility_service_1.getEffectiveLevel)(profile, now);
            const priorityScore = await (0, visibility_service_1.getPriorityScore)(profile, now);
            return {
                id: profile._id.toString(),
                name: profile.name,
                effectiveLevel,
                priorityScore,
                lastShownAt: profile.lastShownAt || null
            };
        }));
        const feedResults = [];
        for (let i = 0; i < Number(iterations); i++) {
            const feed = await (0, feeds_service_1.getHomeFeed)({ page: 1, pageSize: Number(pageSize) });
            feedResults.push({
                iteration: i + 1,
                timestamp: new Date(),
                profiles: feed.profiles.map(p => ({
                    id: p._id.toString(),
                    name: p.name,
                    lastShownAt: p.lastShownAt
                }))
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        res.json({
            message: 'Prueba de rotación justa completada',
            profileAnalysis,
            feedResults,
            summary: {
                totalIterations: Number(iterations),
                profilesPerPage: Number(pageSize),
                note: 'Los perfiles con el mismo nivel y score deberían alternar su posición basándose en lastShownAt'
            }
        });
    }
    catch (error) {
        console.error('Error en prueba de fairness rotation:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.testFairnessRotationController = testFairnessRotationController;
const resetLastShownAtController = async (req, res) => {
    try {
        const result = await profile_model_1.ProfileModel.updateMany({}, { $unset: { lastShownAt: 1 } }).exec();
        res.json({
            message: 'lastShownAt reseteado para todos los perfiles',
            modifiedCount: result.modifiedCount
        });
    }
    catch (error) {
        console.error('Error al resetear lastShownAt:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.resetLastShownAtController = resetLastShownAtController;
const getFairnessStatsController = async (req, res) => {
    try {
        const now = new Date();
        const visibleProfiles = await profile_model_1.ProfileModel.find({
            visible: true,
            'planAssignment.expiresAt': { $gt: now }
        }).exec();
        const profilesWithMetadata = await Promise.all(visibleProfiles.map(async (profile) => {
            const effectiveLevel = await (0, visibility_service_1.getEffectiveLevel)(profile, now);
            const priorityScore = await (0, visibility_service_1.getPriorityScore)(profile, now);
            return {
                id: profile._id.toString(),
                name: profile.name,
                effectiveLevel,
                priorityScore,
                lastShownAt: profile.lastShownAt,
                key: `${effectiveLevel}-${priorityScore}`
            };
        }));
        const groupedProfiles = profilesWithMetadata.reduce((acc, profile) => {
            if (!acc[profile.key]) {
                acc[profile.key] = [];
            }
            acc[profile.key].push(profile);
            return acc;
        }, {});
        const tiedGroups = Object.entries(groupedProfiles)
            .filter(([_, profiles]) => profiles.length > 1)
            .map(([key, profiles]) => ({
            key,
            count: profiles.length,
            profiles: profiles.map(p => ({
                id: p.id,
                name: p.name,
                lastShownAt: p.lastShownAt
            }))
        }));
        res.json({
            totalProfiles: visibleProfiles.length,
            tiedGroups,
            summary: {
                groupsWithTies: tiedGroups.length,
                totalTiedProfiles: tiedGroups.reduce((sum, group) => sum + group.count, 0)
            }
        });
    }
    catch (error) {
        console.error('Error al obtener estadísticas de fairness:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.getFairnessStatsController = getFairnessStatsController;
