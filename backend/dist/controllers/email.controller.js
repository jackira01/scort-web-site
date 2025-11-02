"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContactFormController = exports.testEmailConfigController = exports.sendBulkEmailsController = exports.sendSingleEmailController = void 0;
const email_service_1 = __importDefault(require("../services/email.service"));
const config_parameter_service_1 = require("../modules/config-parameter/config-parameter.service");
const getEmailService = () => {
    return new email_service_1.default();
};
const sendSingleEmailController = async (req, res) => {
    try {
        const { to, content } = req.body;
        const emailService = getEmailService();
        const validationError = emailService.validateEmailData(content, [to]);
        if (validationError) {
            return res.status(400).json({
                success: false,
                error: validationError
            });
        }
        const result = await emailService.sendSingleEmail({ to, content });
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Email sent successfully',
                messageId: result.messageId
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};
exports.sendSingleEmailController = sendSingleEmailController;
const sendBulkEmailsController = async (req, res) => {
    try {
        const { to, content } = req.body;
        const emailService = getEmailService();
        const validationError = emailService.validateEmailData(content, to);
        if (validationError) {
            return res.status(400).json({
                success: false,
                error: validationError
            });
        }
        const result = await emailService.sendBulkEmails({ to, content });
        return res.status(200).json({
            success: result.success,
            message: `Emails processed: ${result.totalSent} sent, ${result.totalFailed} failed`,
            results: result.results,
            totalSent: result.totalSent,
            totalFailed: result.totalFailed
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};
exports.sendBulkEmailsController = sendBulkEmailsController;
const testEmailConfigController = async (req, res) => {
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
        }
        else {
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send test email'
        });
    }
};
exports.testEmailConfigController = testEmailConfigController;
const sendContactFormController = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            console.error('❌ Missing required fields in contact form');
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos: name, email, subject, message'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email inválido'
            });
        }
        const companyEmail = await config_parameter_service_1.ConfigParameterService.getValue('company.email');
        const companyName = await config_parameter_service_1.ConfigParameterService.getValue('company.name') || 'Equipo de Soporte';
        if (!companyEmail) {
            console.error('❌ Company email not configured in database');
            return res.status(500).json({
                success: false,
                error: 'Configuración de correo no disponible. Contacta al administrador.'
            });
        }
        const supportEmail = {
            to: {
                email: companyEmail,
                name: companyName
            },
            content: {
                subject: `[Contacto Web] ${subject}`,
                textPart: `Nuevo mensaje de contacto:

Nombre: ${name}
Email: ${email}
Asunto: ${subject}

Mensaje:
${message}`,
                htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Nuevo Mensaje de Contacto</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Asunto:</strong> ${subject}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Mensaje:</h3>
              <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #007bff; border-radius: 3px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px;">Este mensaje fue enviado desde el formulario de contacto del sitio web.</p>
          </div>
        `
            }
        };
        console.log('📤 Attempting to send email...');
        const emailService = getEmailService();
        const result = await emailService.sendSingleEmail(supportEmail);
        console.log('📬 Email service result:', {
            success: result.success,
            messageId: result.messageId,
            error: result.error
        });
        if (result.success) {
            console.log('✅ Contact email sent successfully:', result.messageId);
            return res.status(200).json({
                success: true,
                message: 'Mensaje enviado exitosamente. Te contactaremos pronto.',
                messageId: result.messageId
            });
        }
        else {
            console.error('❌ Failed to send contact email:', result.error);
            return res.status(500).json({
                success: false,
                error: 'Error al enviar el mensaje. Inténtalo de nuevo más tarde.'
            });
        }
    }
    catch (error) {
        console.error('💥 Contact form controller error:', {
            message: error.message,
            stack: error.stack
        });
        return res.status(500).json({
            success: false,
            error: error.message || 'Error interno del servidor'
        });
    }
};
exports.sendContactFormController = sendContactFormController;
