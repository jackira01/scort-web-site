import { Router } from 'express';
import { 
  runCleanupController, 
  getCleanupStatusController, 
  getVisibilityStatsController 
} from './cleanup.controller';

const router = Router();

/**
 * POST /api/cleanup/run
 * Ejecuta una limpieza manual inmediata
 */
router.post('/run', runCleanupController);

/**
 * GET /api/cleanup/status
 * Obtiene el estado del cron job de limpieza
 */
router.get('/status', getCleanupStatusController);

/**
 * GET /api/cleanup/stats
 * Obtiene estadísticas de visibilidad de perfiles
 */
router.get('/stats', getVisibilityStatsController);

export default router;