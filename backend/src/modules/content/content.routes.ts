import { Router } from 'express';
import { ContentController } from './content.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const router = Router();

// Rutas públicas (sin autenticación)
/**
 * GET /api/content/pages
 * Obtiene todas las páginas de contenido activas (público)
 */
router.get('/pages', ContentController.getAllPages);

/**
 * GET /api/content/public/:slug
 * Obtiene una página de contenido por slug (público)
 */
router.get('/public/:slug', ContentController.getPageBySlug);

/**
 * GET /api/content/pages/:slug
 * Obtiene una página de contenido por slug (público) - ruta legacy
 */
router.get('/pages/:slug', ContentController.getPageBySlug);

// Rutas administrativas (requieren autenticación y permisos de admin)
/**
 * GET /api/content/admin/pages
 * Obtiene todas las páginas de contenido para administración (admin)
 */
router.get('/admin/pages', authMiddleware, adminMiddleware, ContentController.getAdminPages);

/**
 * GET /api/content/admin/pages/slug/:slug
 * Obtiene una página de contenido por slug (admin)
 */
router.get('/admin/pages/slug/:slug', authMiddleware, adminMiddleware, ContentController.getPageBySlugAdmin);

/**
 * GET /api/content/admin/pages/:id
 * Obtiene una página de contenido por ID (admin)
 */
router.get('/admin/pages/:id', authMiddleware, adminMiddleware, ContentController.getPageById);

/**
 * POST /api/content/admin/pages
 * Crea una nueva página de contenido (admin)
 */
router.post('/admin/pages', authMiddleware, adminMiddleware, ContentController.createPage);

/**
 * PUT /api/content/admin/pages/:slug
 * Actualiza una página de contenido existente (admin)
 */
router.put('/admin/pages/:slug', authMiddleware, adminMiddleware, ContentController.updatePage);

/**
 * DELETE /api/content/admin/pages/:slug
 * Elimina una página de contenido (soft delete) (admin)
 */
router.delete('/admin/pages/:slug', authMiddleware, adminMiddleware, ContentController.deletePage);

/**
 * POST /api/content/admin/pages/:slug/duplicate
 * Duplica una página de contenido (admin)
 */
router.post('/admin/pages/:slug/duplicate', authMiddleware, adminMiddleware, ContentController.duplicatePage);

export { router as contentRoutes };