import Mailjet from 'node-mailjet';
import { 
  EmailRecipient, 
  EmailContent, 
  SingleEmailRequest, 
  BulkEmailRequest, 
  EmailResponse, 
  BulkEmailResponse 
} from '../types/email.types';
import { ConfigParameterService } from '../modules/config-parameter/config-parameter.service';

class EmailService {
  private mailjet: Mailjet | null = null;
  private senderEmail: string = '';
  private appName: string = '';
  private initialized: boolean = false;

  private async initialize() {
    if (this.initialized) return;

    const apiKeyPublic = process.env.MJ_APIKEY_PUBLIC;
    const apiKeyPrivate = process.env.MJ_APIKEY_PRIVATE;
    
    // Obtener configuración desde la base de datos
    this.senderEmail = await ConfigParameterService.getValue('company.email') || '';
    this.appName = await ConfigParameterService.getValue('company.name') || 'Soporte App';

    if (!apiKeyPublic || !apiKeyPrivate) {
      throw new Error('Mailjet API keys are required. Please set MJ_APIKEY_PUBLIC and MJ_APIKEY_PRIVATE environment variables.');
    }

    if (!this.senderEmail) {
      throw new Error('Company email is required. Please configure company.email in database configuration parameters.');
    }

    this.mailjet = new Mailjet({
      apiKey: apiKeyPublic,
      apiSecret: apiKeyPrivate
    });

    this.initialized = true;
  }

  /**
   * Envía un correo individual
   * @param emailRequest - Datos del correo a enviar
   * @returns Promise<EmailResponse>
   */
  async sendSingleEmail(emailRequest: SingleEmailRequest): Promise<EmailResponse> {
    try {
      await this.initialize();
      const { to, content } = emailRequest;

      const request = this.mailjet!
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
      const messageInfo = (result.body as any).Messages[0];

      if (messageInfo.Status === 'success') {
        return {
          success: true,
          messageId: messageInfo.To[0].MessageID.toString()
        };
      } else {
        return {
          success: false,
          error: messageInfo.Errors?.[0]?.ErrorMessage || 'Unknown error occurred'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Envía correos masivos
   * @param bulkEmailRequest - Datos de los correos a enviar
   * @returns Promise<BulkEmailResponse>
   */
  async sendBulkEmails(bulkEmailRequest: BulkEmailRequest): Promise<BulkEmailResponse> {
    try {
      await this.initialize();
      const { to, content } = bulkEmailRequest;
      const results: BulkEmailResponse['results'] = [];
      let totalSent = 0;
      let totalFailed = 0;

      // Preparar mensajes para envío masivo
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

      const request = this.mailjet!
        .post('send', { version: 'v3.1' })
        .request({
          Messages: messages
        });

      const result = await request;
      const messageResults = (result.body as any).Messages;

      // Procesar resultados
      messageResults.forEach((messageInfo: any, index: number) => {
        const recipient = to[index];
        
        if (messageInfo.Status === 'success') {
          results.push({
            email: recipient.email,
            success: true,
            messageId: messageInfo.To[0].MessageID.toString()
          });
          totalSent++;
        } else {
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
    } catch (error: any) {
      // En caso de error general, marcar todos como fallidos
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

  /**
   * Envía notificación por correo sobre cambios en verificación de perfil
   * @param profileName - Nombre del perfil
   * @param profileId - ID del perfil
   * @param changes - Descripción de los cambios realizados
   * @returns Promise<EmailResponse>
   */
  async sendProfileVerificationNotification(
    profileName: string,
    profileId: string,
    changes: string
  ): Promise<EmailResponse> {
    try {
      await this.initialize();
      
      const companyEmail = await ConfigParameterService.getValue('company.email');
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send profile verification notification'
      };
    }
  }

  /**
   * Valida el formato de email
   * @param email - Email a validar
   * @returns boolean
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida los datos del correo antes del envío
   * @param content - Contenido del correo
   * @param recipients - Lista de destinatarios
   * @returns string | null - Error message or null if valid
   */
  validateEmailData(content: EmailContent, recipients: EmailRecipient[]): string | null {
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

export default EmailService;