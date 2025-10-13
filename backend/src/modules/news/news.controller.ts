import { Request, Response } from 'express';
import { NewsService, CreateNewsData, UpdateNewsData, NewsFilters } from './news.service';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../../types/auth.types';

export class NewsController {
  /**
   * POST /api/news - Crear una nueva noticia
   */
  static async createNews(req: Request, res: Response): Promise<void> {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
        return;
      }

      const newsData: CreateNewsData = {
        title: req.body.title,
        content: req.body.content,
        imageUrl: req.body.imageUrl || req.body.bannerImage,
        published: req.body.published !== undefined ? req.body.published : true
      };

      const news = await NewsService.createNews(newsData);

      res.status(201).json({
        success: true,
        message: 'Noticia creada exitosamente',
        data: news
      });
    } catch (error: any) {
      // Error al crear noticia
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/news - Obtener todas las noticias con filtros
   */
  static async getNews(req: Request, res: Response): Promise<void> {
    try {
      const filters: NewsFilters = {
        published: req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
        sortBy: (req.query.sortBy as 'createdAt' | 'updatedAt' | 'title') || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await NewsService.getNews(filters);

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
    } catch (error: any) {
      // Error al obtener noticias
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/news/:id - Obtener noticia por ID
   */
  static async getNewsById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const news = await NewsService.getNewsById(id);

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
    } catch (error: any) {
      // Error al obtener noticia
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * PUT /api/news/:id - Actualizar noticia
   */
  static async updateNews(req: Request, res: Response): Promise<void> {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const updateData: UpdateNewsData = {
        title: req.body.title,
        content: req.body.content,
        imageUrl: req.body.imageUrl || req.body.bannerImage,
        published: req.body.published
      };

      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateNewsData] === undefined) {
          delete updateData[key as keyof UpdateNewsData];
        }
      });

      const news = await NewsService.updateNews(id, updateData);

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
    } catch (error: any) {
      // Error al actualizar noticia
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * PATCH /api/news/:id/toggle-status - Alternar estado de publicación
   */
  static async toggleNewsStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const news = await NewsService.toggleNewsStatus(id);

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
    } catch (error: any) {
      // Error al cambiar estado de noticia
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * DELETE /api/news/:id - Eliminar noticia
   */
  static async deleteNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await NewsService.deleteNews(id);

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
    } catch (error: any) {
      // Error al eliminar noticia
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/news/search - Buscar noticias
   */
  static async searchNews(req: Request, res: Response): Promise<void> {
    try {
      const { q: searchTerm, limit } = req.query;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido'
        });
        return;
      }

      const news = await NewsService.searchNews(
        searchTerm as string,
        limit ? parseInt(limit as string) : 10
      );

      res.status(200).json({
        success: true,
        message: 'Búsqueda completada exitosamente',
        data: news
      });
    } catch (error: any) {
      // Error en búsqueda de noticias
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/news/latest - Obtener últimas noticias publicadas
   */
  static async getLatestNews(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const news = await NewsService.getLatestNews(
        limit ? parseInt(limit as string) : 5
      );

      res.status(200).json({
        success: true,
        message: 'Últimas noticias obtenidas exitosamente',
        data: news
      });
    } catch (error: any) {
      // Error al obtener últimas noticias
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
}

export default NewsController;