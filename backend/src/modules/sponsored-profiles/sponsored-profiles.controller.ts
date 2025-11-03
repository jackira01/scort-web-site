import { Request, Response } from 'express';
import * as service from './sponsored-profiles.service';
import type { SponsoredProfilesQuery } from './sponsored-profiles.service';

/**
 * GET /api/sponsored-profiles
 * Obtiene perfiles patrocinados que cumplen con todos los criterios de validación
 */
export const getSponsoredProfiles = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      fields,
      category,
      department,
      city,
      minPrice,
      maxPrice,
      identityVerified,
      hasVideo,
      documentVerified
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

    // Filtros adicionales
    if (category && typeof category === 'string') {
      query.category = category;
    }

    if (department || city) {
      query.location = {};
      if (department && typeof department === 'string') {
        query.location.department = department;
      }
      if (city && typeof city === 'string') {
        query.location.city = city;
      }
    }

    // Extraer features del body si existe (método POST) o del query
    const bodyFeatures = (req.body as any)?.features;
    if (bodyFeatures && typeof bodyFeatures === 'object') {
      query.features = bodyFeatures;
    }

    if (minPrice || maxPrice) {
      query.priceRange = {};
      if (minPrice) {
        const minPriceNum = parseFloat(minPrice as string);
        if (!isNaN(minPriceNum)) {
          query.priceRange.min = minPriceNum;
        }
      }
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice as string);
        if (!isNaN(maxPriceNum)) {
          query.priceRange.max = maxPriceNum;
        }
      }
    }

    if (identityVerified || hasVideo || documentVerified) {
      query.verification = {};
      if (identityVerified === 'true') {
        query.verification.identityVerified = true;
      }
      if (hasVideo === 'true') {
        query.verification.hasVideo = true;
      }
      if (documentVerified === 'true') {
        query.verification.documentVerified = true;
      }
    }

    // Obtener perfiles patrocinados
    const result = await service.getSponsoredProfiles(query);
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