"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    try {
        console.log('🔍 [ADMIN DEBUG] Verificando permisos de administrador para:', req.originalUrl);
        console.log('🔍 [ADMIN DEBUG] Usuario en request:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'No presente');
        if (!req.user) {
            console.log('🔍 [ADMIN DEBUG] ❌ Usuario no presente en request');
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        console.log('🔍 [ADMIN DEBUG] Rol del usuario:', req.user.role);
        if (req.user.role !== 'admin') {
            console.log('🔍 [ADMIN DEBUG] ❌ Usuario no es administrador. Rol actual:', req.user.role);
            return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
        }
        console.log('🔍 [ADMIN DEBUG] ✅ Usuario es administrador, continuando...');
        next();
    }
    catch (error) {
        console.error('🔍 [ADMIN DEBUG] ❌ Error en verificación de permisos:', error);
        res.status(500).json({ message: 'Error en la verificación de permisos' });
    }
};
exports.adminMiddleware = adminMiddleware;
