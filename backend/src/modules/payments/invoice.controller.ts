import { Request, Response } from 'express';
import invoiceService, { type CreateInvoiceData, type InvoiceFilters } from './invoice.service';
import { validationResult } from 'express-validator';
import { WhatsAppService } from '../../utils/whatsapp.service';
import { IProfile } from '../profile/profile.types';
import { IUser } from '../user/User.model';

class InvoiceController {
  /**
   * Genera una nueva factura
   * POST /api/invoices
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
        return;
      }

      const invoiceData: CreateInvoiceData = {
        profileId: req.body.profileId,
        userId: req.body.userId,
        planCode: req.body.planCode,
        planDays: req.body.planDays,
        upgradeCodes: req.body.upgradeCodes || [],
        couponCode: req.body.couponCode, // Agregar el campo couponCode
        notes: req.body.notes
      };

      const invoice = await invoiceService.generateInvoice(invoiceData);

      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: invoice
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene una factura por ID
   * GET /api/invoices/:id
   */
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoiceById(id);

      if (!invoice) {
        res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error: any) {
      console.error('Error getting invoice:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene facturas con filtros y paginación
   * GET /api/invoices
   */
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const filters: InvoiceFilters = {
        profileId: req.query.profileId as string,
        userId: req.query.userId as string,
        status: req.query.status as any,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await invoiceService.getInvoices(filters, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error getting invoices:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene facturas pendientes de un usuario
   * GET /api/invoices/user/:userId/pending
   */
  async getPendingInvoicesByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const invoices = await invoiceService.getPendingInvoicesByUser(userId);

      res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error: any) {
      console.error('Error getting pending invoices:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene todas las facturas de un usuario con filtros y paginación
   * GET /api/invoices/user/:userId
   */
  async getAllInvoicesByUser(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: errors.array()
        });
        return;
      }

      const { userId } = req.params;
      const filters: InvoiceFilters = {
        userId,
        status: req.query.status as any
      };

      // Agregar filtros adicionales si están presentes
      if (req.query.invoiceId) {
        filters._id = req.query.invoiceId as string;
      }

      if (req.query.profileId) {
        filters.profileId = req.query.profileId as string;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await invoiceService.getInvoices(filters, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error getting user invoices:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Marca una factura como pagada
   * PUT /api/invoices/:id/pay
   */
  async markAsPaid(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;

      const invoice = await invoiceService.markAsPaid(id, paymentMethod);

      res.status(200).json({
        success: true,
        message: 'Factura marcada como pagada',
        data: invoice
      });
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Cancela una factura
   * PUT /api/invoices/:id/cancel
   */
  async cancelInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const invoice = await invoiceService.cancelInvoice(id, reason);

      res.status(200).json({
        success: true,
        message: 'Factura cancelada',
        data: invoice
      });
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualiza el estado de una factura (solo administradores)
   * PATCH /api/invoices/:id/status
   */
  async updateInvoiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // Validar que el estado sea válido
      const validStatuses = ['pending', 'paid', 'cancelled', 'expired'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Estado inválido. Los estados válidos son: pending, paid, cancelled, expired'
        });
        return;
      }

      const invoice = await invoiceService.updateInvoiceStatus(id, status, reason);

      res.status(200).json({
        success: true,
        message: 'Estado de factura actualizado',
        data: invoice
      });
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene estadísticas de facturas
   * GET /api/invoices/stats
   */
  async getInvoiceStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const stats = await invoiceService.getInvoiceStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error getting invoice stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Expira facturas vencidas (endpoint administrativo)
   * POST /api/invoices/expire-overdue
   */
  async expireOverdueInvoices(req: Request, res: Response): Promise<void> {
    try {
      const expiredCount = await invoiceService.expireOverdueInvoices();

      res.status(200).json({
        success: true,
        message: `${expiredCount} facturas marcadas como vencidas`,
        data: { expiredCount }
      });
    } catch (error: any) {
      console.error('Error expiring overdue invoices:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Genera datos para WhatsApp de una factura
   * GET /api/invoices/:id/whatsapp-data
   */
  async getWhatsAppData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { phoneNumber } = req.query as { phoneNumber?: string };

      const invoice = await invoiceService.getInvoiceById(id);

      if (!invoice) {
        res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
        return;
      }

      if (invoice.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Solo se pueden procesar facturas pendientes'
        });
        return;
      }

      // Validar número de teléfono si se proporciona
      if (phoneNumber && !WhatsAppService.isValidPhoneNumber(phoneNumber)) {
        res.status(400).json({
          success: false,
          message: 'Número de teléfono inválido'
        });
        return;
      }

      // Obtener datos del perfil y usuario (necesarios para el mensaje completo)
      const populatedInvoice = await invoiceService.getInvoiceById(id, true);
      if (!populatedInvoice) {
        res.status(404).json({
          success: false,
          message: 'No se pudieron obtener los datos completos de la factura'
        });
        return;
      }

      const profile = populatedInvoice.profileId as unknown as IProfile;
      const user = populatedInvoice.userId as unknown as IUser;

      // Generar datos de WhatsApp usando el servicio
      const whatsappData = WhatsAppService.generateWhatsAppMessageData(
        populatedInvoice,
        profile,
        user,
        phoneNumber
      );

      res.status(200).json({
        success: true,
        data: {
          invoiceId: invoice._id,
          message: whatsappData.message,
          whatsappUrl: whatsappData.url,
          phoneNumber: whatsappData.phoneNumber,
          totalAmount: invoice.totalAmount,
          expiresAt: invoice.expiresAt,
          items: invoice.items,
          profileName: profile.name,
          userName: user.name
        }
      });
    } catch (error: any) {
      console.error('Error generating WhatsApp data:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
}

export default new InvoiceController();