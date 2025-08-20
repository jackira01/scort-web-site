import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
}

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error en la verificación de permisos' });
  }
};