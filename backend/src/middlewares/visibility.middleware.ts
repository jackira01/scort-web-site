import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que asegura que solo se muestren perfiles visibles
 * Se aplica automáticamente a todas las consultas de lectura de perfiles
 */

/**
 * Middleware para filtrar perfiles no visibles
 * Agrega automáticamente el filtro visible: true a las consultas
 */
export const ensureVisibleProfiles = (req: Request, res: Response, next: NextFunction): void => {
  // Agregar filtro de visibilidad a los query params si no existe
  if (!req.query.includeHidden) {
    req.query.visible = 'true';
  }
  
  next();
};

/**
 * Middleware específico para endpoints de feeds
 * Asegura que nunca se muestren perfiles no visibles
 */
export const enforceVisibilityForFeeds = (req: Request, res: Response, next: NextFunction): void => {
  // Forzar visible=true independientemente de los parámetros
  req.query.visible = 'true';
  
  // Remover cualquier parámetro que intente incluir perfiles ocultos
  delete req.query.includeHidden;
  
  next();
};

/**
 * Middleware para endpoints administrativos
 * Permite ver perfiles ocultos solo si se especifica explícitamente
 */
export const allowHiddenForAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // Solo aplicar filtro si no se especifica includeHidden=true
  if (req.query.includeHidden !== 'true') {
    req.query.visible = 'true';
  }
  
  next();
};

/**
 * Función helper para aplicar filtros de visibilidad a consultas de Mongoose
 * @param baseQuery - Query base de Mongoose
 * @param includeHidden - Si true, incluye perfiles ocultos
 * @returns Query con filtros de visibilidad aplicados
 */
export const applyVisibilityFilter = (baseQuery: any, includeHidden: boolean = false): any => {
  if (!includeHidden) {
    return baseQuery.where({ visible: true });
  }
  return baseQuery;
};

/**
 * Función helper para crear filtros de visibilidad para consultas directas
 * @param includeHidden - Si true, no aplica filtro de visibilidad
 * @returns Objeto de filtro para usar en find(), updateMany(), etc.
 */
export const getVisibilityFilter = (includeHidden: boolean = false): Record<string, any> => {
  if (!includeHidden) {
    return { visible: true };
  }
  return {};
};

/**
 * Middleware que registra intentos de acceso a perfiles ocultos
 */
export const logHiddenProfileAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (req.query.includeHidden === 'true') {
    console.log(`[Visibility] Admin access to hidden profiles from ${req.ip} at ${new Date().toISOString()}`);
  }
  
  next();
};