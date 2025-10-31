import { Router } from 'express';
import {
  verifyEmailController,
  resendVerificationController,
  checkVerificationStatusController
} from '../controllers/auth.controller';

const router = Router();

// Ruta para verificar código de email
router.post('/verify-email', verifyEmailController);

// Ruta para reenviar código de verificación
router.post('/resend-verification', resendVerificationController);

// Ruta para verificar estado del código activo
router.post('/check-verification-status', checkVerificationStatusController);

export default router;