import { ContentPageModel } from './content.model';
import {
  IContentPage,
  ContentPageResponse,
  ContentPagesListResponse
} from './content.types';
import {
  ZodCreateContentPageInput,
  ZodUpdateContentPageInput
} from './content.validation';
import mongoose from 'mongoose';

export class ContentService {

  /**
   * Obtiene todas las páginas de contenido con paginación y filtros
   */
  static async getAllPages(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
    search?: string
  ): Promise<ContentPagesListResponse> {
    try {
      const skip = (page - 1) * limit;

      // Construir filtros
      const filters: any = {};
      if (isActive !== undefined) {
        filters.isActive = isActive;
      }
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ];
      }

      // Ejecutar consultas en paralelo
      const [pages, total] = await Promise.all([
        ContentPageModel
          .find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ContentPageModel.countDocuments(filters)
      ]);

      return {
        success: true,
        data: pages as IContentPage[],
        total
      };
    } catch (error: any) {
      console.error('Error al obtener páginas:', error);
      return {
        success: false,
        message: 'Error interno del servidor al obtener las páginas'
      };
    }
  }

  /**
   * Obtiene una página de contenido por slug
   */
  static async getPageBySlug(slug: string): Promise<ContentPageResponse> {
    try {
      const page = await ContentPageModel
        .findOne({ slug, isActive: true })
        .lean();

      if (!page) {
        return {
          success: false,
          message: 'Página no encontrada'
        };
      }

      return {
        success: true,
        data: page as IContentPage
      };
    } catch (error: any) {
      console.error('Error al obtener página por slug:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Obtiene una página de contenido por slug (para admin)
   */
  static async getPageBySlugAdmin(slug: string): Promise<ContentPageResponse> {
    try {
      const page = await ContentPageModel
        .findOne({ slug })
        .lean();

      if (!page) {
        return {
          success: false,
          message: 'Página no encontrada'
        };
      }

      return {
        success: true,
        data: page as IContentPage
      };
    } catch (error: any) {
      console.error('Error al obtener página por slug (admin):', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Obtiene una página de contenido por ID (para admin)
   */
  static async getPageById(id: string): Promise<ContentPageResponse> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return {
          success: false,
          message: 'ID de página inválido'
        };
      }

      const page = await ContentPageModel
        .findById(id)
        .lean();

      if (!page) {
        return {
          success: false,
          message: 'Página no encontrada'
        };
      }

      return {
        success: true,
        data: page as IContentPage
      };
    } catch (error: any) {
      console.error('Error al obtener página por ID:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Crea una nueva página de contenido
   */
  static async createPage(data: ZodCreateContentPageInput): Promise<ContentPageResponse> {
    try {
      // Verificar que el slug no existe
      const existingPage = await ContentPageModel.findOne({ slug: data.slug });
      if (existingPage) {
        return {
          success: false,
          message: 'Ya existe una página con este slug'
        };
      }

      // Crear la página
      const newPage = new ContentPageModel(data);

      // Validar estructura
      const isValid = newPage.validateStructure();
      if (!isValid) {
        return {
          success: false,
          message: 'La estructura de la página no es válida'
        };
      }

      await newPage.save();

      // Obtener la página creada
      const createdPage = await ContentPageModel
        .findById(newPage._id)
        .lean();

      return {
        success: true,
        data: createdPage as IContentPage,
        message: 'Página creada exitosamente'
      };
    } catch (error: any) {
      console.error('Error al crear página:', error);

      if (error.code === 11000) {
        return {
          success: false,
          message: 'Ya existe una página con este slug'
        };
      }

      return {
        success: false,
        message: 'Error interno del servidor al crear la página'
      };
    }
  }

  /**
   * Actualiza una página de contenido existente
   */
  static async updatePage(slug: string, data: ZodUpdateContentPageInput): Promise<ContentPageResponse> {
    try {
      // Buscar la página existente
      const existingPage = await ContentPageModel.findOne({ slug });
      if (!existingPage) {
        return {
          success: false,
          message: 'Página no encontrada'
        };
      }

      // Actualizar campos
      if (data.title !== undefined) existingPage.title = data.title;
      if (data.sections !== undefined) existingPage.sections = data.sections;
      if (data.isActive !== undefined) existingPage.isActive = data.isActive;

      // Convertir modifiedBy a ObjectId si es string
      if (typeof data.modifiedBy === 'string') {
        existingPage.modifiedBy = new mongoose.Types.ObjectId(data.modifiedBy);
      } else {
        existingPage.modifiedBy = data.modifiedBy ?? existingPage.modifiedBy;
      }

      // Validar estructura si se actualizaron las secciones
      if (data.sections !== undefined) {
        const isValid = existingPage.validateStructure();
        if (!isValid) {
          return {
            success: false,
            message: 'La estructura de la página no es válida'
          };
        }
      }

      await existingPage.save();

      // Obtener la página actualizada
      const updatedPage = await ContentPageModel
        .findById(existingPage._id)
        .lean();

      return {
        success: true,
        data: updatedPage as IContentPage,
        message: 'Página actualizada exitosamente'
      };
    } catch (error: any) {
      console.error('Error al actualizar página:', error);
      return {
        success: false,
        message: 'Error interno del servidor al actualizar la página'
      };
    }
  }

  /**
   * Elimina una página de contenido (soft delete)
   */
  static async deletePage(slug: string, modifiedBy: string): Promise<ContentPageResponse> {
    try {
      const page = await ContentPageModel.findOne({ slug });
      if (!page) {
        return {
          success: false,
          message: 'Página no encontrada'
        };
      }

      // Soft delete - marcar como inactiva
      page.isActive = false;
      page.modifiedBy = new mongoose.Types.ObjectId(modifiedBy);
      await page.save();

      return {
        success: true,
        message: 'Página eliminada exitosamente'
      };
    } catch (error: any) {
      console.error('Error al eliminar página:', error);
      return {
        success: false,
        message: 'Error interno del servidor al eliminar la página'
      };
    }
  }

  /**
   * Duplica una página de contenido con un nuevo slug
   */
  static async duplicatePage(
    originalSlug: string,
    newSlug: string,
    newTitle: string,
    modifiedBy: string
  ): Promise<ContentPageResponse> {
    try {
      // Buscar página original
      const originalPage = await ContentPageModel.findOne({ slug: originalSlug });
      if (!originalPage) {
        return {
          success: false,
          message: 'Página original no encontrada'
        };
      }

      // Verificar que el nuevo slug no existe
      const existingPage = await ContentPageModel.findOne({ slug: newSlug });
      if (existingPage) {
        return {
          success: false,
          message: 'Ya existe una página con el nuevo slug'
        };
      }

      // Crear nueva página duplicada
      const duplicatedPage = new ContentPageModel({
        slug: newSlug,
        title: newTitle,
        sections: originalPage.sections,
        modifiedBy,
        isActive: true
      });

      await duplicatedPage.save();

      // Obtener la página duplicada
      const createdPage = await ContentPageModel
        .findById(duplicatedPage._id)
        .lean();

      return {
        success: true,
        data: createdPage as IContentPage,
        message: 'Página duplicada exitosamente'
      };
    } catch (error: any) {
      console.error('Error al duplicar página:', error);
      return {
        success: false,
        message: 'Error interno del servidor al duplicar la página'
      };
    }
  }
}