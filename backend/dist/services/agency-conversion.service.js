"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = __importDefault(require("../modules/user/User.model"));
const mongoose_1 = require("mongoose");
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
}
exports.default = new AgencyConversionService();
