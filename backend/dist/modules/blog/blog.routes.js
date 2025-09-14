"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const blog_controller_1 = require("./blog.controller");
const router = (0, express_1.Router)();
const createBlogValidation = [
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('El título es requerido')
        .isLength({ min: 3, max: 200 })
        .withMessage('El título debe tener entre 3 y 200 caracteres')
        .trim(),
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('El contenido es requerido')
        .isObject()
        .withMessage('El contenido debe ser un objeto JSON válido'),
    (0, express_validator_1.body)('slug')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('El slug debe tener entre 3 y 200 caracteres')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('El slug solo puede contener letras minúsculas, números y guiones')
        .trim(),
    (0, express_validator_1.body)('coverImage')
        .optional()
        .isURL()
        .withMessage('La imagen de portada debe ser una URL válida')
        .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
        .withMessage('La imagen debe ser un archivo de imagen válido (jpg, jpeg, png, gif, webp)'),
    (0, express_validator_1.body)('published')
        .optional()
        .isBoolean()
        .withMessage('El campo published debe ser un booleano')
];
const updateBlogValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID de blog inválido'),
    (0, express_validator_1.body)('title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('El título debe tener entre 3 y 200 caracteres')
        .trim(),
    (0, express_validator_1.body)('content')
        .optional()
        .isObject()
        .withMessage('El contenido debe ser un objeto JSON válido'),
    (0, express_validator_1.body)('slug')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('El slug debe tener entre 3 y 200 caracteres')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('El slug solo puede contener letras minúsculas, números y guiones')
        .trim(),
    (0, express_validator_1.body)('coverImage')
        .optional()
        .isURL()
        .withMessage('La imagen de portada debe ser una URL válida')
        .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
        .withMessage('La imagen debe ser un archivo de imagen válido'),
    (0, express_validator_1.body)('published')
        .optional()
        .isBoolean()
        .withMessage('El campo published debe ser un booleano')
];
const idValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID de blog inválido')
];
const searchValidation = [
    (0, express_validator_1.param)('term')
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
        .isBoolean()
        .withMessage('El campo published debe ser un booleano'),
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
router.get('/', queryValidation, blog_controller_1.BlogController.getBlogs);
router.get('/search/:term', searchValidation, blog_controller_1.BlogController.searchBlogs);
router.get('/:identifier', blog_controller_1.BlogController.getBlogByIdOrSlug);
router.get('/:id/related', idValidation, blog_controller_1.BlogController.getRelatedBlogs);
router.post('/', createBlogValidation, blog_controller_1.BlogController.createBlog);
router.put('/:id', updateBlogValidation, blog_controller_1.BlogController.updateBlog);
router.patch('/:id/toggle', idValidation, blog_controller_1.BlogController.toggleBlogStatus);
router.delete('/:id', idValidation, blog_controller_1.BlogController.deleteBlog);
router.get('/admin/all', [
    (0, express_validator_1.query)('published')
        .optional()
        .isBoolean()
        .withMessage('El campo published debe ser un booleano'),
    ...queryValidation
], (req, res) => {
    if (req.query.published === undefined) {
        req.query.published = 'all';
    }
    blog_controller_1.BlogController.getBlogs(req, res);
});
router.get('/admin/:identifier', (req, res) => {
    req.headers.authorization = req.headers.authorization || 'admin';
    blog_controller_1.BlogController.getBlogByIdOrSlug(req, res);
});
exports.default = router;
