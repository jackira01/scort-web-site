"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cleanup_controller_1 = require("./cleanup.controller");
const router = (0, express_1.Router)();
router.post('/run', cleanup_controller_1.runCleanupController);
router.get('/status', cleanup_controller_1.getCleanupStatusController);
router.get('/stats', cleanup_controller_1.getVisibilityStatsController);
exports.default = router;
