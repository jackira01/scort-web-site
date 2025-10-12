"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_mailjet_1 = __importDefault(require("node-mailjet"));
const config_parameter_service_1 = require("../modules/config-parameter/config-parameter.service");
class EmailService {
    constructor() {
        this.mailjet = null;
        this.senderEmail = '';
        this.appName = '';
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized)
            return;
        const apiKeyPublic = process.env.MJ_APIKEY_PUBLIC;
        const apiKeyPrivate = process.env.MJ_APIKEY_PRIVATE;
        this.senderEmail = await config_parameter_service_1.ConfigParameterService.getValue('company.email') || '';
        this.appName = await config_parameter_service_1.ConfigParameterService.getValue('company.name') || 'Soporte App';
        if (!apiKeyPublic || !apiKeyPrivate) {
            throw new Error('Mailjet API keys are required. Please set MJ_APIKEY_PUBLIC and MJ_APIKEY_PRIVATE environment variables.');
        }
        if (!this.senderEmail) {
            throw new Error('Company email is required. Please configure company.email in database configuration parameters.');
        }
        this.mailjet = new node_mailjet_1.default({
            apiKey: apiKeyPublic,
            apiSecret: apiKeyPrivate
        });
        this.initialized = true;
    }
    async sendSingleEmail(emailRequest) {
        try {
            await this.initialize();
            const { to, content } = emailRequest;
            const request = this.mailjet
                .post('send', { version: 'v3.1' })
                .request({
                Messages: [
                    {
                        From: {
                            Email: this.senderEmail,
                            Name: this.appName
                        },
                        To: [
                            {
                                Email: to.email,
                                Name: to.name || to.email
                            }
                        ],
                        Subject: content.subject,
                        TextPart: content.textPart,
                        HTMLPart: content.htmlPart
                    }
                ]
            });
            const result = await request;
            const messageInfo = result.body.Messages[0];
            if (messageInfo.Status === 'success') {
                return {
                    success: true,
                    messageId: messageInfo.To[0].MessageID.toString()
                };
            }
            else {
                return {
                    success: false,
                    error: messageInfo.Errors?.[0]?.ErrorMessage || 'Unknown error occurred'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to send email'
            };
        }
    }
    async sendBulkEmails(bulkEmailRequest) {
        try {
            await this.initialize();
            const { to, content } = bulkEmailRequest;
            const results = [];
            let totalSent = 0;
            let totalFailed = 0;
            const messages = to.map(recipient => ({
                From: {
                    Email: this.senderEmail,
                    Name: this.appName
                },
                To: [
                    {
                        Email: recipient.email,
                        Name: recipient.name || recipient.email
                    }
                ],
                Subject: content.subject,
                TextPart: content.textPart,
                HTMLPart: content.htmlPart
            }));
            const request = this.mailjet
                .post('send', { version: 'v3.1' })
                .request({
                Messages: messages
            });
            const result = await request;
            const messageResults = result.body.Messages;
            messageResults.forEach((messageInfo, index) => {
                const recipient = to[index];
                if (messageInfo.Status === 'success') {
                    results.push({
                        email: recipient.email,
                        success: true,
                        messageId: messageInfo.To[0].MessageID.toString()
                    });
                    totalSent++;
                }
                else {
                    results.push({
                        email: recipient.email,
                        success: false,
                        error: messageInfo.Errors?.[0]?.ErrorMessage || 'Unknown error occurred'
                    });
                    totalFailed++;
                }
            });
            return {
                success: totalSent > 0,
                results,
                totalSent,
                totalFailed
            };
        }
        catch (error) {
            const results = bulkEmailRequest.to.map(recipient => ({
                email: recipient.email,
                success: false,
                error: error.message || 'Failed to send email'
            }));
            return {
                success: false,
                results,
                totalSent: 0,
                totalFailed: bulkEmailRequest.to.length
            };
        }
    }
    async sendProfileVerificationNotification(profileName, profileId, changes) {
        try {
            await this.initialize();
            const companyEmail = await config_parameter_service_1.ConfigParameterService.getValue('company.email');
            if (!companyEmail) {
                throw new Error('Email de la empresa no configurado');
            }
            const emailContent = {
                subject: `Actualización de Verificación de Perfil - ${profileName}`,
                textPart: `
Se han realizado cambios en la verificación del perfil:

Perfil: ${profileName}
ID: ${profileId}
Cambios realizados: ${changes}
Fecha: ${new Date().toLocaleString('es-ES')}

Por favor, revisa estos cambios en el panel de administración.
        `,
                htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                🔄 Actualización de Verificación de Perfil
              </h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #495057; margin-top: 0;">Detalles del Perfil</h3>
                <p style="margin: 5px 0; color: #6c757d;"><strong>Nombre del Perfil:</strong> ${profileName}</p>
                <p style="margin: 5px 0; color: #6c757d;"><strong>ID del Perfil:</strong> ${profileId}</p>
                <p style="margin: 5px 0; color: #6c757d;"><strong>Fecha de Actualización:</strong> ${new Date().toLocaleString('es-ES')}</p>
              </div>
              
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">⚠️ Acción Requerida</h3>
                <p style="color: #856404; font-weight: 500;">Este perfil requiere revisión manual del administrador.</p>
                <p style="color: #856404; font-size: 14px;">El estado se ha cambiado automáticamente a "Pendiente" hasta su aprobación.</p>
              </div>
              
              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #1976d2; margin-top: 0;">Detalles de los Cambios</h3>
                <div style="color: #424242; line-height: 1.6; white-space: pre-line;">${changes}</div>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f1f3f4; border-radius: 6px;">
                <p style="color: #666; font-size: 14px; margin-bottom: 10px;">📋 <strong>Próximos Pasos:</strong></p>
                <p style="color: #666; font-size: 14px;">1. Accede al panel de administración</p>
                <p style="color: #666; font-size: 14px;">2. Revisa los cambios realizados</p>
                <p style="color: #666; font-size: 14px;">3. Aprueba o rechaza la verificación según corresponda</p>
              </div>
            </div>
          </div>
        `
            };
            return await this.sendSingleEmail({
                to: { email: companyEmail },
                content: emailContent
            });
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to send profile verification notification'
            };
        }
    }
    async sendEmailVerificationCode(email, code, userName) {
        try {
            await this.initialize();
            const displayName = userName || email.split('@')[0];
            const emailContent = {
                subject: `Código de verificación - ${this.appName}`,
                textPart: `
Hola ${displayName},

Tu código de verificación es: ${code}

Este código expirará en 15 minutos por seguridad.

Si no solicitaste este código, puedes ignorar este mensaje.

Saludos,
Equipo de ${this.appName}
        `,
                htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">🔐 Verificación de Email</h1>
                <p style="color: #666; font-size: 16px;">Hola ${displayName},</p>
              </div>
              
              <div style="text-align: center; background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                <p style="color: #333; font-size: 18px; margin-bottom: 20px;">Tu código de verificación es:</p>
                <div style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  ⏰ <strong>Importante:</strong> Este código expirará en 15 minutos por seguridad.
                </p>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 14px; line-height: 1.6;">
                <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
                <p style="margin-top: 20px;">
                  Saludos,<br>
                  <strong>Equipo de ${this.appName}</strong>
                </p>
              </div>
            </div>
          </div>
        `
            };
            return await this.sendSingleEmail({
                to: { email, name: displayName },
                content: emailContent
            });
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to send email verification code'
            };
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    validateEmailData(content, recipients) {
        if (!content.subject || content.subject.trim() === '') {
            return 'Subject is required';
        }
        if (!content.textPart && !content.htmlPart) {
            return 'Email content (textPart or htmlPart) is required';
        }
        if (!recipients || recipients.length === 0) {
            return 'At least one recipient is required';
        }
        for (const recipient of recipients) {
            if (!this.isValidEmail(recipient.email)) {
                return `Invalid email format: ${recipient.email}`;
            }
        }
        return null;
    }
}
exports.default = EmailService;
