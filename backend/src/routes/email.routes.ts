import { Router } from 'express';
import {
  sendSingleEmailController,
  sendBulkEmailsController,
  testEmailConfigController,
  sendContactFormController
} from '../controllers/email.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

/**
 * @route POST /api/email/send
 * @desc Enviar un correo individual
 * @access Private (requiere autenticación)
 */
router.post('/send', authMiddleware, sendSingleEmailController);

/**
 * @route POST /api/email/send-bulk
 * @desc Enviar correos masivos
 * @access Private (requiere autenticación de administrador)
 */
router.post('/send-bulk', authMiddleware, adminMiddleware, sendBulkEmailsController);

/**
 * @route POST /api/email/test
 * @desc Probar la configuración del servicio de correo
 * @access Private (requiere autenticación de administrador)
 */
router.post('/test', authMiddleware, adminMiddleware, testEmailConfigController);

/**
 * @route POST /api/email/contact
 * @desc Enviar mensaje desde formulario de contacto
 * @access Public (no requiere autenticación)
 */
router.post('/contact', sendContactFormController);

export default router;