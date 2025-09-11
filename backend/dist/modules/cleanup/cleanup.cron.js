"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCleanupCronStatus = exports.runManualCleanup = exports.stopCleanupCron = exports.startCleanupCron = void 0;
const cleanup_service_1 = require("./cleanup.service");
let cleanupInterval = null;
let isRunning = false;
const scheduleNextCleanup = () => {
    cleanupInterval = setTimeout(async () => {
        try {
            await (0, cleanup_service_1.runCleanupTasks)();
        }
        catch (error) {
            console.error('[Cleanup Cron] Error during scheduled cleanup:', error);
        }
        if (isRunning) {
            scheduleNextCleanup();
        }
    }, 5 * 60 * 1000);
};
const startCleanupCron = () => {
    if (isRunning) {
        console.log('[Cleanup Cron] Job already running, skipping start');
        return;
    }
    isRunning = true;
    scheduleNextCleanup();
    console.log('[Cleanup Cron] Started - running every 5 minutes');
};
exports.startCleanupCron = startCleanupCron;
const stopCleanupCron = () => {
    if (cleanupInterval) {
        clearTimeout(cleanupInterval);
        cleanupInterval = null;
    }
    isRunning = false;
    console.log('[Cleanup Cron] Stopped');
};
exports.stopCleanupCron = stopCleanupCron;
const runManualCleanup = async () => {
    console.log('[Cleanup Cron] Running manual cleanup...');
    try {
        const result = await (0, cleanup_service_1.runCleanupTasks)();
        console.log('[Cleanup Cron] Manual cleanup completed:', result);
    }
    catch (error) {
        console.error('[Cleanup Cron] Error during manual cleanup:', error);
        throw error;
    }
};
exports.runManualCleanup = runManualCleanup;
const getCleanupCronStatus = () => {
    return {
        isRunning: isRunning,
        nextRun: isRunning ? 'Every 5 minutes' : null
    };
};
exports.getCleanupCronStatus = getCleanupCronStatus;
