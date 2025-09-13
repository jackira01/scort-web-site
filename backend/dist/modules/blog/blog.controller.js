"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const blog_service_1 = require("./blog.service");
const express_validator_1 = require("express-validator");
class BlogController {
    static async createBlog(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
                return;
            }
            const blogData = {
                title: req.body.title,
                slug: req.body.slug,
                content: req.body.content,
                coverImage: req.body.coverImage,
                published: req.body.published !== undefined ? req.body.published : true
            };
            const blog = await blog_service_1.BlogService.createBlog(blogData);
            res.status(201).json({
                success: true,
                message: 'Blog creado exitosamente',
                data: blog
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async getBlogs(req, res) {
        try {
            const filters = {
                published: req.query.published !== undefined ? req.query.published === 'true' : true,
                search: req.query.search,
                limit: req.query.limit ? parseInt(req.query.limit) : 10,
                skip: req.query.skip ? parseInt(req.query.skip) : 0,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            if (req.query.page) {
                const page = parseInt(req.query.page);
                const limit = filters.limit || 10;
                filters.skip = (page - 1) * limit;
            }
            const result = await blog_service_1.BlogService.getBlogs(filters);
            res.status(200).json({
                success: true,
                message: 'Blogs obtenidos exitosamente',
                data: result.blogs,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                    limit: filters.limit
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async getBlogByIdOrSlug(req, res) {
        try {
            const { identifier } = req.params;
            if (!identifier) {
                res.status(400).json({
                    success: false,
                    message: 'ID o slug del blog es requerido'
                });
                return;
            }
            const blog = await blog_service_1.BlogService.getBlogByIdOrSlug(identifier);
            if (!blog) {
                res.status(404).json({
                    success: false,
                    message: 'Blog no encontrado'
                });
                return;
            }
            const isPublicRequest = !req.headers.authorization;
            if (isPublicRequest && !blog.published) {
                res.status(404).json({
                    success: false,
                    message: 'Blog no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Blog obtenido exitosamente',
                data: blog
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async updateBlog(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
                return;
            }
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'ID del blog es requerido'
                });
                return;
            }
            const updateData = {};
            if (req.body.title !== undefined)
                updateData.title = req.body.title;
            if (req.body.slug !== undefined)
                updateData.slug = req.body.slug;
            if (req.body.content !== undefined)
                updateData.content = req.body.content;
            if (req.body.coverImage !== undefined)
                updateData.coverImage = req.body.coverImage;
            if (req.body.published !== undefined)
                updateData.published = req.body.published;
            const blog = await blog_service_1.BlogService.updateBlog(id, updateData);
            if (!blog) {
                res.status(404).json({
                    success: false,
                    message: 'Blog no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Blog actualizado exitosamente',
                data: blog
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async toggleBlogStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'ID del blog es requerido'
                });
                return;
            }
            const blog = await blog_service_1.BlogService.toggleBlogStatus(id);
            if (!blog) {
                res.status(404).json({
                    success: false,
                    message: 'Blog no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Blog ${blog.published ? 'publicado' : 'despublicado'} exitosamente`,
                data: blog
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async deleteBlog(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'ID del blog es requerido'
                });
                return;
            }
            const deleted = await blog_service_1.BlogService.deleteBlog(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Blog no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Blog eliminado exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async getRelatedBlogs(req, res) {
        try {
            const { id } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 3;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'ID del blog es requerido'
                });
                return;
            }
            const relatedBlogs = await blog_service_1.BlogService.getRelatedBlogs(id, limit);
            res.status(200).json({
                success: true,
                message: 'Blogs relacionados obtenidos exitosamente',
                data: relatedBlogs
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async searchBlogs(req, res) {
        try {
            const { term } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            if (!term || term.trim().length < 2) {
                res.status(400).json({
                    success: false,
                    message: 'El término de búsqueda debe tener al menos 2 caracteres'
                });
                return;
            }
            const blogs = await blog_service_1.BlogService.searchBlogs(term.trim(), limit);
            res.status(200).json({
                success: true,
                message: 'Búsqueda completada exitosamente',
                data: blogs,
                searchTerm: term
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
}
exports.BlogController = BlogController;
exports.default = BlogController;
