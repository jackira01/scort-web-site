import { Request, Response } from 'express';
import { runManualCleanup, getCleanupCronStatus } from './cleanup.cron';
import { getProfileVisibilityStats } from './cleanup.service';

/**
 * Controlador para ejecutar limpieza manual
 * POST /api/cleanup/run
 */
export const runCleanupController = async (req: Request, res: Response): Promise<void> => {
  try {
    await runManualCleanup();
    
    res.status(200).json({
      success: true,
      message: 'Manual cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error in runCleanupController:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Controlador para obtener estado del cron job
 * GET /api/cleanup/status
 */
export const getCleanupStatusController = (req: Request, res: Response): void => {
  try {
    const status = getCleanupCronStatus();
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in getCleanupStatusController:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Controlador para obtener estadísticas de visibilidad
 * GET /api/cleanup/stats
 */
export const getVisibilityStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getProfileVisibilityStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getVisibilityStatsController:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};