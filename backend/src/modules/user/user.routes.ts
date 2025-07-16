import { Router } from 'express';
import * as userController from './user.controller';

const router = Router();

/* router.post('/create_user', userController.CreateUserController); */

/* router.get('/', profileController.obtenerPerfiles);
router.get('/:id', profileController.obtenerPerfilPorId);
router.put('/:id', profileController.actualizarPerfil);
router.delete('/:id', profileController.eliminarPerfil);*/
router.post('/auth_google', userController.authGoogleUserController);

export default router;
