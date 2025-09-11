import { Request, Response } from 'express';
import agencyConversionService, { AgencyConversionRequest, AgencyConversionApproval } from '../services/agency-conversion.service';
import { AuthRequest } from '../types/auth.types';

class AgencyConversionController {
  /**
   * Solicitar conversión a cuenta de agencia
   */
  async requestConversion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const conversionData: AgencyConversionRequest = {
        businessName: req.body.businessName,
        businessDocument: req.body.businessDocument,
        reason: req.body.reason
      };

      // Validar datos requeridos
      if (!conversionData.businessName || !conversionData.businessDocument) {
        res.status(400).json({ 
          error: 'Nombre del negocio y documento son requeridos' 
        });
        return;
      }

      const updatedUser = await agencyConversionService.requestAgencyConversion(
        userId,
        conversionData
      );

      res.status(200).json({
        message: 'Solicitud de conversión enviada exitosamente',
        user: {
          id: (updatedUser as any)._id,
          accountType: updatedUser.accountType,
          agencyInfo: updatedUser.agencyInfo
        }
      });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  }

  /**
   * Aprobar o rechazar conversión (solo administradores)
   */
  async processConversion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Verificar que el usuario sea administrador
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden procesar conversiones' });
        return;
      }

      const { userId } = req.params;
      const approval: AgencyConversionApproval = {
        userId,
        approvedBy: adminId,
        approved: req.body.approved,
        rejectionReason: req.body.rejectionReason
      };

      // Validar datos
      if (typeof approval.approved !== 'boolean') {
        res.status(400).json({ error: 'El campo "approved" es requerido y debe ser booleano' });
        return;
      }

      if (!approval.approved && !approval.rejectionReason) {
        res.status(400).json({ error: 'Razón de rechazo es requerida cuando se rechaza la solicitud' });
        return;
      }

      const updatedUser = await agencyConversionService.processAgencyConversion(
        userId,
        approval
      );

      res.status(200).json({
        message: approval.approved ? 'Conversión aprobada exitosamente' : 'Conversión rechazada',
        user: {
          id: (updatedUser as any)._id,
          accountType: updatedUser.accountType,
          agencyInfo: updatedUser.agencyInfo
        }
      });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  }

  /**
   * Obtener solicitudes pendientes (solo administradores)
   */
  async getPendingConversions(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden ver solicitudes pendientes' });
        return;
      }

      const pendingConversions = await agencyConversionService.getPendingConversions();

      res.status(200).json({
        conversions: pendingConversions,
        count: pendingConversions.length
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  }

  /**
   * Obtener historial de conversiones (solo administradores)
   */
  async getConversionHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden ver el historial' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await agencyConversionService.getConversionHistory(limit);

      res.status(200).json({
        history,
        count: history.length
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  }

  /**
   * Verificar si puede crear perfil adicional
   */
  async checkProfileCreation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const result = await agencyConversionService.canCreateAdditionalProfile(userId);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  }

  /**
   * Obtener estadísticas de conversiones (solo administradores)
   */
  async getConversionStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Verificar que el usuario sea administrador
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden ver estadísticas' });
        return;
      }

      const stats = await agencyConversionService.getConversionStats();

      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      });
    }
  }
}

export default new AgencyConversionController();