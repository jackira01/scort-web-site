import { Types } from 'mongoose';
import { NewsView, INewsView } from './news-view.model';
import { News, INews } from './news.model';

export class NewsViewService {
  /**
   * Marcar una noticia como vista por un usuario
   */
  static async markNewsAsViewed(userId: string, newsId: string): Promise<INewsView> {
    try {
      // Verificar que la noticia existe y está publicada
      const news = await News.findOne({ _id: newsId, published: true });
      if (!news) {
        throw new Error('Noticia no encontrada o no publicada');
      }

      // Crear o actualizar la visualización
      const newsView = await NewsView.findOneAndUpdate(
        { user: new Types.ObjectId(userId), news: new Types.ObjectId(newsId) },
        { 
          user: new Types.ObjectId(userId), 
          news: new Types.ObjectId(newsId),
          viewedAt: new Date()
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      ).populate('news', 'title createdAt imageUrl');

      return newsView;
    } catch (error: any) {
      throw new Error(`Error al marcar noticia como vista: ${error.message}`);
    }
  }

  /**
   * Obtener noticias no leídas por un usuario
   */
  static async getUnreadNews(userId: string): Promise<INews[]> {
    try {
      // Obtener IDs de noticias ya vistas por el usuario
      const viewedNewsIds = await NewsView.find({ user: new Types.ObjectId(userId) })
        .distinct('news');

      // Obtener noticias publicadas que no han sido vistas
      const unreadNews = await News.find({
        published: true,
        _id: { $nin: viewedNewsIds }
      })
        .sort({ createdAt: -1 })
        .lean();

      return unreadNews;
    } catch (error: any) {
      throw new Error(`Error al obtener noticias no leídas: ${error.message}`);
    }
  }

  /**
   * Obtener la última noticia no leída por un usuario
   */
  static async getLatestUnreadNews(userId: string): Promise<INews | null> {
    try {
      // Obtener IDs de noticias ya vistas por el usuario
      const viewedNewsIds = await NewsView.find({ user: new Types.ObjectId(userId) })
        .distinct('news');

      // Obtener la noticia más reciente que no ha sido vista
      const latestUnreadNews = await News.findOne({
        published: true,
        _id: { $nin: viewedNewsIds }
      })
        .sort({ createdAt: -1 })
        .lean();

      return latestUnreadNews;
    } catch (error: any) {
      throw new Error(`Error al obtener la última noticia no leída: ${error.message}`);
    }
  }

  /**
   * Verificar si un usuario ha visto una noticia específica
   */
  static async hasUserViewedNews(userId: string, newsId: string): Promise<boolean> {
    try {
      const newsView = await NewsView.findOne({
        user: new Types.ObjectId(userId),
        news: new Types.ObjectId(newsId)
      });

      return !!newsView;
    } catch (error: any) {
      throw new Error(`Error al verificar visualización de noticia: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de visualizaciones de una noticia
   */
  static async getNewsViewStats(newsId: string): Promise<{
    totalViews: number;
    uniqueViewers: number;
    viewsToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalViews, viewsToday] = await Promise.all([
        NewsView.countDocuments({ news: new Types.ObjectId(newsId) }),
        NewsView.countDocuments({ 
          news: new Types.ObjectId(newsId),
          viewedAt: { $gte: today }
        })
      ]);

      return {
        totalViews,
        uniqueViewers: totalViews, // En este caso es lo mismo porque cada usuario solo puede ver una vez
        viewsToday
      };
    } catch (error: any) {
      throw new Error(`Error al obtener estadísticas de visualizaciones: ${error.message}`);
    }
  }

  /**
   * Obtener el historial de visualizaciones de un usuario
   */
  static async getUserViewHistory(userId: string, limit: number = 10): Promise<INewsView[]> {
    try {
      const viewHistory = await NewsView.find({ user: new Types.ObjectId(userId) })
        .populate('news', 'title createdAt imageUrl')
        .sort({ viewedAt: -1 })
        .limit(limit)
        .lean();

      return viewHistory;
    } catch (error: any) {
      throw new Error(`Error al obtener historial de visualizaciones: ${error.message}`);
    }
  }
}

export default NewsViewService;