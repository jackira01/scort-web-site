import { Router } from 'express';
import { EmailInboxController } from './email-inbox.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const router = Router();

// Todas las rutas requieren autenticación excepto el webhook
router.use('/webhook', (req, res, next) => {
  // El webhook no requiere autenticación para permitir que servicios externos envíen correos
  next();
});

// Aplicar autenticación a todas las demás rutas
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Aplicar restricción de rol admin a rutas administrativas
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next();
  }
  adminMiddleware(req, res, next);
});

// Aplicar autenticación a todas las rutas excepto webhook
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next();
  }
  authenticateToken(req, res, next);
});

/**
 * @route GET /api/email-inbox
 * @desc Obtener lista de correos recibidos con paginación y filtros
 * @access Admin
 * @query page - Número de página (default: 1)
 * @query limit - Límite por página (default: 20)
 * @query from - Filtrar por remitente
 * @query subject - Filtrar por asunto
 * @query dateFrom - Filtrar desde fecha
 * @query dateTo - Filtrar hasta fecha
 * @query isRead - Filtrar por estado de lectura (true/false)
 */
router.get('/', EmailInboxController.getInboxEmails);

/**
 * @route GET /api/email-inbox/stats
 * @desc Obtener estadísticas del inbox
 * @access Admin
 */
router.get('/stats', EmailInboxController.getInboxStats);

/**
 * @route GET /api/email-inbox/:id
 * @desc Obtener un correo específico por ID
 * @access Admin
 */
router.get('/:id', EmailInboxController.getEmailById);

/**
 * @route PATCH /api/email-inbox/mark-read
 * @desc Marcar correos como leídos
 * @access Admin
 * @body { emailIds: string[] }
 */
router.patch('/mark-read', EmailInboxController.markAsRead);

/**
 * @route PATCH /api/email-inbox/mark-unread
 * @desc Marcar correos como no leídos
 * @access Admin
 * @body { emailIds: string[] }
 */
router.patch('/mark-unread', EmailInboxController.markAsUnread);

/**
 * @route DELETE /api/email-inbox
 * @desc Eliminar correos
 * @access Admin
 * @body { emailIds: string[] }
 */
router.delete('/', EmailInboxController.deleteEmails);

/**
 * @route POST /api/email-inbox/webhook
 * @desc Webhook para recibir correos desde proveedores externos
 * @access Public (sin autenticación)
 * @body Payload del proveedor de email
 */
router.post('/webhook', EmailInboxController.receiveEmailWebhook);

/**
 * @route POST /api/email-inbox/test-receive
 * @desc Endpoint de prueba para simular recepción de correo
 * @access Admin
 * @body Datos del correo de prueba
 */
router.post('/test-receive', EmailInboxController.testReceiveEmail);

export { router as emailInboxRoutes };