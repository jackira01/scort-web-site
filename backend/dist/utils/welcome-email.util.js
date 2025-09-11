"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = void 0;
const email_service_1 = __importDefault(require("../services/email.service"));
const sendWelcomeEmail = async (email, name) => {
    try {
        const emailService = new email_service_1.default();
        await emailService.sendSingleEmail({
            to: { email },
            content: {
                subject: '¡Bienvenido a nuestra plataforma!',
                htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">¡Bienvenido${name ? ` ${name}` : ''}!</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Gracias por unirte a nosotros</h2>
              
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                Estamos emocionados de tenerte como parte de nuestra comunidad. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a explorar todas las funcionalidades que tenemos para ti.
              </p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Próximos pasos:</h3>
                <ul style="color: #555; line-height: 1.8;">
                  <li>Completa tu perfil para una mejor experiencia</li>
                  <li>Explora nuestras funcionalidades principales</li>
                  <li>Configura tus preferencias de cuenta</li>
                </ul>
              </div>
              
              <p style="color: #555; line-height: 1.6;">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Nuestro equipo de soporte está aquí para ayudarte.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
              <p>Este correo fue enviado automáticamente. Por favor, no respondas a este mensaje.</p>
              <p style="margin-top: 10px;">
                © ${new Date().getFullYear()} Nuestra Plataforma. Todos los derechos reservados.
              </p>
            </div>
          </div>
        `
            }
        });
        console.log(`Correo de bienvenida enviado a: ${email}`);
    }
    catch (error) {
        console.error('Error enviando correo de bienvenida:', error);
        throw error;
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
