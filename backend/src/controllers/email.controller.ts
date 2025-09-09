import { Request, Response } from 'express';
import EmailService from '../services/email.service';
import { SingleEmailRequest, BulkEmailRequest } from '../types/email.types';

// Función para obtener la instancia del servicio de forma lazy
const getEmailService = () => {
  return new EmailService();
};

/**
 * Controlador para envío de correo individual
 */
export const sendSingleEmailController = async (req: Request, res: Response) => {
  try {
    const { to, content }: SingleEmailRequest = req.body;

    // Validar datos
    const emailService = getEmailService();
    const validationError = emailService.validateEmailData(content, [to]);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    // Enviar correo
    const result = await emailService.sendSingleEmail({ to, content });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Controlador para envío de correos masivos
 */
export const sendBulkEmailsController = async (req: Request, res: Response) => {
  try {
    const { to, content }: BulkEmailRequest = req.body;

    // Validar datos
    const emailService = getEmailService();
    const validationError = emailService.validateEmailData(content, to);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    // Enviar correos
    const result = await emailService.sendBulkEmails({ to, content });

    return res.status(200).json({
      success: result.success,
      message: `Emails processed: ${result.totalSent} sent, ${result.totalFailed} failed`,
      results: result.results,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Controlador para probar la configuración del servicio de correo
 */
export const testEmailConfigController = async (req: Request, res: Response) => {
  try {
    const testEmail = {
      to: {
        email: req.body.testEmail || 'test@example.com',
        name: 'Test User'
      },
      content: {
        subject: 'Test Email - Configuración de Mailjet',
        textPart: 'Este es un correo de prueba para verificar la configuración de Mailjet.',
        htmlPart: '<h3>Test Email</h3><p>Este es un correo de prueba para verificar la configuración de Mailjet.</p>'
      }
    };

    const emailService = getEmailService();
    const result = await emailService.sendSingleEmail(testEmail);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
};