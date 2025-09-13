"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisibilityStatsController = exports.getCleanupStatusController = exports.runCleanupController = void 0;
const cleanup_cron_1 = require("./cleanup.cron");
const cleanup_service_1 = require("./cleanup.service");
const runCleanupController = async (req, res) => {
    try {
        await (0, cleanup_cron_1.runManualCleanup)();
        res.status(200).json({
            success: true,
            message: 'Manual cleanup completed successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.runCleanupController = runCleanupController;
const getCleanupStatusController = (req, res) => {
    try {
        const status = (0, cleanup_cron_1.getCleanupCronStatus)();
        res.status(200).json({
            success: true,
            data: status
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCleanupStatusController = getCleanupStatusController;
const getVisibilityStatsController = async (req, res) => {
    try {
        const stats = await (0, cleanup_service_1.getProfileVisibilityStats)();
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getVisibilityStatsController = getVisibilityStatsController;
