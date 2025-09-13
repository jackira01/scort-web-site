import { IUser } from '../modules/user/User.model';
import User from '../modules/user/User.model';
import { Types } from 'mongoose';
import EmailService from './email.service';
import { ConfigParameterService } from '../modules/config-parameter/config-parameter.service';

export interface AgencyConversionRequest {
  businessName: string;
  businessDocument: string;
  reason?: string;
}

export interface AgencyConversionApproval {
  userId: string;
  approvedBy: string;
  approved: boolean;
  rejectionReason?: string;
}

class AgencyConversionService {
  /**
   * Solicitar conversión a cuenta de agencia
   */
  async requestAgencyConversion(
    userId: string,
    conversionData: AgencyConversionRequest
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el usuario sea común
    if (user.accountType !== 'common') {
      throw new Error('Solo los usuarios comunes pueden solicitar conversión a agencia');
    }

    // Verificar que no tenga una solicitud pendiente
    if (user.agencyInfo?.conversionStatus === 'pending') {
      throw new Error('Ya tienes una solicitud de conversión pendiente');
    }

    // Actualizar información de agencia
    user.agencyInfo = {
      businessName: conversionData.businessName,
      businessDocument: conversionData.businessDocument,
      conversionRequestedAt: new Date(),
      conversionStatus: 'pending',
      reason: conversionData.reason
    };

    await user.save();

    // Enviar notificación por correo a la empresa
    try {
      await this.sendConversionNotificationEmail(user, conversionData);
    } catch (emailError) {
      console.error('Error enviando notificación por correo:', emailError);
      // No fallar la operación si el correo falla
    }

    return user;
  }

  /**
   * Aprobar o rechazar conversión a agencia (solo administradores)
   */
  async processAgencyConversion(
    userId: string,
    approval: AgencyConversionApproval
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.agencyInfo || user.agencyInfo.conversionStatus !== 'pending') {
      throw new Error('No hay solicitud de conversión pendiente para este usuario');
    }

    if (approval.approved) {
      // Aprobar conversión
      user.accountType = 'agency';
      user.agencyInfo.conversionStatus = 'approved';
      user.agencyInfo.conversionApprovedAt = new Date();
      user.agencyInfo.conversionApprovedBy = new Types.ObjectId(approval.approvedBy);
    } else {
      // Rechazar conversión
      user.agencyInfo.conversionStatus = 'rejected';
      user.agencyInfo.rejectionReason = approval.rejectionReason;
    }

    await user.save();
    return user;
  }

  /**
   * Obtener todas las solicitudes de conversión pendientes
   */
  async getPendingConversions(): Promise<IUser[]> {
    return User.find({
      'agencyInfo.conversionStatus': 'pending'
    }).select('name email agencyInfo createdAt');
  }

  /**
   * Obtener historial de conversiones
   */
  async getConversionHistory(limit: number = 50): Promise<IUser[]> {
    return User.find({
      'agencyInfo.conversionStatus': { $in: ['approved', 'rejected'] }
    })
      .select('name email agencyInfo accountType createdAt')
      .sort({ 'agencyInfo.conversionApprovedAt': -1 })
      .limit(limit);
  }

  /**
   * Verificar si un usuario puede crear perfiles adicionales
   */
  async canCreateAdditionalProfile(userId: string): Promise<{
    canCreate: boolean;
    requiresVerification: boolean;
    reason?: string;
  }> {
    const user = await User.findById(userId).populate('profiles');
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Para usuarios comunes: pueden crear perfiles sin verificación adicional
    if (user.accountType === 'common') {
      return {
        canCreate: true,
        requiresVerification: false
      };
    }

    // Para agencias: cada perfil requiere verificación independiente
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

  /**
   * Obtener estadísticas de conversiones
   */
  async getConversionStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    totalAgencies: number;
  }> {
    const [pending, approved, rejected, totalAgencies] = await Promise.all([
      User.countDocuments({ 'agencyInfo.conversionStatus': 'pending' }),
      User.countDocuments({ 'agencyInfo.conversionStatus': 'approved' }),
      User.countDocuments({ 'agencyInfo.conversionStatus': 'rejected' }),
      User.countDocuments({ accountType: 'agency' })
    ]);

    return {
      pending,
      approved,
      rejected,
      totalAgencies
    };
  }

  /**
   * Enviar notificación por correo sobre solicitud de conversión
   */
  private async sendConversionNotificationEmail(
    user: IUser,
    conversionData: AgencyConversionRequest
  ): Promise<void> {
    const emailService = new EmailService();
    const companyEmail = await ConfigParameterService.getValue('company.email');
    const companyName = await ConfigParameterService.getValue('company.name') || 'Soporte';

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

export default new AgencyConversionService();