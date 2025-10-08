import crypto from 'crypto';
import { EmailVerification, IEmailVerification } from './email-verification.model';
import EmailService from '../../services/email.service';

export class EmailVerificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Genera un código de verificación de 6 dígitos
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Envía un código de verificación por email
   */
  async sendVerificationCode(email: string, userName?: string): Promise<void> {
    try {
      // Eliminar cualquier código existente para este email
      await EmailVerification.deleteOne({ email });

      // Generar nuevo código
      const code = this.generateVerificationCode();

      // Guardar en la base de datos
      await EmailVerification.create({
        email,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
        attempts: 0,
      });

      // Enviar email con el código
      await this.emailService.sendEmailVerificationCode(email, code, userName);
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw new Error('Error al enviar código de verificación');
    }
  }

  /**
   * Verifica un código de verificación
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const verification = await EmailVerification.findOne({ email });

      if (!verification) {
        throw new Error('No se encontró código de verificación para este email');
      }

      // Verificar si el código ha expirado
      if (verification.expiresAt < new Date()) {
        await EmailVerification.deleteOne({ email });
        throw new Error('El código de verificación ha expirado');
      }

      // Verificar número de intentos
      if (verification.attempts >= 5) {
        await EmailVerification.deleteOne({ email });
        throw new Error('Demasiados intentos fallidos. Solicita un nuevo código');
      }

      // Incrementar intentos
      verification.attempts += 1;
      await verification.save();

      // Verificar el código
      if (verification.code !== code) {
        throw new Error('Código de verificación incorrecto');
      }

      // Código correcto - eliminar de la base de datos
      await EmailVerification.deleteOne({ email });
      return true;
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  }

  /**
   * Elimina códigos expirados (cleanup manual si es necesario)
   */
  async cleanupExpiredCodes(): Promise<void> {
    try {
      await EmailVerification.deleteMany({
        expiresAt: { $lt: new Date() }
      });
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
    }
  }

  /**
   * Verifica si existe un código activo para un email
   */
  async hasActiveCode(email: string): Promise<boolean> {
    try {
      const verification = await EmailVerification.findOne({
        email,
        expiresAt: { $gt: new Date() }
      });
      return !!verification;
    } catch (error) {
      console.error('Error checking active code:', error);
      return false;
    }
  }
}