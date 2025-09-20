import { Request, Response } from 'express';
import * as service from './sponsored-profiles.service';
import type { SponsoredProfilesQuery } from './sponsored-profiles.service';

/**
 * GET /api/sponsored-profiles
 * Obtiene perfiles patrocinados que cumplen con todos los criterios de validación
 */
export const getSponsoredProfiles = async (req: Request, res: Response) => {
  try {
    console.log('🚀 [DEBUG] Controller getSponsoredProfiles - Request recibido');
    console.log('🚀 [DEBUG] Query params:', req.query);
    console.log('🚀 [DEBUG] Headers:', req.headers);

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      fields
    } = req.query;

    // Construir query con validación de tipos
    const query: SponsoredProfilesQuery = {};

    if (page) {
      const pageNum = parseInt(page as string, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        query.page = pageNum;
      }
    }

    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query.limit = Math.min(limitNum, 100); // Máximo 100 por página
      }
    }

    if (sortBy && typeof sortBy === 'string') {
      const validSortFields = ['createdAt', 'updatedAt', 'name', 'lastShownAt'];
      if (validSortFields.includes(sortBy)) {
        query.sortBy = sortBy as any;
      }
    }

    if (sortOrder && typeof sortOrder === 'string') {
      if (['asc', 'desc'].includes(sortOrder)) {
        query.sortOrder = sortOrder as 'asc' | 'desc';
      }
    }

    if (fields && typeof fields === 'string') {
      query.fields = fields.split(',').map(field => field.trim()).filter(Boolean);
    }

    console.log('🚀 [DEBUG] Service query construido:', query);

    // Obtener perfiles patrocinados
    const result = await service.getSponsoredProfiles(query);

    console.log('🚀 [DEBUG] Resultado del servicio:', {
      profilesCount: result.profiles.length,
      totalProfiles: result.pagination.totalProfiles,
      currentPage: result.pagination.currentPage
    });

    res.status(200).json({
      success: true,
      data: result.profiles,
      pagination: result.pagination,
      message: `Se encontraron ${result.pagination.totalProfiles} perfiles patrocinados`
    });

  } catch (error) {
    console.error('❌ [ERROR] Error en getSponsoredProfiles controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener perfiles patrocinados',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * GET /api/sponsored-profiles/count
 * Obtiene el conteo total de perfiles patrocinados válidos
 */
export const getSponsoredProfilesCount = async (req: Request, res: Response) => {
  try {
    const count = await service.getSponsoredProfilesCount();

    res.status(200).json({
      success: true,
      data: {
        totalCount: count
      },
      message: `Total de perfiles patrocinados: ${count}`
    });

  } catch (error) {
    console.error('Error en getSponsoredProfilesCount controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al contar perfiles patrocinados',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * GET /api/sponsored-profiles/check/:profileId
 * Verifica si un perfil específico es elegible para aparecer en la sección patrocinada
 */
export const checkProfileSponsored = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: 'ID de perfil requerido'
      });
    }

    const isSponsored = await service.isProfileSponsored(profileId);

    res.status(200).json({
      success: true,
      data: {
        profileId,
        isSponsored
      },
      message: isSponsored 
        ? 'El perfil es elegible para aparecer en la sección patrocinada'
        : 'El perfil no cumple los criterios para aparecer en la sección patrocinada'
    });

  } catch (error) {
    console.error('Error en checkProfileSponsored controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al verificar perfil patrocinado',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};