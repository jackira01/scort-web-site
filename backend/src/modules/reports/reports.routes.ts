import { Router } from 'express';
import { adminMiddleware } from '../../middlewares/admin.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { exportProfilesToExcel } from './reports.controller';

const router = Router();

// Ruta para exportar perfiles a Excel
// GET /api/reports/profiles
router.get('/profiles', authMiddleware, adminMiddleware, exportProfilesToExcel);

export default router;
