"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const content_service_1 = require("./content.service");
const content_validation_1 = require("./content.validation");
class ContentController {
    static async getAllPages(req, res) {
        try {
            const validationResult = content_validation_1.listContentPagesValidation.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const { page, limit, isActive, search } = validationResult.data;
            const result = await content_service_1.ContentService.getAllPages(page, limit, isActive, search);
            if (!result.success) {
                return res.status(500).json(result);
            }
            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil((result.total || 0) / limit)
                }
            });
        }
        catch (error) {
            console.error('Error en getAllPages:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async getPageBySlug(req, res) {
        try {
            const validationResult = content_validation_1.slugParamValidation.safeParse(req.params);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug inválido',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const { slug } = validationResult.data;
            const result = await content_service_1.ContentService.getPageBySlug(slug);
            if (!result.success) {
                const statusCode = result.message === 'Página no encontrada' ? 404 : 500;
                return res.status(statusCode).json(result);
            }
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Error en getPageBySlug:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async getPageBySlugAdmin(req, res) {
        try {
            const validationResult = content_validation_1.slugParamValidation.safeParse(req.params);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug inválido',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const { slug } = validationResult.data;
            const result = await content_service_1.ContentService.getPageBySlugAdmin(slug);
            if (!result.success) {
                const statusCode = result.message === 'Página no encontrada' ? 404 : 500;
                return res.status(statusCode).json(result);
            }
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Error en getPageBySlugAdmin:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async getPageById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de página requerido'
                });
            }
            const result = await content_service_1.ContentService.getPageById(id);
            if (!result.success) {
                const statusCode = result.message === 'Página no encontrada' ? 404 : 400;
                return res.status(statusCode).json(result);
            }
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Error en getPageById:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async createPage(req, res) {
        try {
            const validationResult = content_validation_1.createContentPageValidation.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const { slug } = validationResult.data;
            const allowedSlugs = ['faq', 'terminos', 'terminos-new', 'faq-new'];
            if (!allowedSlugs.includes(slug)) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden crear páginas predefinidas'
                });
            }
            const modifiedBy = validationResult.data.modifiedBy || req.user?.id;
            if (!modifiedBy) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario autenticado requerido'
                });
            }
            const createData = {
                ...validationResult.data,
                modifiedBy
            };
            const result = await content_service_1.ContentService.createPage(createData);
            if (!result.success) {
                const statusCode = result.message?.includes('Ya existe') ? 409 : 400;
                return res.status(statusCode).json(result);
            }
            return res.status(201).json(result);
        }
        catch (error) {
            console.error('Error en createPage:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async updatePage(req, res) {
        try {
            const slugValidationResult = content_validation_1.slugParamValidation.safeParse(req.params);
            if (!slugValidationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug inválido',
                    errors: slugValidationResult.error.errors.map(err => err.message)
                });
            }
            const validationResult = content_validation_1.updateContentPageValidation.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const modifiedBy = validationResult.data.modifiedBy || req.user?.id;
            if (!modifiedBy) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario autenticado requerido'
                });
            }
            const updateData = {
                ...validationResult.data,
                modifiedBy
            };
            const { slug } = slugValidationResult.data;
            const result = await content_service_1.ContentService.updatePage(slug, updateData);
            if (!result.success) {
                const statusCode = result.message === 'Página no encontrada' ? 404 : 400;
                return res.status(statusCode).json(result);
            }
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Error en updatePage:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async deletePage(req, res) {
        try {
            const validationResult = content_validation_1.slugParamValidation.safeParse(req.params);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug inválido',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const modifiedBy = req.user?.id;
            if (!modifiedBy) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario autenticado requerido'
                });
            }
            const { slug } = validationResult.data;
            const result = await content_service_1.ContentService.deletePage(slug, modifiedBy);
            if (!result.success) {
                const statusCode = result.message === 'Página no encontrada' ? 404 : 400;
                return res.status(statusCode).json(result);
            }
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('Error en deletePage:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async duplicatePage(req, res) {
        try {
            const validationResult = content_validation_1.slugParamValidation.safeParse(req.params);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug inválido',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const { newSlug, newTitle } = req.body;
            if (!newSlug || !newTitle) {
                return res.status(400).json({
                    success: false,
                    message: 'newSlug y newTitle son requeridos'
                });
            }
            const newSlugValidationResult = content_validation_1.slugParamValidation.safeParse({ slug: newSlug });
            if (!newSlugValidationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Nuevo slug inválido',
                    errors: newSlugValidationResult.error.errors.map(err => err.message)
                });
            }
            const modifiedBy = req.user?.id;
            if (!modifiedBy) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario autenticado requerido'
                });
            }
            const { slug } = validationResult.data;
            const result = await content_service_1.ContentService.duplicatePage(slug, newSlug, newTitle, modifiedBy);
            if (!result.success) {
                const statusCode = result.message?.includes('no encontrada') ? 404 :
                    result.message?.includes('Ya existe') ? 409 : 400;
                return res.status(statusCode).json(result);
            }
            return res.status(201).json(result);
        }
        catch (error) {
            console.error('Error en duplicatePage:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    static async getAdminPages(req, res) {
        try {
            const validationResult = content_validation_1.listContentPagesValidation.safeParse(req.query);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros de consulta inválidos',
                    errors: validationResult.error.errors.map(err => err.message)
                });
            }
            const { page, limit, isActive, search } = validationResult.data;
            const result = await content_service_1.ContentService.getAllPages(page, limit, isActive, search);
            if (!result.success) {
                return res.status(500).json(result);
            }
            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil((result.total || 0) / limit)
                }
            });
        }
        catch (error) {
            console.error('Error en getAdminPages:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}
exports.ContentController = ContentController;
