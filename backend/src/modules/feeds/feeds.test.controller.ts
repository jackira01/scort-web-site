import { Request, Response } from 'express';
import { getHomeFeed, updateLastShownAt } from './feeds.service';
import { ProfileModel } from '../profile/profile.model';
import { getEffectiveLevel, getPriorityScore } from '../visibility/visibility.service';

/**
 * Endpoint de prueba para verificar el sistema de rotación justa
 * Simula múltiples llamadas al feed para ver cómo alternan los perfiles empatados
 */
export const testFairnessRotationController = async (req: Request, res: Response) => {
  try {
    const { iterations = 3, pageSize = 5 } = req.query;
    const now = new Date();
    
    // Obtener perfiles visibles para análisis
    const visibleProfiles = await ProfileModel.find({
      visible: true,
      'planAssignment.expiresAt': { $gt: now }
    }).limit(20).exec();

    // Analizar niveles y scores de los primeros perfiles
    const profileAnalysis = await Promise.all(
      visibleProfiles.slice(0, 10).map(async (profile) => {
        const effectiveLevel = await getEffectiveLevel(profile, now);
        const priorityScore = await getPriorityScore(profile, now);
        return {
          id: (profile._id as any).toString(),
          name: profile.name,
          effectiveLevel,
          priorityScore,
          lastShownAt: profile.lastShownAt || null
        };
      })
    );

    // Simular múltiples llamadas al feed
    const feedResults = [];
    for (let i = 0; i < Number(iterations); i++) {
      const feed = await getHomeFeed({ page: 1, pageSize: Number(pageSize) });
      
      feedResults.push({
        iteration: i + 1,
        timestamp: new Date(),
        profiles: feed.profiles.map(p => ({
          id: (p._id as any).toString(),
          name: p.name,
          lastShownAt: p.lastShownAt
        }))
      });
      
      // Esperar un poco entre iteraciones para ver el efecto
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      message: 'Prueba de rotación justa completada',
      profileAnalysis,
      feedResults,
      summary: {
        totalIterations: Number(iterations),
        profilesPerPage: Number(pageSize),
        note: 'Los perfiles con el mismo nivel y score deberían alternar su posición basándose en lastShownAt'
      }
    });
  } catch (error) {
    console.error('Error en prueba de fairness rotation:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Endpoint para resetear lastShownAt de todos los perfiles (útil para pruebas)
 */
export const resetLastShownAtController = async (req: Request, res: Response) => {
  try {
    const result = await ProfileModel.updateMany(
      {},
      { $unset: { lastShownAt: 1 } }
    ).exec();

    res.json({
      message: 'lastShownAt reseteado para todos los perfiles',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error al resetear lastShownAt:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Endpoint para obtener estadísticas detalladas de fairness
 */
export const getFairnessStatsController = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const visibleProfiles = await ProfileModel.find({
      visible: true,
      'planAssignment.expiresAt': { $gt: now }
    }).exec();

    // Agrupar por nivel y score para identificar empates
    const profilesWithMetadata = await Promise.all(
      visibleProfiles.map(async (profile) => {
        const effectiveLevel = await getEffectiveLevel(profile, now);
        const priorityScore = await getPriorityScore(profile, now);
        return {
          id: (profile._id as any).toString(),
          name: profile.name,
          effectiveLevel,
          priorityScore,
          lastShownAt: profile.lastShownAt,
          key: `${effectiveLevel}-${priorityScore}`
        };
      })
    );

    // Identificar grupos con empates
    const groupedProfiles = profilesWithMetadata.reduce((acc, profile) => {
      if (!acc[profile.key]) {
        acc[profile.key] = [];
      }
      acc[profile.key].push(profile);
      return acc;
    }, {} as Record<string, any[]>);

    const tiedGroups = Object.entries(groupedProfiles)
      .filter(([_, profiles]) => profiles.length > 1)
      .map(([key, profiles]) => ({
        key,
        count: profiles.length,
        profiles: profiles.map(p => ({
          id: p.id,
          name: p.name,
          lastShownAt: p.lastShownAt
        }))
      }));

    res.json({
      totalProfiles: visibleProfiles.length,
      tiedGroups,
      summary: {
        groupsWithTies: tiedGroups.length,
        totalTiedProfiles: tiedGroups.reduce((sum, group) => sum + group.count, 0)
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de fairness:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};