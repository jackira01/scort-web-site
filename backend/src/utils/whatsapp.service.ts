import { IInvoice } from '../modules/payments/invoice.model';
import { IProfile } from '../modules/profile/profile.types';
import { IUser } from '../modules/user/User.model';
import { Types } from 'mongoose';

export interface WhatsAppMessageData {
  message: string;
  phoneNumber: string;
  url: string;
}

export interface InvoiceWhatsAppData {
  invoiceId: string;
  profileName: string;
  userName: string;
  userEmail: string;
  planName: string;
  totalAmount: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  expiresAt: Date;
}

export class WhatsAppService {
  private static readonly WHATSAPP_BUSINESS_NUMBER = '+573001234567'; // Número de WhatsApp del negocio
  private static readonly WHATSAPP_BASE_URL = 'https://wa.me';

  /**
   * Genera los datos del mensaje de WhatsApp para una factura
   */
  static generateInvoiceWhatsAppData(
    invoice: IInvoice,
    profile: IProfile,
    user: IUser
  ): InvoiceWhatsAppData {
    // Generando datos para WhatsApp
    
    const whatsappData = {
      invoiceId: (invoice._id as Types.ObjectId).toString(),
      profileName: profile.name,
      userName: user.name,
      userEmail: user.email,
      planName: invoice.items[0]?.name || 'Plan no especificado',
      totalAmount: invoice.totalAmount,
      items: invoice.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      expiresAt: invoice.expiresAt
    };
    
    // Datos de WhatsApp generados
    
    return whatsappData;
  }

  /**
   * Genera el mensaje de WhatsApp para realizar una compra
   */
  static generatePurchaseMessage(data: InvoiceWhatsAppData): string {
    const itemsText = data.items
      .map(item => `• ${item.name} - $${item.price.toLocaleString()} x${item.quantity}`)
      .join('\n');

    const expirationDate = new Date(data.expiresAt).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `🛒 *Quiero hacer una compra*\n\n` +
           `📋 *Detalles de la compra:*\n` +
           `• ID Factura: ${data.invoiceId}\n` +
           `• Perfil: ${data.profileName}\n` +
           `• Cliente: ${data.userName}\n` +
           `• Email: ${data.userEmail}\n\n` +
           `💰 *Productos/Servicios:*\n${itemsText}\n\n` +
           `💵 *Total a pagar: $${data.totalAmount.toLocaleString()}*\n\n` +
           `⏰ *Vence el:* ${expirationDate}\n\n` +
           `Por favor, confirma el pago para activar mi perfil. ¡Gracias! 😊`;
  }

  /**
   * Genera la URL completa de WhatsApp con el mensaje
   */
  static generateWhatsAppURL(message: string, phoneNumber?: string): string {
    const targetNumber = phoneNumber || this.WHATSAPP_BUSINESS_NUMBER;
    const encodedMessage = encodeURIComponent(message);
    return `${this.WHATSAPP_BASE_URL}/${targetNumber}?text=${encodedMessage}`;
  }

  /**
   * Genera todos los datos necesarios para WhatsApp (mensaje y URL)
   */
  static generateWhatsAppMessageData(
    invoice: IInvoice,
    profile: IProfile,
    user: IUser,
    phoneNumber?: string
  ): WhatsAppMessageData {
    // Generando mensaje completo de WhatsApp
    
    const invoiceData = this.generateInvoiceWhatsAppData(invoice, profile, user);
    // Generando mensaje de compra
    const message = this.generatePurchaseMessage(invoiceData);
    // Generando URL de WhatsApp
    const url = this.generateWhatsAppURL(message, phoneNumber);

    const result = {
      message,
      phoneNumber: phoneNumber || this.WHATSAPP_BUSINESS_NUMBER,
      url
    };
    
    // Mensaje de WhatsApp completo generado

    return result;
  }

  /**
   * Genera un mensaje simple para recordatorio de pago
   */
  static generatePaymentReminderMessage(
    profileName: string,
    invoiceId: string,
    totalAmount: number,
    expiresAt: Date
  ): string {
    const expirationDate = new Date(expiresAt).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `⏰ *Recordatorio de pago pendiente*\n\n` +
           `Hola! Tienes una factura pendiente para el perfil "${profileName}"\n\n` +
           `• ID Factura: ${invoiceId}\n` +
           `• Monto: $${totalAmount.toLocaleString()}\n` +
           `• Vence: ${expirationDate}\n\n` +
           `¿Te gustaría proceder con el pago? 💳`;
  }

  /**
   * Valida si un número de teléfono tiene formato válido para WhatsApp
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Formato básico: debe empezar con + y tener entre 10-15 dígitos
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}

export default WhatsAppService;