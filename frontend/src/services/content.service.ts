import { apiClient } from '@/lib/api-client';
import {
  IContentPage,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentPageResponse,
  ContentPagesListResponse,
  ContentPaginationParams,
  ContentPaginationResponse,
  DuplicatePageInput
} from '@/types/content.types';

export class ContentService {

  /**
   * Obtiene todas las páginas de contenido (público)
   */
  static async getAllPages(params?: ContentPaginationParams): Promise<ContentPaginationResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `/content/pages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<ContentPaginationResponse>(url);

      return response.data;
    } catch (error: any) {
      console.error('Error al obtener páginas de contenido:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener páginas de contenido'
      };
    }
  }

  /**
   * Obtiene una página de contenido por slug (público)
   */
  static async getPageBySlug(slug: string): Promise<ContentPageResponse> {
    try {
      const response = await apiClient.get<ContentPageResponse>(`/content/pages/${slug}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener página con slug ${slug}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener la página'
      };
    }
  }

  /**
   * Obtiene una página de contenido por slug (admin)
   */
  static async getPageBySlugAdmin(slug: string): Promise<ContentPageResponse> {
    try {
      const response = await apiClient.get<ContentPageResponse>(`/api/content/admin/pages/slug/${slug}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener página con slug ${slug} (admin):`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener la página'
      };
    }
  }

  /**
   * Obtiene una página de contenido por ID (admin)
   */
  static async getPageById(id: string): Promise<ContentPageResponse> {
    try {
      const response = await apiClient.get<ContentPageResponse>(`/api/content/admin/pages/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener página con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener la página'
      };
    }
  }

  /**
   * Crea una nueva página de contenido (admin)
   */
  static async createPage(pageData: CreateContentPageInput): Promise<ContentPageResponse> {
    try {
      const response = await apiClient.post<ContentPageResponse>('/api/content/admin/pages', pageData);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear página de contenido:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear la página'
      };
    }
  }

  /**
   * Actualiza una página de contenido existente (admin)
   */
  static async updatePage(slug: string, pageData: UpdateContentPageInput): Promise<ContentPageResponse> {
    try {
      const response = await apiClient.put<ContentPageResponse>(`/api/content/admin/pages/${slug}`, pageData);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar página con slug ${slug}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar la página'
      };
    }
  }

  /**
   * Elimina una página de contenido (admin)
   */
  static async deletePage(slug: string): Promise<ContentPageResponse> {
    try {
      const response = await apiClient.delete<ContentPageResponse>(`/api/content/admin/pages/${slug}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al eliminar página con slug ${slug}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar la página'
      };
    }
  }

  /**
   * Duplica una página de contenido (admin)
   */
  static async duplicatePage(slug: string, duplicateData: DuplicatePageInput): Promise<ContentPageResponse> {
    try {
      const response = await apiClient.post<ContentPageResponse>(
        `/api/content/admin/pages/${slug}/duplicate`,
        duplicateData
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error al duplicar página con slug ${slug}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al duplicar la página'
      };
    }
  }

  /**
   * Obtiene todas las páginas para administración con paginación
   */
  /**
   * Obtiene todas las páginas de contenido para administración con paginación y filtros
   */
  static async getAdminPages(params?: ContentPaginationParams): Promise<ContentPaginationResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `api/content/admin/pages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<ContentPaginationResponse>(url);

      return response.data;
    } catch (error: any) {
      console.error('Error al obtener páginas de contenido para admin:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener páginas de contenido'
      };
    }
  }
}