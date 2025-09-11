import { News, INews } from './news.model';
import { FilterQuery, UpdateQuery } from 'mongoose';

export interface CreateNewsData {
  title: string;
  content: string[];
  published?: boolean;
}

export interface UpdateNewsData {
  title?: string;
  content?: string[];
  published?: boolean;
}

export interface NewsFilters {
  published?: boolean;
  search?: string;
  limit?: number;
  skip?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class NewsService {
  /**
   * Crear una nueva noticia
   */
  static async createNews(data: CreateNewsData): Promise<INews> {
    try {
      const news = new News({
        title: data.title,
        content: data.content,
        published: data.published ?? true
      });

      return await news.save();
    } catch (error: any) {
      throw new Error(`Error al crear la noticia: ${error.message}`);
    }
  }

  /**
   * Obtener noticias con filtros y paginación
   */
  static async getNews(filters: NewsFilters = {}): Promise<{
    news: INews[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        published,
        search,
        limit = 10,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Construir query de filtros
      const query: FilterQuery<INews> = {};

      if (published !== undefined) {
        query.published = published;
      }

      if (search) {
        query.$text = { $search: search };
      }

      // Construir sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Ejecutar consultas
      const [news, total] = await Promise.all([
        News.find(query)
          .sort(sort)
          .limit(limit)
          .skip(skip)
          .lean(),
        News.countDocuments(query)
      ]);

      const page = Math.floor(skip / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        news,
        total,
        page,
        totalPages
      };
    } catch (error: any) {
      throw new Error(`Error al obtener noticias: ${error.message}`);
    }
  }

  /**
   * Obtener noticia por ID
   */
  static async getNewsById(id: string): Promise<INews | null> {
    try {
      return await News.findById(id);
    } catch (error: any) {
      throw new Error(`Error al obtener la noticia: ${error.message}`);
    }
  }

  /**
   * Actualizar noticia
   */
  static async updateNews(id: string, data: UpdateNewsData): Promise<INews | null> {
    try {
      const updateData: UpdateQuery<INews> = {};

      if (data.title !== undefined) {
        updateData.title = data.title;
      }

      if (data.content !== undefined) {
        updateData.content = data.content;
      }

      if (data.published !== undefined) {
        updateData.published = data.published;
      }

      return await News.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error: any) {
      throw new Error(`Error al actualizar la noticia: ${error.message}`);
    }
  }

  /**
   * Alternar estado de publicación
   */
  static async toggleNewsStatus(id: string): Promise<INews | null> {
    try {
      const news = await News.findById(id);
      if (!news) {
        throw new Error('Noticia no encontrada');
      }

      news.published = !news.published;
      return await news.save();
    } catch (error: any) {
      throw new Error(`Error al cambiar estado de la noticia: ${error.message}`);
    }
  }

  /**
   * Eliminar noticia
   */
  static async deleteNews(id: string): Promise<boolean> {
    try {
      const result = await News.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new Error(`Error al eliminar la noticia: ${error.message}`);
    }
  }

  /**
   * Buscar noticias por término
   */
  static async searchNews(searchTerm: string, limit: number = 10): Promise<INews[]> {
    try {
      return await News.find(
        {
          $text: { $search: searchTerm },
          published: true
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();
    } catch (error: any) {
      throw new Error(`Error en la búsqueda de noticias: ${error.message}`);
    }
  }

  /**
   * Obtener noticias publicadas más recientes
   */
  static async getLatestNews(limit: number = 5): Promise<INews[]> {
    try {
      return await News.find({ published: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (error: any) {
      throw new Error(`Error al obtener las últimas noticias: ${error.message}`);
    }
  }
}

export default NewsService;