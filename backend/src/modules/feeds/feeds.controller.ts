import { Request, Response } from 'express';
import { getHomeFeed, getHomeFeedStats } from './feeds.service';

/**
 * Controlador para GET /api/feeds/home
 * Obtiene el feed principal con perfiles ordenados
 */
export const getHomeFeedController = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

    // Validar parámetros de paginación
    if (page < 1) {
      res.status(400).json({ error: 'Page must be greater than 0' });
      return;
    }

    if (pageSize < 1 || pageSize > 100) {
      res.status(400).json({ error: 'PageSize must be between 1 and 100' });
      return;
    }

    const feedData = await getHomeFeed({ page, pageSize });
    
    res.status(200).json({
      success: true,
      data: feedData
    });
  } catch (error) {
    console.error('Error in getHomeFeedController:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Controlador para GET /api/feeds/stats
 * Obtiene estadísticas del feed para debugging
 */
export const getFeedStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getHomeFeedStats();
    
    res.status(200).json({
      success: true,
      data: {
        profilesByLevel: stats,
        totalProfiles: Object.values(stats).reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (error) {
    console.error('Error in getFeedStatsController:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};