"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = __importDefault(require("../modules/user/User.model"));
const mongoose_1 = require("mongoose");
const email_service_1 = __importDefault(require("./email.service"));
const config_parameter_service_1 = require("../modules/config-parameter/config-parameter.service");
class AgencyConversionService {
    async requestAgencyConversion(userId, conversionData) {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        if (user.accountType !== 'common') {
            throw new Error('Solo los usuarios comunes pueden solicitar conversión a agencia');
        }
        if (user.agencyInfo?.conversionStatus === 'pending') {
            throw new Error('Ya tienes una solicitud de conversión pendiente');
        }
        user.agencyInfo = {
            businessName: conversionData.businessName,
            businessDocument: conversionData.businessDocument,
            conversionRequestedAt: new Date(),
            conversionStatus: 'pending',
            reason: conversionData.reason
        };
        await user.save();
        try {
            await this.sendConversionNotificationEmail(user, conversionData);
        }
        catch (emailError) {
            console.error('Error enviando notificación por correo:', emailError);
        }
        return user;
    }
    async processAgencyConversion(userId, approval) {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        if (!user.agencyInfo || user.agencyInfo.conversionStatus !== 'pending') {
            throw new Error('No hay solicitud de conversión pendiente para este usuario');
        }
        if (approval.approved) {
            user.accountType = 'agency';
            user.agencyInfo.conversionStatus = 'approved';
            user.agencyInfo.conversionApprovedAt = new Date();
            user.agencyInfo.conversionApprovedBy = new mongoose_1.Types.ObjectId(approval.approvedBy);
        }
        else {
            user.agencyInfo.conversionStatus = 'rejected';
            user.agencyInfo.rejectionReason = approval.rejectionReason;
        }
        await user.save();
        return user;
    }
    async getPendingConversions() {
        return User_model_1.default.find({
            'agencyInfo.conversionStatus': 'pending'
        }).select('name email agencyInfo createdAt');
    }
    async getConversionHistory(limit = 50) {
        return User_model_1.default.find({
            'agencyInfo.conversionStatus': { $in: ['approved', 'rejected'] }
        })
            .select('name email agencyInfo accountType createdAt')
            .sort({ 'agencyInfo.conversionApprovedAt': -1 })
            .limit(limit);
    }
    async canCreateAdditionalProfile(userId) {
        const user = await User_model_1.default.findById(userId).populate('profiles');
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        if (user.accountType === 'common') {
            return {
                canCreate: true,
                requiresVerification: false
            };
        }
        if (user.accountType === 'agency') {
            return {
                canCreate: true,
                requiresVerification: true,
                reason: 'Como agencia, cada perfil requiere verificación independiente de documentos'
            };
        }
        return {
            canCreate: false,
            requiresVerification: false,
            reason: 'Tipo de cuenta no válido'
        };
    }
    async getConversionStats() {
        const [pending, approved, rejected, totalAgencies] = await Promise.all([
            User_model_1.default.countDocuments({ 'agencyInfo.conversionStatus': 'pending' }),
            User_model_1.default.countDocuments({ 'agencyInfo.conversionStatus': 'approved' }),
            User_model_1.default.countDocuments({ 'agencyInfo.conversionStatus': 'rejected' }),
            User_model_1.default.countDocuments({ accountType: 'agency' })
        ]);
        return {
            pending,
            approved,
            rejected,
            totalAgencies
        };
    }
    async sendConversionNotificationEmail(user, conversionData) {
        const emailService = new email_service_1.default();
        const companyEmail = await config_parameter_service_1.ConfigParameterService.getValue('company.email');
        const companyName = await config_parameter_service_1.ConfigParameterService.getValue('company.name') || 'Soporte';
        if (!companyEmail) {
            throw new Error('Email de la empresa no configurado');
        }
        const emailContent = {
            subject: `Nueva solicitud de conversión a agencia - ${user.name}`,
            textPart: `
Nueva solicitud de conversión a cuenta de agencia:

Usuario: ${user.name}
Email: ${user.email}
Empresa: ${conversionData.businessName}
Documento: ${conversionData.businessDocument}
Razón: ${conversionData.reason || 'No especificada'}
Fecha: ${new Date().toLocaleString('es-ES')}

Por favor, revisa esta solicitud en el panel de administración.
      `,
            htmlPart: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              🏢 Nueva Solicitud de Conversión a Agencia
            </h2>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #555; margin-bottom: 15px;">Información del Usuario:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Nombre:</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Email:</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.email}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Empresa:</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${conversionData.businessName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Documento:</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${conversionData.businessDocument}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Razón:</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${conversionData.reason || 'No especificada'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Fecha:</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleString('es-ES')}</td>
                </tr>
              </table>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
              <p style="margin: 0; color: #1565c0; font-weight: bold;">📋 Acción Requerida:</p>
              <p style="margin: 10px 0 0 0; color: #333;">Por favor, revisa esta solicitud en el panel de administración para aprobar o rechazar la conversión.</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">Este correo fue generado automáticamente por el sistema de ${companyName}.</p>
          </div>
        </div>
      `
        };
        await emailService.sendSingleEmail({
            to: { email: companyEmail, name: companyName },
            content: emailContent
        });
    }
}
exports.default = new AgencyConversionService();
