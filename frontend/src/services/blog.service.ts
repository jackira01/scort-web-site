import { Blog, BlogFilters, CreateBlogData, UpdateBlogData, BlogsResponse } from '../hooks/use-blogs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

class BlogService {
  private baseUrl = `${API_BASE_URL}/api/blogs`;

  /**
   * Construir query string desde filtros
   */
  private buildQueryString(filters: BlogFilters): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }

  /**
   * Manejar respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.message || 'Error en la solicitud');
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Error en la respuesta del servidor');
    }

    return data.data;
  }

  /**
   * Obtener headers para requests autenticados
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken'); // Ajustar según tu implementación de auth
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS (sin autenticación)
  // ============================================================================

  /**
   * Obtener todos los blogs con filtros
   */
  async getBlogs(filters: BlogFilters = {}): Promise<BlogsResponse> {
    try {
      const queryString = this.buildQueryString(filters);
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener blogs');
      }

      return {
        blogs: data.data,
        total: data.pagination?.total || 0,
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        limit: data.pagination?.limit || 10,
      };
    } catch (error: any) {
      console.error('Error en getBlogs:', error);
      throw new Error(error.message || 'Error al obtener los blogs');
    }
  }

  /**
   * Obtener un blog por ID o slug
   */
  async getBlogByIdOrSlug(identifier: string): Promise<Blog> {
    try {
      const response = await fetch(`${this.baseUrl}/${identifier}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse<Blog>(response);
    } catch (error: any) {
      console.error('Error en getBlogByIdOrSlug:', error);
      throw new Error(error.message || 'Error al obtener el blog');
    }
  }

  /**
   * Obtener blogs relacionados
   */
  async getRelatedBlogs(blogId: string, limit: number = 3): Promise<Blog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${blogId}/related?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse<Blog[]>(response);
    } catch (error: any) {
      console.error('Error en getRelatedBlogs:', error);
      throw new Error(error.message || 'Error al obtener blogs relacionados');
    }
  }

  /**
   * Buscar blogs por término
   */
  async searchBlogs(searchTerm: string, limit: number = 10): Promise<Blog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/${encodeURIComponent(searchTerm)}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse<Blog[]>(response);
    } catch (error: any) {
      console.error('Error en searchBlogs:', error);
      throw new Error(error.message || 'Error al buscar blogs');
    }
  }

  // ============================================================================
  // MÉTODOS ADMINISTRATIVOS (requieren autenticación)
  // ============================================================================

  /**
   * Crear un nuevo blog
   */
  async createBlog(data: CreateBlogData): Promise<Blog> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return await this.handleResponse<Blog>(response);
    } catch (error: any) {
      console.error('Error en createBlog:', error);
      throw new Error(error.message || 'Error al crear el blog');
    }
  }

  /**
   * Actualizar un blog
   */
  async updateBlog(id: string, data: UpdateBlogData): Promise<Blog> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return await this.handleResponse<Blog>(response);
    } catch (error: any) {
      console.error('Error en updateBlog:', error);
      throw new Error(error.message || 'Error al actualizar el blog');
    }
  }

  /**
   * Alternar estado publicado/no publicado
   */
  async toggleBlogStatus(id: string): Promise<Blog> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<Blog>(response);
    } catch (error: any) {
      console.error('Error en toggleBlogStatus:', error);
      throw new Error(error.message || 'Error al cambiar el estado del blog');
    }
  }

  /**
   * Eliminar un blog
   */
  async deleteBlog(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      await this.handleResponse<void>(response);
    } catch (error: any) {
      console.error('Error en deleteBlog:', error);
      throw new Error(error.message || 'Error al eliminar el blog');
    }
  }

  // ============================================================================
  // MÉTODOS ADMINISTRATIVOS ADICIONALES
  // ============================================================================

  /**
   * Obtener todos los blogs (incluidos no publicados) para administración
   */
  async getAllBlogsForAdmin(filters: BlogFilters = {}): Promise<BlogsResponse> {
    try {
      const queryString = this.buildQueryString(filters);
      const url = queryString
        ? `${this.baseUrl}/admin/all?${queryString}`
        : `${this.baseUrl}/admin/all`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener blogs para administración');
      }

      return {
        blogs: data.data,
        total: data.pagination?.total || 0,
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        limit: data.pagination?.limit || 10,
      };
    } catch (error: any) {
      console.error('Error en getAllBlogsForAdmin:', error);
      throw new Error(error.message || 'Error al obtener blogs para administración');
    }
  }

  /**
   * Obtener un blog por ID o slug (incluidos no publicados) para administración
   */
  async getBlogForAdmin(identifier: string): Promise<Blog> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/${identifier}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<Blog>(response);
    } catch (error: any) {
      console.error('Error en getBlogForAdmin:', error);
      throw new Error(error.message || 'Error al obtener el blog para administración');
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Generar slug desde título
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Remover guiones duplicados
      .trim();
  }

  /**
   * Validar formato de imagen
   */
  isValidImageUrl(url: string): boolean {
    if (!url) return true; // Campo opcional
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Extraer texto plano del contenido JSON (para previews)
   */
  extractTextFromContent(content: any): string {
    if (!content || typeof content !== 'object') return '';

    // Implementar según el formato del Rich Text Editor usado
    // Ejemplo para Editor.js:
    if (content.blocks && Array.isArray(content.blocks)) {
      return content.blocks
        .filter((block: any) => block.type === 'paragraph' || block.type === 'header')
        .map((block: any) => block.data?.text || '')
        .join(' ')
        .substring(0, 200) + '...';
    }

    // Fallback genérico
    return JSON.stringify(content).substring(0, 200) + '...';
  }
}

export const blogService = new BlogService();
export default blogService;