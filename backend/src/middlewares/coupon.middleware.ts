import { Request, Response, NextFunction } from 'express';
import { couponService } from '../modules/coupons/coupon.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Middleware para validar que un cupón existe y está activo
 */
export const validateCouponExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;
    
    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Código de cupón requerido'
      });
      return;
    }

    const coupon = await couponService.getCouponByCode(code);
    
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: 'Cupón no encontrado'
      });
      return;
    }

    // Agregar el cupón al request para uso posterior
    (req as any).coupon = coupon;
    next();
  } catch (error) {
    logger.error('Error en validateCouponExists:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para validar que un cupón está vigente y disponible
 */
export const validateCouponAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const coupon = (req as any).coupon;
    
    if (!coupon) {
      res.status(400).json({
        success: false,
        message: 'Cupón no encontrado en la solicitud'
      });
      return;
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    // Verificar si está activo
    if (!coupon.isActive) {
      res.status(400).json({
        success: false,
        message: 'El cupón está inactivo',
        error: 'COUPON_INACTIVE'
      });
      return;
    }

    // Verificar si ya comenzó su vigencia
    if (now < validFrom) {
      res.status(400).json({
        success: false,
        message: `El cupón será válido a partir del ${validFrom.toLocaleDateString()}`,
        error: 'COUPON_NOT_STARTED'
      });
      return;
    }

    // Verificar si no ha expirado
    if (now > validUntil) {
      res.status(400).json({
        success: false,
        message: `El cupón expiró el ${validUntil.toLocaleDateString()}`,
        error: 'COUPON_EXPIRED'
      });
      return;
    }

    // Verificar si no está agotado
    if (coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses) {
      res.status(400).json({
        success: false,
        message: 'El cupón ha alcanzado su límite de usos',
        error: 'COUPON_EXHAUSTED'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error en validateCouponAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para validar que un cupón es aplicable a un plan específico
 */
export const validateCouponPlanCompatibility = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const coupon = (req as any).coupon;
    const { planCode } = req.query;
    
    if (!coupon) {
      res.status(400).json({
        success: false,
        message: 'Cupón no encontrado en la solicitud'
      });
      return;
    }

    // Si el cupón tiene planes aplicables definidos, verificar compatibilidad
    if (planCode && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
      const planCodeUpper = (planCode as string).toUpperCase();
      
      if (!coupon.applicablePlans.includes(planCodeUpper)) {
        res.status(400).json({
          success: false,
          message: `El cupón no es aplicable al plan ${planCode}`,
          error: 'COUPON_PLAN_INCOMPATIBLE',
          details: {
            applicablePlans: coupon.applicablePlans
          }
        });
        return;
      }
    }

    next();
  } catch (error) {
    logger.error('Error en validateCouponPlanCompatibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para rate limiting específico de cupones
 * Previene ataques de fuerza bruta en códigos de cupones
 */
export const couponRateLimit = (
  maxAttempts: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    // Limpiar intentos expirados
    const clientAttempts = attempts.get(clientId);
    if (clientAttempts && now > clientAttempts.resetTime) {
      attempts.delete(clientId);
    }

    // Obtener o crear registro de intentos
    const current = attempts.get(clientId) || { count: 0, resetTime: now + windowMs };
    
    if (current.count >= maxAttempts) {
      const remainingTime = Math.ceil((current.resetTime - now) / 1000 / 60);
      res.status(429).json({
        success: false,
        message: `Demasiados intentos de validación de cupones. Intenta nuevamente en ${remainingTime} minutos.`,
        error: 'RATE_LIMIT_EXCEEDED'
      });
      return;
    }

    // Incrementar contador
    current.count++;
    attempts.set(clientId, current);

    next();
  };
};

/**
 * Middleware para logging de uso de cupones
 */
export const logCouponUsage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    try {
      const coupon = (req as any).coupon;
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (coupon && responseData.success) {
        logger.info('Cupón utilizado exitosamente', {
          couponCode: coupon.code,
          couponType: coupon.type,
          userId: (req as any).user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // No fallar si hay error en el logging
      logger.error('Error en logCouponUsage:', error);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware para validar permisos de administrador en operaciones de cupones
 */
export const requireCouponAdminPermissions = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Permisos insuficientes para gestionar cupones'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error en requireCouponAdminPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para sanitizar códigos de cupones
 */
export const sanitizeCouponCode = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Sanitizar código en parámetros
    if (req.params.code) {
      req.params.code = req.params.code.toUpperCase().trim();
    }
    
    // Sanitizar código en body
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase().trim();
    }
    
    // Sanitizar planCode si existe
    if (req.body.planCode) {
      req.body.planCode = req.body.planCode.toUpperCase().trim();
    }
    
    // Sanitizar applicablePlans si existe
    if (req.body.applicablePlans && Array.isArray(req.body.applicablePlans)) {
      req.body.applicablePlans = req.body.applicablePlans.map((plan: string) => 
        plan.toUpperCase().trim()
      );
    }
    
    next();
  } catch (error) {
    logger.error('Error en sanitizeCouponCode:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};