import { Router } from 'express';
import { 
  verifyEmailController, 
  resendVerificationController 
} from '../controllers/auth.controller';

const router = Router();

// Ruta para verificar código de email
router.post('/verify-email', verifyEmailController);

// Ruta para reenviar código de verificación
router.post('/resend-verification', resendVerificationController);

export default router;