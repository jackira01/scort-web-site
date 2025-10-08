import axios from '@/lib/axios';
import { News, CreateNewsRequest, NewsFormData } from '../types/news.types';

export interface NewsResponse {
  success: boolean;
  data: News[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleNewsResponse {
  success: boolean;
  data: News;
}

export interface NewsFilters {
  page?: number;
  limit?: number;
  published?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NewsViewResponse {
  success: boolean;
  message: string;
  data?: any;
}

class NewsService {
  private baseUrl = '/api/news';

  /**
   * Obtener todas las noticias con filtros opcionales
   */
  async getNews(filters: NewsFilters = {}): Promise<NewsResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtener una noticia por ID
   */
  async getNewsById(id: string): Promise<SingleNewsResponse> {
    const response = await axios.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Obtener las últimas noticias
   */
  async getLatestNews(limit: number = 5): Promise<NewsResponse> {
    const response = await axios.get(`${this.baseUrl}/latest?limit=${limit}`);
    return response.data;
  }

  /**
   * Buscar noticias por término
   */
  async searchNews(query: string): Promise<NewsResponse> {
    const response = await axios.get(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Crear una nueva noticia (Admin)
   */
  async createNews(newsData: CreateNewsRequest): Promise<SingleNewsResponse> {
    const response = await axios.post(this.baseUrl, newsData);
    return response.data;
  }

  /**
   * Actualizar una noticia (Admin)
   */
  async updateNews(id: string, newsData: Partial<NewsFormData>): Promise<SingleNewsResponse> {
    const response = await axios.put(`${this.baseUrl}/${id}`, newsData);
    return response.data;
  }

  /**
   * Alternar el estado de publicación de una noticia (Admin)
   */
  async toggleNewsStatus(id: string): Promise<SingleNewsResponse> {
    const response = await axios.patch(`${this.baseUrl}/${id}/toggle-status`);
    return response.data;
  }

  /**
   * Eliminar una noticia (Admin)
   */
  async deleteNews(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const newsService = new NewsService();
export default newsService;