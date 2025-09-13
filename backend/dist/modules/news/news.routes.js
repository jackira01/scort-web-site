"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const news_controller_1 = require("./news.controller");
const router = (0, express_1.Router)();
const createNewsValidation = [
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('El título es requerido')
        .isLength({ min: 3, max: 200 })
        .withMessage('El título debe tener entre 3 y 200 caracteres')
        .trim(),
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('El contenido es requerido')
        .isArray({ min: 1 })
        .withMessage('El contenido debe ser un array con al menos un elemento'),
    (0, express_validator_1.body)('content.*')
        .isString()
        .withMessage('Cada elemento del contenido debe ser un string')
        .isLength({ min: 1, max: 500 })
        .withMessage('Cada elemento del contenido debe tener entre 1 y 500 caracteres')
        .trim(),
    (0, express_validator_1.body)('published')
        .optional()
        .isBoolean()
        .withMessage('El campo published debe ser un booleano')
];
const updateNewsValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID de noticia inválido'),
    (0, express_validator_1.body)('title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('El título debe tener entre 3 y 200 caracteres')
        .trim(),
    (0, express_validator_1.body)('content')
        .optional()
        .isArray({ min: 1 })
        .withMessage('El contenido debe ser un array con al menos un elemento'),
    (0, express_validator_1.body)('content.*')
        .optional()
        .isString()
        .withMessage('Cada elemento del contenido debe ser un string')
        .isLength({ min: 1, max: 500 })
        .withMessage('Cada elemento del contenido debe tener entre 1 y 500 caracteres')
        .trim(),
    (0, express_validator_1.body)('published')
        .optional()
        .isBoolean()
        .withMessage('El campo published debe ser un booleano')
];
const idValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID de noticia inválido')
];
const searchValidation = [
    (0, express_validator_1.query)('q')
        .isLength({ min: 2 })
        .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
        .trim()
];
const queryValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100'),
    (0, express_validator_1.query)('skip')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El skip debe ser un número mayor o igual a 0'),
    (0, express_validator_1.query)('published')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('El campo published debe ser true o false'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'title'])
        .withMessage('sortBy debe ser: createdAt, updatedAt o title'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder debe ser: asc o desc'),
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 2 })
        .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
        .trim()
];
router.get('/', queryValidation, news_controller_1.NewsController.getNews);
router.get('/latest', news_controller_1.NewsController.getLatestNews);
router.get('/search', searchValidation, news_controller_1.NewsController.searchNews);
router.get('/:id', idValidation, news_controller_1.NewsController.getNewsById);
router.post('/', createNewsValidation, news_controller_1.NewsController.createNews);
router.put('/:id', updateNewsValidation, news_controller_1.NewsController.updateNews);
router.patch('/:id/toggle-status', idValidation, news_controller_1.NewsController.toggleNewsStatus);
router.delete('/:id', idValidation, news_controller_1.NewsController.deleteNews);
router.get('/admin/all', [
    (0, express_validator_1.query)('published')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('El campo published debe ser true o false'),
    ...queryValidation
], (req, res) => {
    if (req.query.published === undefined) {
        req.query.published = undefined;
    }
    news_controller_1.NewsController.getNews(req, res);
});
router.get('/admin/:id', idValidation, news_controller_1.NewsController.getNewsById);
exports.default = router;
