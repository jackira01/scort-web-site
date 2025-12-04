import { Request, Response } from 'express';
import { BlogService, CreateBlogData, UpdateBlogData, BlogFilters } from './blog.service';
import { validationResult } from 'express-validator';

export class BlogController {
  /**
   * POST /api/blogs - Crear un nuevo blog
   */
  static async createBlog(req: Request, res: Response): Promise<void> {
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

      const blogData: CreateBlogData = {
        title: req.body.title,
        slug: req.body.slug,
        content: req.body.content,
        coverImage: req.body.coverImage,
        published: req.body.published !== undefined ? req.body.published : true,
        categories: req.body.categories
      };

      const blog = await BlogService.createBlog(blogData);

      res.status(201).json({
        success: true,
        message: 'Blog creado exitosamente',
        data: blog
      });
    } catch (error: any) {
      // Error al crear blog
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/blogs - Obtener todos los blogs con filtros
   */
  static async getBlogs(req: Request, res: Response): Promise<void> {
    try {
      const filters: BlogFilters = {
        published: req.query.published !== undefined ? req.query.published === 'true' : true,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
        sortBy: (req.query.sortBy as 'createdAt' | 'updatedAt' | 'title') || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      // Para paginación por página
      if (req.query.page) {
        const page = parseInt(req.query.page as string);
        const limit = filters.limit || 10;
        filters.skip = (page - 1) * limit;
      }

      const result = await BlogService.getBlogs(filters);

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
    } catch (error: any) {
      // Error al obtener blogs
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/blogs/:identifier - Obtener un blog por ID o slug
   */
  static async getBlogByIdOrSlug(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;

      if (!identifier) {
        res.status(400).json({
          success: false,
          message: 'ID o slug del blog es requerido'
        });
        return;
      }

      const blog = await BlogService.getBlogByIdOrSlug(identifier);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: 'Blog no encontrado'
        });
        return;
      }

      // Si es una consulta pública, solo mostrar blogs publicados
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
    } catch (error: any) {
      // Error al obtener blog
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * PUT /api/blogs/:id - Actualizar un blog
   */
  static async updateBlog(req: Request, res: Response): Promise<void> {
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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID del blog es requerido'
        });
        return;
      }

      const updateData: UpdateBlogData = {};

      // Solo incluir campos que están presentes en el body
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.slug !== undefined) updateData.slug = req.body.slug;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.coverImage !== undefined) updateData.coverImage = req.body.coverImage;
      if (req.body.published !== undefined) updateData.published = req.body.published;
      if (req.body.categories !== undefined) updateData.categories = req.body.categories;

      const blog = await BlogService.updateBlog(id, updateData);

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
    } catch (error: any) {
      // Error al actualizar blog
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * PATCH /api/blogs/:id/toggle - Alternar estado publicado/no publicado
   */
  static async toggleBlogStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID del blog es requerido'
        });
        return;
      }

      const blog = await BlogService.toggleBlogStatus(id);

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
    } catch (error: any) {
      // Error al cambiar estado del blog
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * DELETE /api/blogs/:id - Eliminar un blog
   */
  static async deleteBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID del blog es requerido'
        });
        return;
      }

      const deleted = await BlogService.deleteBlog(id);

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
    } catch (error: any) {
      // Error al eliminar blog
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/blogs/:id/related - Obtener blogs relacionados
   */
  static async getRelatedBlogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID del blog es requerido'
        });
        return;
      }

      const relatedBlogs = await BlogService.getRelatedBlogs(id, limit);

      res.status(200).json({
        success: true,
        message: 'Blogs relacionados obtenidos exitosamente',
        data: relatedBlogs
      });
    } catch (error: any) {
      // Error al obtener blogs relacionados
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/blogs/search/:term - Buscar blogs por término
   */
  static async searchBlogs(req: Request, res: Response): Promise<void> {
    try {
      const { term } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!term || term.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
        return;
      }

      const blogs = await BlogService.searchBlogs(term.trim(), limit);

      res.status(200).json({
        success: true,
        message: 'Búsqueda completada exitosamente',
        data: blogs,
        searchTerm: term
      });
    } catch (error: any) {
      // Error al buscar blogs
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
}

export default BlogController;