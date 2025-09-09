import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JWTPayload {
    userId: string;
    role: string;
    isVerified?: boolean;
    verification_in_progress?: boolean;
}

class JWTService {
    private readonly secret: string;
    private readonly expiresIn: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'fallback-secret-key';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    }

    /**
     * Genera un JWT token para un usuario
     */
    generateToken(payload: JWTPayload): string {
        return jwt.sign(payload, this.secret as string, {
            expiresIn: this.expiresIn,
            issuer: 'scort-backend',
            audience: 'scort-frontend'
        } as jwt.SignOptions);
    }

    /**
     * Verifica y decodifica un JWT token
     */
    verifyToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.verify(token, this.secret as string, {
                issuer: 'scort-backend',
                audience: 'scort-frontend'
            } as jwt.VerifyOptions) as JWTPayload;
            return decoded;
        } catch (error) {
            console.error('JWT verification failed:', error);
            return null;
        }
    }

    /**
     * Extrae el token del header Authorization
     */
    extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    /**
     * Genera un token para un usuario con datos completos
     */
    generateUserToken(user: any): string {
        const payload: JWTPayload = {
            userId: user._id.toString(),
            role: user.role,
            isVerified: user.isVerified,
            verification_in_progress: user.verification_in_progress
        };
        return this.generateToken(payload);
    }
}

export { JWTService };
export const jwtService = new JWTService();
export { JWTPayload };