import { Router } from 'express';
import { getHomeFeedController, getFeedStatsController } from './feeds.controller';
import { feedsTestRoutes } from './feeds.test.routes';

const router = Router();

/**
 * GET /api/feeds/home
 * Obtiene el feed principal con perfiles ordenados por nivel y prioridad
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 20, max: 100)
 */
router.get('/home', getHomeFeedController);

/**
 * GET /api/feeds/stats
 * Obtiene estadísticas del feed para debugging
 */
router.get('/stats', getFeedStatsController);

/**
 * Rutas de prueba para el sistema de fairness rotation
 * Solo disponibles en desarrollo/testing
 */
router.use('/test', feedsTestRoutes);

export default router;