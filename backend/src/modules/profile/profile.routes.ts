import { Router } from 'express';
import * as profileController from './profile.controller';

const router = Router();

router.post('/', profileController.crearPerfil);
router.get('/', profileController.obtenerPerfiles);
router.get('/:id', profileController.obtenerPerfilPorId);
router.put('/:id', profileController.actualizarPerfil);
router.delete('/:id', profileController.eliminarPerfil);

export default router;
