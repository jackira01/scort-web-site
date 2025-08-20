import { Router } from 'express';
import { 
  testFairnessRotationController,
  resetLastShownAtController,
  getFairnessStatsController
} from './feeds.test.controller';

const router = Router();

/**
 * @route GET /api/feeds/test/fairness-rotation
 * @desc Prueba el sistema de rotación justa simulando múltiples llamadas al feed
 * @query iterations - Número de iteraciones (default: 3)
 * @query pageSize - Tamaño de página (default: 5)
 */
router.get('/fairness-rotation', testFairnessRotationController);

/**
 * @route POST /api/feeds/test/reset-lastshown
 * @desc Resetea lastShownAt de todos los perfiles (útil para pruebas)
 */
router.post('/reset-lastshown', resetLastShownAtController);

/**
 * @route GET /api/feeds/test/fairness-stats
 * @desc Obtiene estadísticas detalladas sobre grupos de perfiles empatados
 */
router.get('/fairness-stats', getFairnessStatsController);

export { router as feedsTestRoutes };