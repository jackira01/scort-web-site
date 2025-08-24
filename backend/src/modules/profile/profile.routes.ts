import { Router } from 'express';
import * as controller from './profile.controller';

const router = Router();

router.post('/', controller.createProfile);
router.get('/', controller.getProfiles);
router.get('/home', controller.getProfilesForHome);
router.post('/list', controller.getProfilesPost);
router.get('/stories', controller.getProfilesWithStories);
router.get('/verify-profile-name', controller.verifyProfileName);
router.post('/create-missing-verifications', controller.createMissingVerifications);
router.get('/:id', controller.getProfileById);
router.put('/:id', controller.updateProfile);
router.delete('/:id', controller.deleteProfile);

// Nuevas rutas para suscripción y upgrades
router.post('/:id/subscribe', controller.subscribeProfileController);
router.post('/:id/purchase-upgrade', controller.purchaseUpgradeController);

// Ruta para estadísticas de uso del usuario (debugging)
router.get('/user/:userId/usage-stats', controller.getUserUsageStatsController);

// Nuevas rutas para límites de perfiles
router.get('/user/:userId/validate-limits', controller.validateUserProfileLimitsController);
router.get('/user/:userId/profiles-summary', controller.getUserProfilesSummaryController);
router.get('/:profileId/validate-plan-upgrade', controller.validateProfilePlanUpgradeController);

export default router;
