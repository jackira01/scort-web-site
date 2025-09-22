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
        const jwtService = new jwt_service_1.JWTService();
        let userId = null;
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = jwtService.extractTokenFromHeader(authHeader);
                if (token) {
                    const payload = jwtService.verifyToken(token);
                    if (payload) {
                        userId = payload.userId;
                    }
                }
            }
            catch (jwtError) {
            }
        }
        if (!userId) {
            const xUserId = req.header('X-User-ID');
            userId = xUserId || null;
        }
        if (!userId) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }
        req.user = {
            ...user.toObject(),
            _id: user._id.toString(),
            id: user._id.toString()
        };
        next();
    }
    catch (error) {
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
