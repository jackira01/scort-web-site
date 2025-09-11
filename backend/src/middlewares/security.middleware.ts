import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Configuración de Helmet para seguridad
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir recursos externos
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting general
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Límite por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Saltar rate limiting para rutas de salud
    return req.path === '/ping' || req.path === '/health';
  }
});

// Rate limiting para autenticación
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login por IP
  message: {
    error: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  skip: (req) => {
    // Excluir rutas de NextAuth que hacen llamadas automáticas
    const nextAuthRoutes = ['/session', '/providers', '/csrf', '/callback', '/signin', '/signout'];
    const isNextAuthRoute = nextAuthRoutes.some(route => req.path.includes(route));
    return isNextAuthRoute;
  }
});

// Rate limiting para APIs públicas
export const publicApiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'production' ? 30 : 100,
  message: {
    error: 'Límite de solicitudes excedido para API pública.',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware para validar Content-Type en requests POST/PUT
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type debe ser application/json'
      });
    }
  }
  
  next();
};

// Middleware para sanitizar headers
export const sanitizeHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remover headers potencialmente peligrosos
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-forwarded-server'];
  
  // Validar User-Agent
  const userAgent = req.get('User-Agent');
  if (!userAgent || userAgent.length > 500) {
    return res.status(400).json({
      error: 'User-Agent inválido'
    });
  }
  
  next();
};

// Middleware para logging de seguridad
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };
    
    // Log requests sospechosos
    if (res.statusCode >= 400 || duration > 5000) {
      logger.warn('Suspicious request detected', logData);
    }
  });
  
  next();
};

// Middleware para prevenir ataques de timing
export const preventTimingAttacks = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    // Agregar delay mínimo aleatorio para prevenir timing attacks
    const delay = Math.random() * 50; // 0-50ms
    
    setTimeout(() => {
      originalSend.call(this, body);
    }, delay);
    
    return this;
  };
  
  next();
};

// Configuración de seguridad completa
export const securityMiddleware = [
  helmetConfig,
  sanitizeHeaders,
  validateContentType,
  securityLogger,
  ...(process.env.NODE_ENV === 'production' ? [preventTimingAttacks] : [])
];