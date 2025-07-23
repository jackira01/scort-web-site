import { Router } from 'express';
import {
    createGenderHandler,
    deleteGenderHandler,
    getGenderByIdHandler,
    getGenderNamesHandler,
    getGendersHandler,
    updateGenderHandler,
} from './gender.controller';

const router = Router();

router.post('/', createGenderHandler);
router.get('/names', getGenderNamesHandler);
router.get('/', getGendersHandler);
router.get('/:id', getGenderByIdHandler);
router.put('/:id', updateGenderHandler);
router.delete('/:id', deleteGenderHandler);

export default router;
