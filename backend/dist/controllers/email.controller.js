"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmailConfigController = exports.sendBulkEmailsController = exports.sendSingleEmailController = void 0;
const email_service_1 = __importDefault(require("../services/email.service"));
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
