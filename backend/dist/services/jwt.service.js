"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtService = exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTService {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'fallback-secret-key';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    }
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.secret, {
            expiresIn: this.expiresIn,
            issuer: 'scort-backend',
            audience: 'scort-frontend'
        });
    }
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.secret, {
                issuer: 'scort-backend',
                audience: 'scort-frontend'
            });
            return decoded;
        }
        catch (error) {
            console.error('JWT verification failed:', error);
            return null;
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    generateUserToken(user) {
        const payload = {
            userId: user._id.toString(),
            role: user.role,
            isVerified: user.isVerified,
            verification_in_progress: user.verification_in_progress
        };
        return this.generateToken(payload);
    }
}
exports.JWTService = JWTService;
exports.jwtService = new JWTService();
