import { Router } from 'express';
import * as controller from './profile.controller';
import * as debugController from './profile-debug.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const router = Router();

/* ===========================
   📌 Rutas sin parámetros
=========================== */
router.post('/', controller.createProfile);
router.get('/', controller.getProfiles);
router.get('/home', controller.getProfilesForHome);
router.get('/admin/all', authMiddleware, adminMiddleware, controller.getAllProfilesForAdmin);
router.post('/list', controller.getProfilesPost);
router.get('/stories', controller.getProfilesWithStories);
router.get('/verify-profile-name', controller.verifyProfileName);
router.post('/create-missing-verifications', controller.createMissingVerifications);

/* ===========================
   📌 Rutas específicas con ID (deben ir antes de /:id genérico)
=========================== */
router.post('/:id/subscribe', controller.subscribeProfileController);
router.post('/:id/purchase-upgrade', controller.purchaseUpgradeController);
router.post('/:id/upgrade-plan', controller.upgradePlanController);

// Información de plan y validaciones
router.get('/:profileId/plan', controller.getProfilePlanInfoController);
router.get('/:profileId/plan/validate', controller.validatePlanOperationsController);
router.get('/:profileId/validate-plan-upgrade', controller.validateProfilePlanUpgradeController);
router.get('/:profileId/validate-upgrade/:upgradeCode', controller.validateUpgradePurchaseController);

// Debug de perfil
router.get('/:profileId/debug-structure', debugController.debugProfileStructureController);

/* ===========================
   📌 Rutas por usuario
=========================== */
router.get('/user/:userId/usage-stats', controller.getUserUsageStatsController);
router.get('/user/:userId/validate-limits', controller.validateUserProfileLimitsController);
router.get('/user/:userId/profiles-summary', controller.getUserProfilesSummaryController);
router.get('/user/:userId/debug-profiles', debugController.debugUserProfilesController);

/* ===========================
   📌 Validaciones de creación de perfiles (nuevas validaciones separadas)
=========================== */
// VALIDACIÓN A: Máximo total de perfiles (antes de entrar al wizard)
router.get('/validate-max', authMiddleware, controller.validateMaxProfilesController);

// VALIDACIÓN B: Validación de selección de plan (paso 4 del wizard)
router.post('/validate-plan-selection', authMiddleware, controller.validatePlanSelectionController);

/* ===========================
   📌 Rutas de eliminación y restauración
=========================== */
// Para usuarios normales: ocultar/mostrar perfiles y eliminación lógica
router.patch('/:id/hide', authMiddleware, controller.hideProfileController);
router.patch('/:id/show', authMiddleware, controller.showProfileController);
router.patch('/:id/delete', authMiddleware, controller.userSoftDeleteProfileController);

// Para administradores: borrado lógico/físico y restauración
router.patch('/:id/soft-delete', authMiddleware, adminMiddleware, controller.softDeleteProfileController);
router.delete('/:id/hard-delete', authMiddleware, adminMiddleware, controller.hardDeleteProfileController);
router.patch('/:id/restore', authMiddleware, adminMiddleware, controller.restoreProfileController);
router.get('/deleted', authMiddleware, adminMiddleware, controller.getDeletedProfilesController);

/* ===========================
   📌 Rutas genéricas con :id (SIEMPRE AL FINAL)
=========================== */
router.get('/:id', controller.getProfileById);
router.put('/:id', controller.updateProfile);
router.delete('/:id', controller.deleteProfile);

export default router;
