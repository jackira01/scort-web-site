import { Router } from 'express';
import { JWTService } from '../services/jwt.service';
import { 
  verifyEmailController, 
  resendVerificationController 
} from '../controllers/auth.controller';

const router = Router();
const jwtService = new JWTService();

// Rutas de verificación de email
router.post('/verify-email', verifyEmailController);
router.post('/resend-verification', resendVerificationController);

/**
 * @route POST /auth/generate-token
 * @desc Generar JWT token para autenticación
 * @access Public (usado por NextAuth)
 */
router.post('/generate-token', async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId y role son requeridos'
      });
    }

    const token = jwtService.generateToken({ userId, role });

    res.json({
      success: true,
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route POST /auth/verify-token
 * @desc Verificar JWT token
 * @access Public
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token es requerido'
      });
    }

    const payload = jwtService.verifyToken(token);

    res.json({
      success: true,
      payload
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
});

export default router;