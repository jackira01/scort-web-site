import { Response } from 'express';
import { AuthRequest } from '../../types/auth.types';
import { ContentService } from './content.service';
import { 
  createContentPageValidation, 
  updateContentPageValidation, 
  slugParamValidation,
  listContentPagesValidation,
  ZodCreateContentPageInput,
  ZodUpdateContentPageInput
} from './content.validation';

export class ContentController {
  
  /**
   * GET /api/content/pages
   * Obtiene todas las páginas de contenido con paginación y filtros
   */
  static async getAllPages(req: AuthRequest, res: Response) {
    try {
      // Validar query parameters
      const validationResult = listContentPagesValidation.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: validationResult.error.errors.map(err => err.message)
        });
      }
      
      const { page, limit, isActive, search } = validationResult.data;
      
      const result = await ContentService.getAllPages(page, limit, isActive, search);
      
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
    } catch (error: any) {
      console.error('Error en getAllPages:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * GET /api/content/pages/:slug
   * Obtiene una página de contenido por slug (público)
   */
  static async getPageBySlug(req: AuthRequest, res: Response) {
    try {
      // Validar parámetro slug
      const validationResult = slugParamValidation.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Slug inválido',
          errors: validationResult.error.errors.map(err => err.message)
        });
      }
      
      const { slug } = validationResult.data;
      const result = await ContentService.getPageBySlug(slug);
      
      if (!result.success) {
        const statusCode = result.message === 'Página no encontrada' ? 404 : 500;
        return res.status(statusCode).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en getPageBySlug:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * GET /api/content/admin/pages/slug/:slug
   * Obtiene una página de contenido por slug (admin)
   */
  static async getPageBySlugAdmin(req: AuthRequest, res: Response) {
    try {
      // Validar parámetro slug
      const validationResult = slugParamValidation.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Slug inválido',
          errors: validationResult.error.errors.map(err => err.message)
        });
      }
      
      const { slug } = validationResult.data;
      const result = await ContentService.getPageBySlugAdmin(slug);
      
      if (!result.success) {
        const statusCode = result.message === 'Página no encontrada' ? 404 : 500;
        return res.status(statusCode).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en getPageBySlugAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/content/admin/pages/:id
   * Obtiene una página de contenido por ID (admin)
   */
  static async getPageById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de página requerido'
        });
      }
      
      const result = await ContentService.getPageById(id);
      
      if (!result.success) {
        const statusCode = result.message === 'Página no encontrada' ? 404 : 400;
        return res.status(statusCode).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en getPageById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * POST /api/content/admin/pages
   * Crea una nueva página de contenido
   */
  static async createPage(req: AuthRequest, res: Response) {
    try {
      // Validar datos de entrada
      const validationResult = createContentPageValidation.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => err.message)
        });
      }
      
      const { slug } = validationResult.data;
      
      // Lista de slugs permitidos (páginas predefinidas)
      const allowedSlugs = ['faq', 'terminos', 'terminos-new', 'faq-new'];
      
      if (!allowedSlugs.includes(slug)) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden crear páginas predefinidas'
        });
      }
      
      // Agregar el usuario autenticado como modifiedBy si no se proporciona
      const modifiedBy = validationResult.data.modifiedBy || req.user?.id;
      
      if (!modifiedBy) {
        return res.status(400).json({
          success: false,
          message: 'Usuario autenticado requerido'
        });
      }
      
      const createData: ZodCreateContentPageInput = {
        ...validationResult.data,
        modifiedBy
      };
      
      const result = await ContentService.createPage(createData);
      
      if (!result.success) {
        const statusCode = result.message?.includes('Ya existe') ? 409 : 400;
        return res.status(statusCode).json(result);
      }
      
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Error en createPage:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * PUT /api/content/admin/pages/:slug
   * Actualiza una página de contenido existente
   */
  static async updatePage(req: AuthRequest, res: Response) {
    try {
      // Validar parámetro slug
      const slugValidationResult = slugParamValidation.safeParse(req.params);
      if (!slugValidationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Slug inválido',
          errors: slugValidationResult.error.errors.map(err => err.message)
        });
      }
      
      // Validar datos de entrada
      const validationResult = updateContentPageValidation.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validationResult.error.errors.map(err => err.message)
        });
      }
      
      // Agregar el usuario autenticado como modifiedBy si no se proporciona
      const modifiedBy = validationResult.data.modifiedBy || req.user?.id;
      
      if (!modifiedBy) {
        return res.status(400).json({
          success: false,
          message: 'Usuario autenticado requerido'
        });
      }
      
      const updateData: ZodUpdateContentPageInput = {
        ...validationResult.data,
        modifiedBy
      };
      
      const { slug } = slugValidationResult.data;
      const result = await ContentService.updatePage(slug, updateData);
      
      if (!result.success) {
        const statusCode = result.message === 'Página no encontrada' ? 404 : 400;
        return res.status(statusCode).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en updatePage:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * DELETE /api/content/admin/pages/:slug
   * Elimina una página de contenido (soft delete)
   */
  static async deletePage(req: AuthRequest, res: Response) {
    try {
      // Validar parámetro slug
      const validationResult = slugParamValidation.safeParse(req.params);
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
      const result = await ContentService.deletePage(slug, modifiedBy);
      
      if (!result.success) {
        const statusCode = result.message === 'Página no encontrada' ? 404 : 400;
        return res.status(statusCode).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en deletePage:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  
  /**
   * POST /api/content/admin/pages/:slug/duplicate
   * Duplica una página de contenido
   */
  static async duplicatePage(req: AuthRequest, res: Response) {
    try {
      // Validar parámetro slug
      const validationResult = slugParamValidation.safeParse(req.params);
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
      
      // Validar nuevo slug
      const newSlugValidationResult = slugParamValidation.safeParse({ slug: newSlug });
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
      const result = await ContentService.duplicatePage(slug, newSlug, newTitle, modifiedBy);
      
      if (!result.success) {
        const statusCode = result.message?.includes('no encontrada') ? 404 : 
                          result.message?.includes('Ya existe') ? 409 : 400;
        return res.status(statusCode).json(result);
      }
      
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Error en duplicatePage:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/content/admin/pages
   * Obtiene todas las páginas de contenido para administración con paginación y filtros
   */
  static async getAdminPages(req: AuthRequest, res: Response) {
    try {
      // Validar query parameters
      const validationResult = listContentPagesValidation.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: validationResult.error.errors.map(err => err.message)
        });
      }
      
      const { page, limit, isActive, search } = validationResult.data;
      
      // Para admin, usar el mismo método pero sin el parámetro adicional
      const result = await ContentService.getAllPages(page, limit, isActive, search);
      
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
    } catch (error: any) {
      console.error('Error en getAdminPages:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}