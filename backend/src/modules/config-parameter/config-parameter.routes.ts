import { Router } from 'express';
import {
    adminMiddleware,
    authMiddleware,
    validateRequest,
} from '../../middlewares';
import { devAuthMiddleware } from '../../middlewares/auth.middleware';
import { ConfigParameterController } from './config-parameter.controller';
import { configParameterValidation } from './config-parameter.validation';

const router = Router();

// Rutas públicas (solo lectura de valores)
router.get('/value/:key', ConfigParameterController.getValue);
router.post(
    '/values',
    validateRequest(configParameterValidation.getValues),
    ConfigParameterController.getValues,
);

// Rutas que requieren autenticación
router.use(devAuthMiddleware);

// Rutas de lectura (usuarios autenticados)
router.get('/', ConfigParameterController.getAll);
router.get('/meta/categories', ConfigParameterController.getCategories);
router.get('/meta/tags', ConfigParameterController.getTags);
router.get('/category/:category', ConfigParameterController.getByCategory);
router.get('/type/:type', ConfigParameterController.getByType);
router.get('/key/:key', ConfigParameterController.getByKey);
router.get('/:id', ConfigParameterController.getById);

// Rutas que requieren permisos de administrador
router.use(adminMiddleware);

// CRUD operations (solo administradores)
router.post(
    '/',
    validateRequest(configParameterValidation.create),
    ConfigParameterController.create,
);
router.put(
    '/:id',
    validateRequest(configParameterValidation.update),
    ConfigParameterController.update,
);
router.delete('/:id', ConfigParameterController.delete);
router.patch('/:id/toggle', ConfigParameterController.toggleActive);

// Utilidades de validación
router.post(
    '/validate',
    validateRequest(configParameterValidation.validate),
    ConfigParameterController.validate,
);

export { router as configParameterRoutes };
