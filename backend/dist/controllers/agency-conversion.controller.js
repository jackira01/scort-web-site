"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agency_conversion_service_1 = __importDefault(require("../services/agency-conversion.service"));
class AgencyConversionController {
    async requestConversion(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const conversionData = {
                businessName: req.body.businessName,
                businessDocument: req.body.businessDocument,
                reason: req.body.reason
            };
            if (!conversionData.businessName || !conversionData.businessDocument) {
                res.status(400).json({
                    error: 'Nombre del negocio y documento son requeridos'
                });
                return;
            }
            const updatedUser = await agency_conversion_service_1.default.requestAgencyConversion(userId, conversionData);
            res.status(200).json({
                message: 'Solicitud de conversión enviada exitosamente',
                user: {
                    id: updatedUser._id,
                    accountType: updatedUser.accountType,
                    agencyInfo: updatedUser.agencyInfo
                }
            });
        }
        catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Error interno del servidor'
            });
        }
    }
    async processConversion(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            if (req.user?.role !== 'admin') {
                res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden procesar conversiones' });
                return;
            }
            const { userId } = req.params;
            const approval = {
                userId,
                approvedBy: adminId,
                approved: req.body.approved,
                rejectionReason: req.body.rejectionReason
            };
            if (typeof approval.approved !== 'boolean') {
                res.status(400).json({ error: 'El campo "approved" es requerido y debe ser booleano' });
                return;
            }
            if (!approval.approved && !approval.rejectionReason) {
                res.status(400).json({ error: 'Razón de rechazo es requerida cuando se rechaza la solicitud' });
                return;
            }
            const updatedUser = await agency_conversion_service_1.default.processAgencyConversion(userId, approval);
            res.status(200).json({
                message: approval.approved ? 'Conversión aprobada exitosamente' : 'Conversión rechazada',
                user: {
                    id: updatedUser._id,
                    accountType: updatedUser.accountType,
                    agencyInfo: updatedUser.agencyInfo
                }
            });
        }
        catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Error interno del servidor'
            });
        }
    }
    async getPendingConversions(req, res) {
        try {
            if (req.user?.role !== 'admin') {
                res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden ver solicitudes pendientes' });
                return;
            }
            const pendingConversions = await agency_conversion_service_1.default.getPendingConversions();
            res.status(200).json({
                conversions: pendingConversions,
                count: pendingConversions.length
            });
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Error interno del servidor'
            });
        }
    }
    async getConversionHistory(req, res) {
        try {
            if (req.user?.role !== 'admin') {
                res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden ver el historial' });
                return;
            }
            const limit = parseInt(req.query.limit) || 50;
            const history = await agency_conversion_service_1.default.getConversionHistory(limit);
            res.status(200).json({
                history,
                count: history.length
            });
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Error interno del servidor'
            });
        }
    }
    async checkProfileCreation(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const result = await agency_conversion_service_1.default.canCreateAdditionalProfile(userId);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Error interno del servidor'
            });
        }
    }
    async getConversionStats(req, res) {
        try {
            if (req.user?.role !== 'admin') {
                res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden ver estadísticas' });
                return;
            }
            const stats = await agency_conversion_service_1.default.getConversionStats();
            res.status(200).json(stats);
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Error interno del servidor'
            });
        }
    }
}
exports.default = new AgencyConversionController();
