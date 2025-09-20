import {
  News,
  NewsFilters,
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsPaginationParams
} from '../types/news.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

class NewsService {
  private baseUrl = `${API_BASE_URL}/api/news`;

  /**
   * Construir query string desde filtros
   */
  private buildQueryString(filters: NewsFilters & NewsPaginationParams): string {
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
   * Obtener headers de autenticación
   */
  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      // Agregar token de autenticación cuando esté disponible
      // 'Authorization': `Bearer ${token}`
    };
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Obtener noticias con filtros y paginación
   */
  async getNews(filters: NewsFilters & NewsPaginationParams = {}): Promise<{
    news: News[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryString = this.buildQueryString(filters);
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al obtener noticias');
      }

      return {
        news: result.data,
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        totalPages: result.pagination?.totalPages || 1
      };
    } catch (error: unknown) {
      let errorMessage = 'Error al obtener últimas noticias';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener noticia por ID
   */
  async getNewsById(id: string): Promise<News> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      return await this.handleResponse<News>(response);
    } catch (error: unknown) {
      let errorMessage = 'Error al obtener noticia';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener últimas noticias publicadas
   */
  async getLatestNews(limit: number = 5): Promise<News[]> {
    try {
      const response = await fetch(`${this.baseUrl}/latest?limit=${limit}`);
      return await this.handleResponse<News[]>(response);
    } catch (error: unknown) {
      let errorMessage = 'Error al obtener últimas noticias';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Buscar noticias
   */
  async searchNews(searchTerm: string, limit: number = 10): Promise<News[]> {
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      return await this.handleResponse<News[]>(response);
    } catch (error: unknown) {
      let errorMessage = 'Error al buscar noticias';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  // ===== MÉTODOS ADMINISTRATIVOS =====

  /**
   * Crear nueva noticia (solo admin)
   */
  async createNews(data: CreateNewsRequest): Promise<News> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<News>(response);
    } catch (error: unknown) {
      let errorMessage = 'Error al crear noticia';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Actualizar noticia (solo admin)
   */
  async updateNews(id: string, data: UpdateNewsRequest): Promise<News> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<News>(response);
    } catch (error: unknown) {
      let errorMessage = 'Error al actualizar noticia';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Alternar estado de publicación (solo admin)
   */
  async toggleNewsStatus(id: string): Promise<News> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle-status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse<News>(response);
    } catch (error: unknown) {
      let errorMessage = 'Error al alternar estado de noticia';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Eliminar noticia (solo admin)
   */
  async deleteNews(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Error ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.message || 'Error al eliminar noticia');
      }
    } catch (error: unknown) {
      let errorMessage = 'Error al eliminar noticia';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener todas las noticias para admin (incluye no publicadas)
   */
  async getAllNewsForAdmin(filters: NewsFilters & NewsPaginationParams = {}): Promise<{
    news: News[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryString = this.buildQueryString(filters);
      const url = queryString ? `${this.baseUrl}/admin/all?${queryString}` : `${this.baseUrl}/admin/all`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al obtener noticias para admin');
      }

      return {
        news: result.data,
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        totalPages: result.pagination?.totalPages || 1
      };
    } catch (error: unknown) {
      let errorMessage = 'Error al obtener noticias para admin';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtener noticia específica para admin
   */
  async getNewsForAdmin(id: string): Promise<News> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/${id}`, {
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse<News>(response);
    } catch (error: unknown) {
      let errorMessage = 'Error al obtener noticia para admin';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { message?: string } } };
        errorMessage = responseError.response?.data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  // ===== MÉTODOS UTILITARIOS =====

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Validar contenido de noticia
   */
  validateNewsContent(content: string[]): boolean {
    return Array.isArray(content) &&
      content.length > 0 &&
      content.every(item => typeof item === 'string' && item.trim().length > 0);
  }

  /**
   * Limpiar contenido de noticia
   */
  sanitizeNewsContent(content: string[]): string[] {
    return content
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim());
  }
}

export const newsService = new NewsService();
export default newsService;