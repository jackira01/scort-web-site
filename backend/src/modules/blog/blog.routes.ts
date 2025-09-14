import { Router } from 'express';
import type { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { BlogController } from './blog.controller';
// import { authMiddleware, adminMiddleware } from '../../middleware/auth'; // Descomentar cuando esté disponible

const router = Router();

// Validaciones para crear blog
const createBlogValidation = [
  body('title')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres')
    .trim(),
  body('content')
    .notEmpty()
    .withMessage('El contenido es requerido')
    .isObject()
    .withMessage('El contenido debe ser un objeto JSON válido'),
  body('slug')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El slug debe tener entre 3 y 200 caracteres')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('El slug solo puede contener letras minúsculas, números y guiones')
    .trim(),
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('La imagen de portada debe ser una URL válida')
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage('La imagen debe ser un archivo de imagen válido (jpg, jpeg, png, gif, webp)'),
  body('published')
    .optional()
    .isBoolean()
    .withMessage('El campo published debe ser un booleano')
];

// Validaciones para actualizar blog
const updateBlogValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de blog inválido'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres')
    .trim(),
  body('content')
    .optional()
    .isObject()
    .withMessage('El contenido debe ser un objeto JSON válido'),
  body('slug')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El slug debe tener entre 3 y 200 caracteres')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('El slug solo puede contener letras minúsculas, números y guiones')
    .trim(),
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('La imagen de portada debe ser una URL válida')
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage('La imagen debe ser un archivo de imagen válido'),
  body('published')
    .optional()
    .isBoolean()
    .withMessage('El campo published debe ser un booleano')
];

// Validaciones para parámetros de ID
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de blog inválido')
];

// Validaciones para búsqueda
const searchValidation = [
  param('term')
    .isLength({ min: 2 })
    .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
    .trim()
];

// Validaciones para query parameters
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El skip debe ser un número mayor o igual a 0'),
  query('published')
    .optional()
    .isBoolean()
    .withMessage('El campo published debe ser un booleano'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title'])
    .withMessage('sortBy debe ser: createdAt, updatedAt o title'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder debe ser: asc o desc'),
  query('search')
    .optional()
    .isLength({ min: 2 })
    .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
    .trim()
];

// ============================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================================

/**
 * GET /api/blogs - Obtener todos los blogs publicados
 * Query params: page, limit, search, sortBy, sortOrder
 */
router.get('/', queryValidation, BlogController.getBlogs);

/**
 * GET /api/blogs/search/:term - Buscar blogs por término
 */
router.get('/search/:term', searchValidation, BlogController.searchBlogs);

/**
 * GET /api/blogs/:identifier - Obtener un blog por ID o slug (solo publicados para público)
 */
router.get('/:identifier', BlogController.getBlogByIdOrSlug);

/**
 * GET /api/blogs/:id/related - Obtener blogs relacionados
 */
router.get('/:id/related', idValidation, BlogController.getRelatedBlogs);

// ============================================================================
// RUTAS ADMINISTRATIVAS (requieren autenticación)
// ============================================================================

/**
 * POST /api/blogs - Crear un nuevo blog
 * Requiere: autenticación de administrador
 */
router.post('/',
  // authMiddleware, // Descomentar cuando esté disponible
  // adminMiddleware, // Descomentar cuando esté disponible
  createBlogValidation,
  BlogController.createBlog
);

/**
 * PUT /api/blogs/:id - Actualizar un blog
 * Requiere: autenticación de administrador
 */
router.put('/:id',
  // authMiddleware, // Descomentar cuando esté disponible
  // adminMiddleware, // Descomentar cuando esté disponible
  updateBlogValidation,
  BlogController.updateBlog
);

/**
 * PATCH /api/blogs/:id/toggle - Alternar estado publicado/no publicado
 * Requiere: autenticación de administrador
 */
router.patch('/:id/toggle',
  // authMiddleware, // Descomentar cuando esté disponible
  // adminMiddleware, // Descomentar cuando esté disponible
  idValidation,
  BlogController.toggleBlogStatus
);

/**
 * DELETE /api/blogs/:id - Eliminar un blog
 * Requiere: autenticación de administrador
 */
router.delete('/:id',
  // authMiddleware, // Descomentar cuando esté disponible
  // adminMiddleware, // Descomentar cuando esté disponible
  idValidation,
  BlogController.deleteBlog
);

// ============================================================================
// RUTAS ADMINISTRATIVAS ADICIONALES
// ============================================================================

/**
 * GET /api/blogs/admin/all - Obtener todos los blogs (incluidos no publicados)
 * Requiere: autenticación de administrador
 */
router.get('/admin/all',
  // authMiddleware, // Descomentar cuando esté disponible
  // adminMiddleware, // Descomentar cuando esté disponible
  [
    query('published')
      .optional()
      .isBoolean()
      .withMessage('El campo published debe ser un booleano'),
    ...queryValidation
  ],
  (req: Request, res: Response) => {
    // Permitir ver blogs no publicados en el admin
    if (req.query.published === undefined) {
      req.query.published = 'all'; // Mostrar todos por defecto en admin
    }
    BlogController.getBlogs(req, res);
  }
);

/**
 * GET /api/blogs/admin/:identifier - Obtener un blog por ID o slug (incluidos no publicados)
 * Requiere: autenticación de administrador
 */
router.get('/admin/:identifier',
  // authMiddleware, // Descomentar cuando esté disponible
  // adminMiddleware, // Descomentar cuando esté disponible
  (req: Request, res: Response) => {
    // Agregar header de autorización para permitir ver blogs no publicados
    req.headers.authorization = req.headers.authorization || 'admin';
    BlogController.getBlogByIdOrSlug(req, res);
  }
);

export default router;

// ============================================================================
// DOCUMENTACIÓN DE ENDPOINTS
// ============================================================================

/*
ENDPOINTS DISPONIBLES:

PÚBLICOS:
- GET    /api/blogs                    → Listar blogs publicados
- GET    /api/blogs/search/:term       → Buscar blogs
- GET    /api/blogs/:identifier        → Obtener blog por ID/slug (solo publicados)
- GET    /api/blogs/:id/related        → Obtener blogs relacionados

ADMINISTRATIVOS:
- POST   /api/blogs                    → Crear blog
- PUT    /api/blogs/:id                → Actualizar blog
- PATCH  /api/blogs/:id/toggle         → Alternar estado publicado
- DELETE /api/blogs/:id                → Eliminar blog
- GET    /api/blogs/admin/all          → Listar todos los blogs (incluidos no publicados)
- GET    /api/blogs/admin/:identifier  → Obtener blog por ID/slug (incluidos no publicados)

PARÁMETROS DE CONSULTA:
- page: número de página (default: 1)
- limit: elementos por página (default: 10, max: 100)
- skip: elementos a saltar (alternativa a page)
- published: filtrar por estado (true/false)
- search: término de búsqueda
- sortBy: campo de ordenamiento (createdAt, updatedAt, title)
- sortOrder: orden (asc, desc)

EJEMPLOS:
- GET /api/blogs?page=1&limit=5&search=tecnologia
- GET /api/blogs?published=true&sortBy=title&sortOrder=asc
- GET /api/blogs/mi-primer-blog
- GET /api/blogs/search/javascript
*/