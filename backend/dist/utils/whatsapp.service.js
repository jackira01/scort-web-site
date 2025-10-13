"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
class WhatsAppService {
    static generateInvoiceWhatsAppData(invoice, profile, user) {
        const whatsappData = {
            invoiceId: invoice._id.toString(),
            profileName: profile.name,
            userName: user.name,
            userEmail: user.email,
            planName: invoice.items[0]?.name || 'Plan no especificado',
            totalAmount: invoice.totalAmount,
            items: invoice.items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                type: item.type,
                code: item.code,
                days: item.days
            })),
            expiresAt: invoice.expiresAt
        };
        return whatsappData;
    }
    static generatePurchaseMessage(data) {
        const itemsText = data.items
            .map(item => `• ${item.name} - $${item.price.toLocaleString()} x${item.quantity}`)
            .join('\n');
        const planItem = data.items.find(item => item.type === 'plan');
        let planInfo = '';
        if (planItem && planItem.days) {
            planInfo = `\n• Plan: ${planItem.code} (${planItem.days} días)`;
        }
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
            `• Email: ${data.userEmail}${planInfo}\n\n` +
            `💰 *Productos/Servicios:*\n${itemsText}\n\n` +
            `💵 *Total a pagar: $${data.totalAmount.toLocaleString()}*\n\n` +
            `⏰ *Vence el:* ${expirationDate}\n\n` +
            `Por favor, confirma el pago para activar mi perfil. ¡Gracias! 😊`;
    }
    static generateWhatsAppURL(message, phoneNumber) {
        const targetNumber = phoneNumber || this.WHATSAPP_BUSINESS_NUMBER;
        const encodedMessage = encodeURIComponent(message);
        return `${this.WHATSAPP_BASE_URL}/${targetNumber}?text=${encodedMessage}`;
    }
    static generateWhatsAppMessageData(invoice, profile, user, phoneNumber) {
        const invoiceData = this.generateInvoiceWhatsAppData(invoice, profile, user);
        const message = this.generatePurchaseMessage(invoiceData);
        const url = this.generateWhatsAppURL(message, phoneNumber);
        const result = {
            message,
            phoneNumber: phoneNumber || this.WHATSAPP_BUSINESS_NUMBER,
            url
        };
        return result;
    }
    static generatePaymentReminderMessage(profileName, invoiceId, totalAmount, expiresAt) {
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
    static isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\+[1-9]\d{9,14}$/;
        return phoneRegex.test(phoneNumber);
    }
}
exports.WhatsAppService = WhatsAppService;
WhatsAppService.WHATSAPP_BUSINESS_NUMBER = '+573001234567';
WhatsAppService.WHATSAPP_BASE_URL = 'https://wa.me';
exports.default = WhatsAppService;
