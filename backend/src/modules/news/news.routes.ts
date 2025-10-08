import { Router } from 'express';
import type { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { NewsController } from './news.controller';
// import { authMiddleware, adminMiddleware } from '../../middleware/auth'; // Descomentar cuando esté disponible

const router = Router();

// Validaciones para crear noticia
const createNewsValidation = [
  body('title')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres')
    .trim(),
  body('content')
    .notEmpty()
    .withMessage('El contenido es requerido')
    .isArray({ min: 1 })
    .withMessage('El contenido debe ser un array con al menos un elemento'),
  body('content.*')
    .isString()
    .withMessage('Cada elemento del contenido debe ser un string')
    .isLength({ min: 1, max: 500 })
    .withMessage('Cada elemento del contenido debe tener entre 1 y 500 caracteres')
    .trim(),
  body('published')
    .optional()
    .isBoolean()
    .withMessage('El campo published debe ser un booleano'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('La URL de la imagen debe ser válida')
];

// Validaciones para actualizar noticia
const updateNewsValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de noticia inválido'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres')
    .trim(),
  body('content')
    .optional()
    .isArray({ min: 1 })
    .withMessage('El contenido debe ser un array con al menos un elemento'),
  body('content.*')
    .optional()
    .isString()
    .withMessage('Cada elemento del contenido debe ser un string')
    .isLength({ min: 1, max: 500 })
    .withMessage('Cada elemento del contenido debe tener entre 1 y 500 caracteres')
    .trim(),
  body('published')
    .optional()
    .isBoolean()
    .withMessage('El campo published debe ser un booleano'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('La URL de la imagen debe ser válida')
];

// Validaciones para ID
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de noticia inválido')
];

// Validaciones para búsqueda
const searchValidation = [
  query('q')
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
    .isIn(['true', 'false'])
    .withMessage('El campo published debe ser true o false'),
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

// ===== RUTAS PÚBLICAS =====

// GET /api/news - Obtener noticias con filtros
router.get('/', queryValidation, NewsController.getNews);

// GET /api/news/latest - Obtener últimas noticias
router.get('/latest', NewsController.getLatestNews);

// GET /api/news/search - Buscar noticias
router.get('/search', searchValidation, NewsController.searchNews);

// GET /api/news/:id - Obtener noticia por ID
router.get('/:id', idValidation, NewsController.getNewsById);

// ===== RUTAS ADMINISTRATIVAS =====
// Nota: Descomentar authMiddleware y adminMiddleware cuando estén disponibles

// POST /api/news - Crear nueva noticia (solo admin)
router.post('/',
  // authMiddleware,
  // adminMiddleware,
  createNewsValidation,
  NewsController.createNews
);

// PUT /api/news/:id - Actualizar noticia (solo admin)
router.put('/:id',
  // authMiddleware,
  // adminMiddleware,
  updateNewsValidation,
  NewsController.updateNews
);

// PATCH /api/news/:id/toggle-status - Alternar estado de publicación (solo admin)
router.patch('/:id/toggle-status',
  // authMiddleware,
  // adminMiddleware,
  idValidation,
  NewsController.toggleNewsStatus
);

// DELETE /api/news/:id - Eliminar noticia (solo admin)
router.delete('/:id',
  // authMiddleware,
  // adminMiddleware,
  idValidation,
  NewsController.deleteNews
);

// ===== RUTAS ADMINISTRATIVAS ESPECÍFICAS =====

// GET /api/news/admin/all - Obtener todas las noticias para admin (incluye no publicadas)
router.get('/admin/all',
  // authMiddleware,
  // adminMiddleware,
  [
    query('published')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('El campo published debe ser true o false'),
    ...queryValidation
  ],
  (req: Request, res: Response) => {
    // Forzar que se incluyan noticias no publicadas para admin
    if (req.query.published === undefined) {
      req.query.published = undefined; // Mostrar todas
    }
    NewsController.getNews(req, res);
  }
);

// GET /api/news/admin/:id - Obtener noticia específica para admin
router.get('/admin/:id',
  // authMiddleware,
  // adminMiddleware,
  idValidation,
  NewsController.getNewsById
);

export default router;