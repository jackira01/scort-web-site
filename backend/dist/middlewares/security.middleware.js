"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.preventTimingAttacks = exports.securityLogger = exports.sanitizeHeaders = exports.validateContentType = exports.publicApiRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.helmetConfig = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
exports.helmetConfig = (0, helmet_1.default)({
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
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path === '/ping' || req.path === '/health';
    }
});
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skip: (req) => {
        const nextAuthRoutes = ['/session', '/providers', '/csrf', '/callback', '/signin', '/signout'];
        const isNextAuthRoute = nextAuthRoutes.some(route => req.path.includes(route));
        return isNextAuthRoute;
    }
});
exports.publicApiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 30 : 100,
    message: {
        error: 'Límite de solicitudes excedido para API pública.',
        retryAfter: '1 minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});
const validateContentType = (req, res, next) => {
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
exports.validateContentType = validateContentType;
const sanitizeHeaders = (req, res, next) => {
    delete req.headers['x-forwarded-host'];
    delete req.headers['x-forwarded-server'];
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length > 500) {
        return res.status(400).json({
            error: 'User-Agent inválido'
        });
    }
    next();
};
exports.sanitizeHeaders = sanitizeHeaders;
const securityLogger = (req, res, next) => {
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
        if (res.statusCode >= 400 || duration > 5000) {
            logger_1.logger.warn('Suspicious request detected', logData);
        }
    });
    next();
};
exports.securityLogger = securityLogger;
const preventTimingAttacks = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        const delay = Math.random() * 50;
        setTimeout(() => {
            originalSend.call(this, body);
        }, delay);
        return this;
    };
    next();
};
exports.preventTimingAttacks = preventTimingAttacks;
exports.securityMiddleware = [
    exports.helmetConfig,
    exports.sanitizeHeaders,
    exports.validateContentType,
    exports.securityLogger,
    ...(process.env.NODE_ENV === 'production' ? [exports.preventTimingAttacks] : [])
];
