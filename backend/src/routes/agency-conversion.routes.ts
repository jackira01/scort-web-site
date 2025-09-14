import { Router } from 'express';
import agencyConversionController from '../controllers/agency-conversion.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route POST /api/agency-conversion/request
 * @desc Solicitar conversión a cuenta de agencia
 * @access Usuario autenticado
 */
router.post('/request', agencyConversionController.requestConversion);

/**
 * @route POST /api/agency-conversion/process/:userId
 * @desc Aprobar o rechazar conversión a agencia
 * @access Solo administradores
 */
router.post('/process/:userId', agencyConversionController.processConversion);

/**
 * @route GET /api/agency-conversion/pending
 * @desc Obtener solicitudes de conversión pendientes
 * @access Solo administradores
 */
router.get('/pending', agencyConversionController.getPendingConversions);

/**
 * @route GET /api/agency-conversion/history
 * @desc Obtener historial de conversiones
 * @access Solo administradores
 */
router.get('/history', agencyConversionController.getConversionHistory);

/**
 * @route GET /api/agency-conversion/check-profile-creation
 * @desc Verificar si el usuario puede crear perfiles adicionales
 * @access Usuario autenticado
 */
router.get('/check-profile-creation', agencyConversionController.checkProfileCreation);

/**
 * @route GET /api/agency-conversion/stats
 * @desc Obtener estadísticas de conversiones
 * @access Solo administradores
 */
router.get('/stats', agencyConversionController.getConversionStats);

export default router;