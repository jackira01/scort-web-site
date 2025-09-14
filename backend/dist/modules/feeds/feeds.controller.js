"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedStatsController = exports.getHomeFeedController = void 0;
const feeds_service_1 = require("./feeds.service");
const getHomeFeedController = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
        if (page < 1) {
            res.status(400).json({ error: 'Page must be greater than 0' });
            return;
        }
        if (pageSize < 1 || pageSize > 100) {
            res.status(400).json({ error: 'PageSize must be between 1 and 100' });
            return;
        }
        const feedData = await (0, feeds_service_1.getHomeFeed)({ page, pageSize });
        res.status(200).json({
            success: true,
            data: feedData
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getHomeFeedController = getHomeFeedController;
const getFeedStatsController = async (req, res) => {
    try {
        const stats = await (0, feeds_service_1.getHomeFeedStats)();
        res.status(200).json({
            success: true,
            data: {
                profilesByLevel: stats,
                totalProfiles: Object.values(stats).reduce((sum, count) => sum + count, 0)
            }
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFeedStatsController = getFeedStatsController;
