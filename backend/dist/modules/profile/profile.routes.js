"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller = __importStar(require("./profile.controller"));
const debugController = __importStar(require("./profile-debug.controller"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const admin_middleware_1 = require("../../middlewares/admin.middleware");
const router = (0, express_1.Router)();
router.post('/', controller.createProfile);
router.get('/', controller.getProfiles);
router.get('/home', controller.getProfilesForHome);
router.get('/admin/all', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, controller.getAllProfilesForAdmin);
router.post('/list', controller.getProfilesPost);
router.get('/stories', controller.getProfilesWithStories);
router.get('/verify-profile-name', controller.verifyProfileName);
router.post('/create-missing-verifications', controller.createMissingVerifications);
router.post('/:id/subscribe', controller.subscribeProfileController);
router.post('/:id/purchase-upgrade', controller.purchaseUpgradeController);
router.post('/:id/upgrade-plan', controller.upgradePlanController);
router.get('/:profileId/plan', controller.getProfilePlanInfoController);
router.get('/:profileId/plan/validate', controller.validatePlanOperationsController);
router.get('/:profileId/validate-plan-upgrade', controller.validateProfilePlanUpgradeController);
router.get('/:profileId/validate-upgrade/:upgradeCode', controller.validateUpgradePurchaseController);
router.get('/:profileId/debug-structure', debugController.debugProfileStructureController);
router.get('/user/:userId/usage-stats', controller.getUserUsageStatsController);
router.get('/user/:userId/validate-limits', controller.validateUserProfileLimitsController);
router.get('/user/:userId/profiles-summary', controller.getUserProfilesSummaryController);
router.get('/user/:userId/debug-profiles', debugController.debugUserProfilesController);
router.patch('/:id/hide', auth_middleware_1.authMiddleware, controller.hideProfileController);
router.patch('/:id/show', auth_middleware_1.authMiddleware, controller.showProfileController);
router.patch('/:id/delete', auth_middleware_1.authMiddleware, controller.userSoftDeleteProfileController);
router.patch('/:id/soft-delete', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, controller.softDeleteProfileController);
router.delete('/:id/hard-delete', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, controller.hardDeleteProfileController);
router.patch('/:id/restore', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, controller.restoreProfileController);
router.get('/deleted', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, controller.getDeletedProfilesController);
router.get('/:id', controller.getProfileById);
router.put('/:id', controller.updateProfile);
router.delete('/:id', controller.deleteProfile);
exports.default = router;
