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