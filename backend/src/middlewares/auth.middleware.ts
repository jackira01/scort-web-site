import { Response, NextFunction } from 'express';
import UserModel from '../modules/user/User.model';
import { AuthRequest } from '../types/auth.types';

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