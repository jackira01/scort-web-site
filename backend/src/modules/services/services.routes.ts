import { Router } from 'express';
import {
    createServiceHandler,
    deleteServiceHandler,
    getServiceByIdHandler,
    getServiceNamesHandler,
    getServicesHandler,
    updateServiceHandler,
} from './services.controller';

const router = Router();

router.post('/', createServiceHandler);
router.get('/', getServicesHandler);
router.get('/names', getServiceNamesHandler);
router.get('/:id', getServiceByIdHandler);
router.put('/:id', updateServiceHandler);
router.delete('/:id', deleteServiceHandler);

export default router;
