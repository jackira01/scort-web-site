"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsController = void 0;
const news_service_1 = require("./news.service");
const express_validator_1 = require("express-validator");
class NewsController {
    static async createNews(req, res) {
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
            const newsData = {
                title: req.body.title,
                content: req.body.content,
                published: req.body.published !== undefined ? req.body.published : true
            };
            const news = await news_service_1.NewsService.createNews(newsData);
            res.status(201).json({
                success: true,
                message: 'Noticia creada exitosamente',
                data: news
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async getNews(req, res) {
        try {
            const filters = {
                published: req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined,
                search: req.query.search,
                limit: req.query.limit ? parseInt(req.query.limit) : 10,
                skip: req.query.skip ? parseInt(req.query.skip) : 0,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            const result = await news_service_1.NewsService.getNews(filters);
            res.status(200).json({
                success: true,
                message: 'Noticias obtenidas exitosamente',
                data: result.news,
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
    static async getNewsById(req, res) {
        try {
            const { id } = req.params;
            const news = await news_service_1.NewsService.getNewsById(id);
            if (!news) {
                res.status(404).json({
                    success: false,
                    message: 'Noticia no encontrada'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Noticia obtenida exitosamente',
                data: news
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async updateNews(req, res) {
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
            const updateData = {
                title: req.body.title,
                content: req.body.content,
                published: req.body.published
            };
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });
            const news = await news_service_1.NewsService.updateNews(id, updateData);
            if (!news) {
                res.status(404).json({
                    success: false,
                    message: 'Noticia no encontrada'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Noticia actualizada exitosamente',
                data: news
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async toggleNewsStatus(req, res) {
        try {
            const { id } = req.params;
            const news = await news_service_1.NewsService.toggleNewsStatus(id);
            if (!news) {
                res.status(404).json({
                    success: false,
                    message: 'Noticia no encontrada'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Noticia ${news.published ? 'publicada' : 'despublicada'} exitosamente`,
                data: news
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async deleteNews(req, res) {
        try {
            const { id } = req.params;
            const deleted = await news_service_1.NewsService.deleteNews(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Noticia no encontrada'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Noticia eliminada exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async searchNews(req, res) {
        try {
            const { q: searchTerm, limit } = req.query;
            if (!searchTerm) {
                res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda requerido'
                });
                return;
            }
            const news = await news_service_1.NewsService.searchNews(searchTerm, limit ? parseInt(limit) : 10);
            res.status(200).json({
                success: true,
                message: 'Búsqueda completada exitosamente',
                data: news
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
    static async getLatestNews(req, res) {
        try {
            const { limit } = req.query;
            const news = await news_service_1.NewsService.getLatestNews(limit ? parseInt(limit) : 5);
            res.status(200).json({
                success: true,
                message: 'Últimas noticias obtenidas exitosamente',
                data: news
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
exports.NewsController = NewsController;
exports.default = NewsController;
