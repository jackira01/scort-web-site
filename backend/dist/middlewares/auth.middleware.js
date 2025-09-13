"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.devAuthMiddleware = exports.authMiddleware = void 0;
const User_model_1 = __importDefault(require("../modules/user/User.model"));
const jwt_service_1 = require("../services/jwt.service");
const authMiddleware = async (req, res, next) => {
    try {
        console.log('🔍 [AUTH DEBUG] Iniciando autenticación para:', req.method, req.originalUrl);
        const jwtService = new jwt_service_1.JWTService();
        let userId = null;
        const authHeader = req.header('Authorization');
        console.log('🔍 [AUTH DEBUG] Authorization header:', authHeader ? 'Presente' : 'Ausente');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            console.log('🔍 [AUTH DEBUG] Bearer token detectado');
            try {
                const token = jwtService.extractTokenFromHeader(authHeader);
                console.log('🔍 [AUTH DEBUG] Token extraído:', token ? 'Sí' : 'No');
                if (token) {
                    const payload = jwtService.verifyToken(token);
                    console.log('🔍 [AUTH DEBUG] Payload JWT:', payload);
                    if (payload) {
                        userId = payload.userId;
                        console.log('🔍 [AUTH DEBUG] UserId desde JWT:', userId);
                    }
                }
            }
            catch (jwtError) {
                console.warn('🔍 [AUTH DEBUG] JWT token inválido, intentando con X-User-ID:', jwtError);
            }
        }
        if (!userId) {
            const xUserId = req.header('X-User-ID');
            console.log('🔍 [AUTH DEBUG] X-User-ID header:', xUserId);
            userId = xUserId || null;
        }
        console.log('🔍 [AUTH DEBUG] UserId final:', userId);
        if (!userId) {
            console.log('🔍 [AUTH DEBUG] ❌ No se encontró userId - Usuario no autenticado');
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        console.log('🔍 [AUTH DEBUG] Buscando usuario en BD con ID:', userId);
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            console.log('🔍 [AUTH DEBUG] ❌ Usuario no encontrado en BD');
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }
        console.log('🔍 [AUTH DEBUG] ✅ Usuario encontrado:', { id: user._id, email: user.email, role: user.role });
        req.user = {
            ...user.toObject(),
            _id: user._id.toString(),
            id: user._id.toString()
        };
        console.log('🔍 [AUTH DEBUG] ✅ Autenticación exitosa, continuando...');
        next();
    }
    catch (error) {
        console.error('🔍 [AUTH DEBUG] ❌ Error en autenticación:', error);
        res.status(401).json({ message: 'Error de autenticación' });
    }
};
exports.authMiddleware = authMiddleware;
const devAuthMiddleware = (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', _id: '507f1f77bcf86cd799439011', role: 'admin' };
    next();
};
exports.devAuthMiddleware = devAuthMiddleware;
exports.authenticateToken = exports.authMiddleware;
