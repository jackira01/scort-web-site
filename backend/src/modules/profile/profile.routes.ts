import { Router } from 'express';
import * as controller from './profile.controller';

const router = Router();

router.post('/', controller.createProfile);
router.get('/', controller.getProfiles);
router.get('/verify-profile-name', controller.verifyProfileName);
router.get('/:id', controller.getProfileById);
router.put('/:id', controller.updateProfile);
router.delete('/:id', controller.deleteProfile);

export default router;
