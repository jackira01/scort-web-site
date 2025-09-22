"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ message: 'Error en la verificación de permisos' });
    }
};
exports.adminMiddleware = adminMiddleware;
