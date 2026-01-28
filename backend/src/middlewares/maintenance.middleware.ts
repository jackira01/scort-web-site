import { NextFunction, Request, Response } from 'express';

/**
 * Middleware para manejar el modo mantenimiento del backend.
 * Si MAINTENANCE_MODE es "true", devuelve 503 Service Unavailable y detiene la ejecución.
 */
export const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    if (isMaintenanceMode) {
        // Lista opcional de rutas permitidas (ej. health check)
        // if (req.path === '/ping') return next();

        res.status(503).json({
            status: 'error',
            message: 'El sistema se encuentra en mantenimiento. Por favor intente más tarde.',
            timestamp: new Date().toISOString(),
        });
        return;
    }

    next();
};
