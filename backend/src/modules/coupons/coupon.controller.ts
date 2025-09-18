import type { Response } from 'express';
import type { AuthRequest } from '../../types/auth.types';
import { couponService } from './coupon.service';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import type { CreateCouponInput, UpdateCouponInput, CouponQuery } from './coupon.types';

export class CouponController {
  /**
   * Validar cupón para frontend (Público)
   */
  async validateCouponForFrontend(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      
      const validation = await couponService.validateCoupon(code);
      
      if (!validation.isValid) {
        res.status(200).json({
          success: false,
          message: 'Cupón no disponible',
          error: validation.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cupón válido',
        data: {
          code: validation.coupon?.code,
          name: validation.coupon?.name,
          description: validation.coupon?.description,
          type: validation.coupon?.type,
          value: validation.coupon?.value,
          planCode: validation.coupon?.planCode,
          applicablePlans: validation.coupon?.applicablePlans,
          validUntil: validation.coupon?.validUntil,
          remainingUses: validation.coupon?.maxUses === -1 ? -1 : 
            Math.max(0, (validation.coupon?.maxUses || 0) - (validation.coupon?.currentUses || 0))
        }
      });
    } catch (error) {
      logger.error('Error en validateCouponForFrontend:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Crear nuevo cupón (Admin) - Con logging detallado
   */
  async createCoupon(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando createCoupon controller...', {
        body: { ...req.body, code: req.body.code || 'NO_CODE' },
        user: req.user ? { id: req.user.id, role: req.user.role } : 'NO_USER'
      });

      const couponData = req.body;
      const user = req.user;
      
      if (!user || !user.id) {
        throw new AppError('Usuario no autenticado', 401);
      }

      logger.info('Datos procesados para crear cupón:', { 
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        userId: user.id
      });

      // Implementar timeout personalizado
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new AppError('Timeout en createCoupon - Operación cancelada', 408)), 12000);
      });

      const operationPromise = couponService.createCoupon(couponData, user.id);
      
      logger.info('Ejecutando Promise.race para createCoupon...');
      const coupon = await Promise.race([operationPromise, timeoutPromise]) as any;
      
      const duration = Date.now() - startTime;
      logger.info(`createCoupon completado en ${duration}ms - Cupón creado: ${coupon?.code || 'N/A'}`);

      res.status(201).json({
        success: true,
        message: 'Cupón creado exitosamente',
        data: coupon,
        metadata: {
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Error en createCoupon después de ${duration}ms:`, error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          metadata: {
            duration,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          metadata: {
            duration,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
     * Obtener cupón por ID
     */
    async getCouponById(req: AuthRequest, res: Response): Promise<void> {
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
   * Obtener lista de cupones con filtros (Admin) - Con logging detallado
   */
  async getCoupons(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando getCoupons controller...', {
        query: req.query,
        headers: {
          authorization: req.headers.authorization ? 'Bearer [PRESENTE]' : 'NO PRESENTE',
          'x-user-id': req.headers['x-user-id'] || 'NO PRESENTE'
        }
      });

      // Validar y sanitizar parámetros
      const query: CouponQuery = {
        code: req.query.code as string,
        type: req.query.type as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        validOnly: req.query.validOnly === 'true',
        page: Math.max(1, parseInt(req.query.page as string) || 1),
        limit: Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 20))
      };

      logger.info('Query procesada:', query);

      // Implementar timeout personalizado más corto para debugging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new AppError('Timeout en getCoupons - Operación cancelada', 408)), 8000);
      });

      const operationPromise = couponService.getCoupons(query);
      
      logger.info('Ejecutando Promise.race...');
      const result = await Promise.race([operationPromise, timeoutPromise]) as { coupons: any[]; total: number };
      
      const duration = Date.now() - startTime;
      logger.info(`getCoupons completado en ${duration}ms - ${result.coupons.length} cupones obtenidos`);

      res.json({
        success: true,
        data: result.coupons,
        pagination: {
          page: query.page,
          limit: query.limit || 20,
          total: result.total,
          pages: Math.ceil(result.total / (query.limit || 20))
        },
        metadata: {
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Error en getCoupons después de ${duration}ms:`, error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          metadata: {
            duration,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          metadata: {
            duration,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
     * Actualizar cupón (Admin)
     */
    async updateCoupon(req: AuthRequest, res: Response): Promise<void> {
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
    async deleteCoupon(req: AuthRequest, res: Response): Promise<void> {
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
  async validateCoupon(req: AuthRequest, res: Response): Promise<void> {
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
  async applyCoupon(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    
    console.log('🎯 [COUPON CONTROLLER] Iniciando aplicación de cupón:', {
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'origin': req.headers.origin
      },
      timestamp: new Date().toISOString()
    });

    try {
      const { code, originalPrice, planCode, variantDays } = req.body;
      
      console.log('📝 [COUPON CONTROLLER] Validando parámetros de entrada:', {
        code: code || 'NO_CODE',
        originalPrice,
        originalPriceType: typeof originalPrice,
        planCode: planCode || 'NO_PLAN',
        variantDays: variantDays || 'NO_VARIANT',
        isValidPrice: typeof originalPrice === 'number' && originalPrice >= 0
      });
      
      if (!code || typeof originalPrice !== 'number' || originalPrice < 0) {
        console.log('❌ [COUPON CONTROLLER] Parámetros inválidos');
        res.status(400).json({
          success: false,
          message: 'Código de cupón y precio original son requeridos'
        });
        return;
      }

      console.log('🔄 [COUPON CONTROLLER] Llamando al servicio de cupones...');
      const result = await couponService.applyCoupon(code, originalPrice, planCode, variantDays);
      
      console.log('📊 [COUPON CONTROLLER] Resultado del servicio:', {
        success: result.success,
        originalPrice: result.originalPrice,
        finalPrice: result.finalPrice,
        discount: result.discount,
        planCode: result.planCode,
        error: result.error
      });
      
      if (!result.success) {
        console.log('⚠️ [COUPON CONTROLLER] Aplicación de cupón falló:', result.error);
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
      }

      const responseData = {
        originalPrice: result.originalPrice,
        finalPrice: result.finalPrice,
        discount: result.discount,
        discountPercentage: result.originalPrice > 0 ? Math.round((result.discount / result.originalPrice) * 100) : 0,
        planCode: result.planCode
      };

      const duration = Date.now() - startTime;
      console.log('✅ [COUPON CONTROLLER] Aplicación exitosa:', {
        responseData,
        duration: `${duration}ms`,
        savings: result.originalPrice - result.finalPrice
      });

      res.json({
        success: true,
        message: 'Cupón aplicado exitosamente',
        data: responseData
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('💥 [COUPON CONTROLLER] Error en aplicación de cupón:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
        body: req.body
      });
      
      logger.error('Error en applyCoupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas de cupones (Admin) - Con logging detallado
   */
  async getCouponStats(req: AuthRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    logger.info('Iniciando getCouponStats controller...');
    
    try {
      // Implementar timeout personalizado
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new AppError('Timeout en getCouponStats - Operación cancelada', 408)), 8000);
      });

      const operationPromise = couponService.getCouponStats();
      
      const stats = await Promise.race([operationPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      logger.info(`getCouponStats controller completado en ${duration}ms`);
      
      res.json({
        success: true,
        data: stats,
        metadata: {
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Error en getCouponStats controller después de ${duration}ms:`, error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          metadata: {
            duration,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          metadata: {
            duration,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }
}

export const couponController = new CouponController();
export default couponController;