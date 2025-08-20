import { Request, Response, NextFunction } from 'express';
import UserModel from '../modules/user/User.model';

interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // For now, this is a basic implementation
    // In a real application, you would validate the session/token from NextAuth
    const userId = req.header('X-User-ID');
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Error de autenticación' });
  }
};

// Alternative middleware for development/testing
export const devAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // For development purposes, you can bypass authentication
  // Remove this in production
  req.user = { _id: 'dev-user-id', role: 'admin' };
  next();
};