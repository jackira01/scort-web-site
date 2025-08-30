import { IUser } from '../modules/user/User.model';
import User from '../modules/user/User.model';
import { Types } from 'mongoose';

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
}

export default new AgencyConversionService();