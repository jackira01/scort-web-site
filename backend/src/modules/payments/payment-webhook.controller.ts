import type { Request, Response } from 'express';
import InvoiceModel from './invoice.model';
import PaymentProcessorService from './payment-processor.service';

/**
 * Controlador para manejar webhooks y confirmaciones de pago
 */
export class PaymentWebhookController {

  /**
   * Procesa la confirmación de pago de una factura
   * Este endpoint puede ser llamado por sistemas de pago externos o internamente
   */
  static async confirmPayment(req: Request, res: Response) {
    try {
      const { invoiceId, paymentData } = req.body;

      if (!invoiceId) {
        return res.status(400).json({
          error: 'invoiceId es requerido'
        });
      }

      // Webhook de pago recibido

      // Verificar que la factura existe
      const invoice = await InvoiceModel.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          error: 'Factura no encontrada'
        });
      }

      // Verificar que la factura esté pendiente
      if (invoice.status !== 'pending') {
        return res.status(400).json({
          error: `La factura ya está en estado: ${invoice.status}`
        });
      }

      // Marcar factura como pagada
      invoice.status = 'paid';
      invoice.paidAt = new Date();

      // Agregar datos de pago si se proporcionan
      if (paymentData) {
        invoice.paymentData = paymentData;
      }

      await invoice.save();

      // Factura marcada como pagada

      // Procesar el pago y actualizar el perfil
      const result = await PaymentProcessorService.processInvoicePayment(invoiceId);

      if (!result.success) {
        // Error procesando pago
        return res.status(500).json({
          error: 'Error procesando el pago',
          details: result.message
        });
      }

      // Pago procesado exitosamente

      return res.status(200).json({
        success: true,
        message: 'Pago confirmado y procesado exitosamente',
        invoice: {
          id: invoice._id,
          status: invoice.status,
          paidAt: invoice.paidAt
        },
        profile: {
          id: result.profile?._id,
          isActive: result.profile?.isActive,
          planAssignment: result.profile?.planAssignment
        }
      });

    } catch (error) {
      // Error en webhook de pago
      return res.status(500).json({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Cancela o marca como fallida una factura
   */
  static async cancelPayment(req: Request, res: Response) {
    try {
      const { invoiceId, reason } = req.body;

      if (!invoiceId) {
        return res.status(400).json({
          error: 'invoiceId es requerido'
        });
      }

      // Cancelación de pago recibida

      // Verificar que la factura existe
      const invoice = await InvoiceModel.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          error: 'Factura no encontrada'
        });
      }

      // Verificar que la factura esté pendiente
      if (invoice.status !== 'pending') {
        return res.status(400).json({
          error: `La factura ya está en estado: ${invoice.status}`
        });
      }

      // Marcar factura como cancelada
      invoice.status = 'cancelled';
      invoice.cancelledAt = new Date();

      if (reason) {
        invoice.cancellationReason = reason;
      }

      await invoice.save();

      // Factura marcada como cancelada

      // Procesar la cancelación
      const result = await PaymentProcessorService.processInvoiceCancellation(invoiceId);

      if (!result.success) {
        // Error procesando cancelación
        return res.status(500).json({
          error: 'Error procesando la cancelación',
          details: result.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pago cancelado exitosamente',
        invoice: {
          id: invoice._id,
          status: invoice.status,
          cancelledAt: invoice.cancelledAt,
          reason: reason
        }
      });

    } catch (error) {
      // Error en cancelación de pago
      return res.status(500).json({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene el estado de una factura
   */
  static async getInvoiceStatus(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;

      const invoice = await InvoiceModel.findById(invoiceId)
        .populate('profileId', 'name isActive planAssignment')
        .populate('userId', 'email');

      if (!invoice) {
        return res.status(404).json({
          error: 'Factura no encontrada'
        });
      }

      return res.status(200).json({
        invoice: {
          id: invoice._id,
          status: invoice.status,
          totalAmount: invoice.totalAmount,
          createdAt: invoice.createdAt,
          expiresAt: invoice.expiresAt,
          paidAt: invoice.paidAt,
          cancelledAt: invoice.cancelledAt,
          items: invoice.items,
          profile: invoice.profileId,
          user: invoice.userId
        }
      });

    } catch (error) {
      // Error obteniendo estado de factura
      return res.status(500).json({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default PaymentWebhookController;