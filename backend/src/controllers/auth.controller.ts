import { Request, Response } from 'express';
import { EmailVerificationService } from '../modules/user/email-verification.service';
import { findUserByEmail } from '../modules/user/user.service';
import UserModel from '../modules/user/User.model';

const emailVerificationService = new EmailVerificationService();

/**
 * Verifica el código de email enviado por el usuario
 */
export const verifyEmailController = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
    }

    // Verificar el código
    const isValid = await emailVerificationService.verifyCode(email, code);

    if (isValid) {
      // Marcar el email como verificado en la base de datos
      await UserModel.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { emailVerified: new Date() },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Email verificado exitosamente'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación inválido'
      });
    }
  } catch (error: any) {
    console.error('Error in verifyEmailController:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al verificar el código'
    });
  }
};

/**
 * Reenvía el código de verificación de email
 */
export const resendVerificationController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Verificar que el usuario existe
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya está verificado
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está verificado'
      });
    }

    // Verificar si ya existe un código activo (para evitar spam)
    const hasActiveCode = await emailVerificationService.hasActiveCode(email);
    if (hasActiveCode) {
      return res.status(429).json({
        success: false,
        message: 'Ya existe un código activo. Espera antes de solicitar otro.'
      });
    }

    // Enviar nuevo código
    await emailVerificationService.sendVerificationCode(email, user.name);

    return res.status(200).json({
      success: true,
      message: 'Código de verificación reenviado'
    });
  } catch (error: any) {
    console.error('Error in resendVerificationController:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al reenviar el código'
    });
  }
};

/**
 * Verifica si existe un código de verificación activo para el email
 */
export const checkVerificationStatusController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Verificar si existe un código activo
    const codeInfo = await emailVerificationService.getActiveCodeInfo(email);

    if (codeInfo) {
      return res.status(200).json({
        success: true,
        hasActiveCode: true,
        expiresAt: codeInfo.expiresAt
      });
    } else {
      return res.status(200).json({
        success: true,
        hasActiveCode: false
      });
    }
  } catch (error: any) {
    console.error('Error in checkVerificationStatusController:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar el estado'
    });
  }
};