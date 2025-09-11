/**
 * Configuración de Seguridad para Producción
 * Scort Web Site - Security Configuration
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Configuración de Content Security Policy
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Para styled-components
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com"
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-eval'", // Para Next.js en desarrollo
      "https://js.stripe.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://res.cloudinary.com",
      "https://images.unsplash.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com"
    ],
    connectSrc: [
      "'self'",
      "https://api.stripe.com",
      "https://www.google-analytics.com",
      "wss:"
    ],
    frameSrc: [
      "'self'",
      "https://js.stripe.com"
    ],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

// Rate Limiting Configurations
const rateLimitConfigs = {
  // Rate limit general
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // máximo 1000 requests por IP
    message: {
      error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting para health checks
      return req.path === '/api/health' || req.path === '/health';
    }
  }),

  // Rate limit para autenticación
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos de login por IP
    message: {
      error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  }),

  // Rate limit para registro
  register: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros por IP por hora
    message: {
      error: 'Demasiados intentos de registro, intenta de nuevo en 1 hora.',
      code: 'REGISTER_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Rate limit para API
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // máximo 500 requests por IP
    message: {
      error: 'Demasiadas solicitudes a la API, intenta de nuevo más tarde.',
      code: 'API_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Rate limit para uploads
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50, // máximo 50 uploads por IP por hora
    message: {
      error: 'Demasiados uploads, intenta de nuevo más tarde.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
};

// Configuración de Helmet
const helmetConfig = {
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? cspConfig : false,
  crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad
  crossOriginOpenerPolicy: { policy: 'cross-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true
};

// Headers de seguridad adicionales
const securityHeaders = {
  // Prevenir clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevenir MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Habilitar XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'no-referrer',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()'
  ].join(', '),
  
  // Feature policy (legacy)
  'Feature-Policy': [
    "camera 'none'",
    "microphone 'none'",
    "geolocation 'none'",
    "payment 'none'",
    "usb 'none'"
  ].join('; '),
  
  // Cache control para recursos sensibles
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// Configuración de CORS
const corsConfig = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ORIGIN_ALLOWED 
      ? JSON.parse(process.env.ORIGIN_ALLOWED)
      : ['http://localhost:3000', 'http://localhost:5000'];
    
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 horas
};

// Configuración de sesiones seguras
const sessionConfig = {
  name: 'scort.sid', // Cambiar nombre por defecto
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Renovar sesión en cada request
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only en producción
    httpOnly: true, // No accesible via JavaScript
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'strict' // Protección CSRF
  },
  store: undefined // Configurar store externo (Redis, MongoDB, etc.)
};

// Middleware de validación de entrada
const inputValidation = {
  // Sanitizar strings
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remover scripts
      .replace(/<[^>]*>/g, '') // Remover HTML tags
      .trim();
  },
  
  // Validar email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validar contraseña fuerte
  isStrongPassword: (password) => {
    // Al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },
  
  // Validar ObjectId de MongoDB
  isValidObjectId: (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }
};

// Configuración de logging de seguridad
const securityLogging = {
  // Eventos a loggear
  events: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    LOGOUT: 'logout',
    PASSWORD_CHANGE: 'password_change',
    ACCOUNT_LOCKED: 'account_locked',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    DATA_BREACH_ATTEMPT: 'data_breach_attempt'
  },
  
  // Función de logging
  log: (event, userId, ip, userAgent, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: userId || 'anonymous',
      ip: ip || 'unknown',
      userAgent: userAgent || 'unknown',
      details,
      severity: getSeverity(event)
    };
    
    // En producción, enviar a servicio de logging externo
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrar con servicio de logging (ELK, Splunk, etc.)
      console.log('[SECURITY]', JSON.stringify(logEntry));
    } else {
      console.log('[SECURITY]', logEntry);
    }
  }
};

// Función auxiliar para determinar severidad
function getSeverity(event) {
  const highSeverity = [
    'data_breach_attempt',
    'account_locked',
    'suspicious_activity',
    'unauthorized_access'
  ];
  
  const mediumSeverity = [
    'login_failure',
    'rate_limit_exceeded'
  ];
  
  if (highSeverity.includes(event)) return 'HIGH';
  if (mediumSeverity.includes(event)) return 'MEDIUM';
  return 'LOW';
}

// Middleware de detección de amenazas
const threatDetection = {
  // Detectar patrones sospechosos en URLs
  detectSuspiciousUrls: (req, res, next) => {
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /<script/i, // XSS
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
      /vbscript:/i, // VBScript injection
      /onload=/i, // Event handler injection
      /onerror=/i // Event handler injection
    ];
    
    const url = req.originalUrl || req.url;
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));
    
    if (isSuspicious) {
      securityLogging.log(
        securityLogging.events.SUSPICIOUS_ACTIVITY,
        req.user?.id,
        req.ip,
        req.get('User-Agent'),
        { url, type: 'suspicious_url_pattern' }
      );
      
      return res.status(400).json({
        error: 'Solicitud no válida',
        code: 'INVALID_REQUEST'
      });
    }
    
    next();
  },
  
  // Detectar múltiples intentos fallidos
  detectBruteForce: (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();
    
    return (req, res, next) => {
      const key = `${req.ip}_${req.path}`;
      const now = Date.now();
      
      if (!attempts.has(key)) {
        attempts.set(key, []);
      }
      
      const userAttempts = attempts.get(key);
      
      // Limpiar intentos antiguos
      const recentAttempts = userAttempts.filter(time => now - time < windowMs);
      attempts.set(key, recentAttempts);
      
      if (recentAttempts.length >= maxAttempts) {
        securityLogging.log(
          securityLogging.events.SUSPICIOUS_ACTIVITY,
          req.user?.id,
          req.ip,
          req.get('User-Agent'),
          { type: 'brute_force_detected', attempts: recentAttempts.length }
        );
        
        return res.status(429).json({
          error: 'Demasiados intentos fallidos. Intenta de nuevo más tarde.',
          code: 'BRUTE_FORCE_DETECTED'
        });
      }
      
      // Registrar intento en caso de fallo
      res.on('finish', () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          recentAttempts.push(now);
          attempts.set(key, recentAttempts);
        }
      });
      
      next();
    };
  }
};

module.exports = {
  cspConfig,
  rateLimitConfigs,
  helmetConfig,
  securityHeaders,
  corsConfig,
  sessionConfig,
  inputValidation,
  securityLogging,
  threatDetection
};