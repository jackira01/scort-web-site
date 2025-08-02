import { Router } from 'express';
import * as userController from './user.controller';

const router = Router();

/* router.post('/create_user', userController.CreateUserController); */

/* router.get('/', profileController.obtenerPerfiles);
router.get('/:id', profileController.obtenerPerfilPorId);

router.delete('/:id', profileController.eliminarPerfil);*/
router.post('/auth_google', userController.authGoogleUserController);
router.post('/verify_user', userController.verifyUserController);
router.post('/upload_user_document', userController.uploadUserDocumentController);
router.get('/:id/profiles', userController.getUserProfiles);
router.post('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);



export default router;
