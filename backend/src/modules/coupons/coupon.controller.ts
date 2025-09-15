import { Request, Response } from 'express';
import { couponService } from './coupon.service';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import type { CreateCouponInput, UpdateCouponInput, CouponQuery } from './coupon.types';

export class CouponController {
  /**
   * Crear nuevo cupón (Admin)
   */
  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateCouponInput = req.body;
      const createdBy = (req as any).user?.id;

      if (!createdBy) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const coupon = await couponService.createCoupon(input, createdBy);
      
      res.status(201).json({
        success: true,
        message: 'Cupón creado exitosamente',
        data: coupon
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        logger.error('Error en createCoupon:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Obtener cupón por ID (Admin)
   */
  async getCouponById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id);
      
      if (!coupon) {
        res.status(404).json({
          success: false,
          message: 'Cupón no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: coupon
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        logger.error('Error en getCouponById:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Obtener lista de cupones con filtros (Admin)
   */
  async getCoupons(req: Request, res: Response): Promise<void> {
    try {
      const query: CouponQuery = {
        code: req.query.code as string,
        type: req.query.type as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        validOnly: req.query.validOnly === 'true',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await couponService.getCoupons(query);
      
      res.json({
        success: true,
        data: result.coupons,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
          pages: Math.ceil(result.total / (query.limit || 20))
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        logger.error('Error en getCoupons:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Actualizar cupón (Admin)
   */
  async updateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input: UpdateCouponInput = req.body;
      
      const coupon = await couponService.updateCoupon(id, input);
      
      if (!coupon) {
        res.status(404).json({
          success: false,
          message: 'Cupón no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cupón actualizado exitosamente',
        data: coupon
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        logger.error('Error en updateCoupon:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Eliminar cupón (Admin)
   */
  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await couponService.deleteCoupon(id);
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Cupón no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cupón eliminado exitosamente'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        logger.error('Error en deleteCoupon:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }

  /**
   * Validar cupón por código (Público)
   */
  async validateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { planCode } = req.query;
      
      const validation = await couponService.validateCoupon(code, planCode as string);
      
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: validation.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cupón válido',
        data: {
          code: validation.coupon?.code,
          name: validation.coupon?.name,
          type: validation.coupon?.type,
          value: validation.coupon?.value,
          planCode: validation.coupon?.planCode
        }
      });
    } catch (error) {
      logger.error('Error en validateCoupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Aplicar cupón y calcular descuento (Público)
   */
  async applyCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { code, originalPrice, planCode } = req.body;
      
      if (!code || typeof originalPrice !== 'number' || originalPrice < 0) {
        res.status(400).json({
          success: false,
          message: 'Código de cupón y precio original son requeridos'
        });
        return;
      }

      const result = await couponService.applyCoupon(code, originalPrice, planCode);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cupón aplicado exitosamente',
        data: {
          originalPrice: result.originalPrice,
          finalPrice: result.finalPrice,
          discount: result.discount,
          discountPercentage: result.originalPrice > 0 ? Math.round((result.discount / result.originalPrice) * 100) : 0,
          planCode: result.planCode
        }
      });
    } catch (error) {
      logger.error('Error en applyCoupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de cupones (Admin)
   */
  async getCouponStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await couponService.getCouponStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        logger.error('Error en getCouponStats:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    }
  }
}

export const couponController = new CouponController();
export default couponController;