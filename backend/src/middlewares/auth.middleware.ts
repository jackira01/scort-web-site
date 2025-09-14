import { Response, NextFunction } from 'express';
import UserModel from '../modules/user/User.model';
import { AuthRequest } from '../types/auth.types';
import { JWTService } from '../services/jwt.service';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 [AUTH DEBUG] Iniciando autenticación para:', req.method, req.originalUrl);
    
    const jwtService = new JWTService();
    let userId: string | null = null;

    // Intentar obtener userId desde Authorization Bearer token
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
      } catch (jwtError) {
        // Si el JWT es inválido, intentar con X-User-ID como fallback
        console.warn('🔍 [AUTH DEBUG] JWT token inválido, intentando con X-User-ID:', jwtError);
      }
    }

    // Fallback a X-User-ID si no hay Bearer token válido
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
    const user = await UserModel.findById(userId);
    
    if (!user) {
      console.log('🔍 [AUTH DEBUG] ❌ Usuario no encontrado en BD');
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    console.log('🔍 [AUTH DEBUG] ✅ Usuario encontrado:', { id: user._id, email: user.email, role: user.role });

    // Ensure the user object has both id and _id for compatibility
    req.user = {
      ...user.toObject(),
      _id: (user._id as string).toString(),
      id: (user._id as string).toString()
    };
    
    console.log('🔍 [AUTH DEBUG] ✅ Autenticación exitosa, continuando...');
    next();
  } catch (error) {
    console.error('🔍 [AUTH DEBUG] ❌ Error en autenticación:', error);
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