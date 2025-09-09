import { Response, NextFunction } from 'express';
import UserModel from '../modules/user/User.model';
import { AuthRequest } from '../types/auth.types';
import { JWTService } from '../services/jwt.service';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jwtService = new JWTService();
    let userId: string | null = null;

    // Intentar obtener userId desde Authorization Bearer token
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
      } catch (jwtError) {
        // Si el JWT es inválido, intentar con X-User-ID como fallback
        console.warn('JWT token inválido, intentando con X-User-ID:', jwtError);
      }
    }

    // Fallback a X-User-ID si no hay Bearer token válido
     if (!userId) {
       userId = req.header('X-User-ID') || null;
     }
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Ensure the user object has both id and _id for compatibility
    req.user = {
      ...user.toObject(),
      _id: (user._id as string).toString(),
      id: (user._id as string).toString()
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Error de autenticación' });
  }
};

// Alternative middleware for development/testing
export const devAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // For development purposes, you can bypass authentication
  // Remove this in production
  // Using a valid ObjectId format for development
  req.user = { id: '507f1f77bcf86cd799439011', _id: '507f1f77bcf86cd799439011', role: 'admin' };
  next();
};

// Alias for compatibility
export const authenticateToken = authMiddleware;