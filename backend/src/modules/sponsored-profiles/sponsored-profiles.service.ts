import { ProfileModel } from '../profile/profile.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { AttributeGroupModel as AttributeGroup } from '../attribute-group/attribute-group.model';
import type { IProfile } from '../profile/profile.types';

export interface SponsoredProfilesQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'lastShownAt';
  sortOrder?: 'asc' | 'desc';
  fields?: string[];
  // Filtros adicionales para compatibilidad con filtros de perfiles principales
  category?: string;
  location?: {
    department?: string;
    city?: string;
  };
  features?: Record<string, string | string[]>;
  priceRange?: {
    min?: number;
    max?: number;
  };
  verification?: {
    identityVerified?: boolean;
    hasVideo?: boolean;
    documentVerified?: boolean;
  };
}

export interface SponsoredProfilesResponse {
  profiles: IProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Obtiene perfiles patrocinados que cumplen con todos los criterios:
 * - Estado activo (isActive: true)
 * - Visible (visible: true)
 * - No eliminado (isDeleted: false)
 * - Plan con showInSponsored: true
 * - Plan no expirado
 * - Filtros adicionales opcionales (categoría, ubicación, características, etc.)
 */
export const getSponsoredProfiles = async (
  query: SponsoredProfilesQuery = {}
): Promise<SponsoredProfilesResponse> => {
  try {

    const {
      page = 1,
      limit = 20,
      sortBy = 'lastShownAt',
      sortOrder = 'asc',
      fields = [],
      category,
      location,
      features = {},
      priceRange,
      verification
    } = query;

    // Validar parámetros
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(Math.max(1, limit), 100); // Máximo 100 perfiles por página
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros base para perfiles válidos
    const baseFilters: any = {
      isActive: true,
      visible: true,
      isDeleted: false,
      'planAssignment.expiresAt': { $gt: new Date() }, // Plan no expirado
      'planAssignment.planId': { $exists: true, $ne: null } // Debe tener plan asignado
    };

    // Aplicar filtro de categoría
    if (category) {
      const categoryFeatures = await AttributeGroup.find({
        key: 'category'
      });
      
      if (categoryFeatures.length > 0) {
        const categoryGroupId = categoryFeatures[0]._id;
        const normalizedCategory = category.toLowerCase().trim();
        
        baseFilters['features'] = {
          $elemMatch: {
            group_id: categoryGroupId,
            'value.key': normalizedCategory
          }
        };
      }
    }

    // Aplicar filtros de ubicación
    if (location?.department) {
      baseFilters['location.department.value'] = location.department;
    }
    if (location?.city) {
      baseFilters['location.city.value'] = location.city;
    }

    // Aplicar filtros de características adicionales
    const featureConditions: any[] = [];
    const otherFeatures = Object.entries(features).filter(([key]) => key !== 'ageRange');
    
    if (otherFeatures.length > 0) {
      const groupKeys = otherFeatures.map(([key]) => key);
      const attributeGroups = await AttributeGroup.find({
        key: { $in: groupKeys }
      });

      const groupKeyToId = new Map();
      attributeGroups.forEach((group) => {
        groupKeyToId.set(group.key, group._id);
      });

      for (const [groupKey, value] of otherFeatures) {
        const groupId = groupKeyToId.get(groupKey);
        if (!groupId) continue;

        if (Array.isArray(value)) {
          const normalizedValues = value.map((v) => v.toLowerCase().trim());
          featureConditions.push({
            features: {
              $elemMatch: {
                group_id: groupId,
                'value.key': { $in: normalizedValues }
              }
            }
          });
        } else {
          const normalizedValue = (value as string).toLowerCase().trim();
          featureConditions.push({
            features: {
              $elemMatch: {
                group_id: groupId,
                'value.key': normalizedValue
              }
            }
          });
        }
      }
    }

    // Aplicar filtro de rango de edad si existe
    if (features.ageRange) {
      const ageGroupData = await AttributeGroup.findOne({ key: 'age' });
      if (ageGroupData) {
        featureConditions.push({
          features: {
            $elemMatch: {
              group_id: ageGroupData._id,
              'value.key': { $in: Array.isArray(features.ageRange) ? features.ageRange : [features.ageRange] }
            }
          }
        });
      }
    }

    // Aplicar condiciones de features si existen
    if (featureConditions.length > 0) {
      baseFilters.$and = featureConditions;
    }

    // Aplicar filtros de verificación
    if (verification?.identityVerified) {
      baseFilters['verification.verificationStatus'] = 'verified';
    }
    if (verification?.hasVideo) {
      baseFilters['media.videos'] = { $exists: true, $ne: [] };
    }
    if (verification?.documentVerified) {
      baseFilters['verification.identity.status'] = 'verified';
    }

    // Aplicar filtro de rango de precios
    if (priceRange) {
      const priceConditions: any = {};
      if (priceRange.min !== undefined) {
        priceConditions.$gte = priceRange.min;
      }
      if (priceRange.max !== undefined) {
        priceConditions.$lte = priceRange.max;
      }
      if (Object.keys(priceConditions).length > 0) {
        baseFilters['rates.hourly'] = priceConditions;
      }
    }

    const sponsoredPlans = await PlanDefinitionModel.find({
      'features.showInSponsored': true,
      active: true
    }).select('_id code name features');

    const sponsoredPlanIds = sponsoredPlans.map(plan => plan._id);

    if (sponsoredPlanIds.length === 0) {
      // No hay planes patrocinados activos
      return {
        profiles: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalProfiles: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }

    // Agregar filtro por planes patrocinados
    const finalFilters = {
      ...baseFilters,
      'planAssignment.planId': { $in: sponsoredPlanIds }
    };
    // Construir ordenamiento
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;


    // Construir proyección de campos si se especifica
    let projection = {};
    if (fields.length > 0) {
      projection = fields.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {} as Record<string, number>);
    }

    // Primero, verificar cuántos perfiles cumplen solo los filtros base
    const baseProfilesCount = await ProfileModel.countDocuments(baseFilters);
    // Verificar cuántos perfiles tienen planAssignment
    const profilesWithPlan = await ProfileModel.countDocuments({
      ...baseFilters,
      'planAssignment.planId': { $exists: true, $ne: null }
    });
    // Ejecutar consultas en paralelo
    const [profiles, totalCount] = await Promise.all([
      ProfileModel
        .find(finalFilters, projection)
        .populate('user', 'email username')
        .populate('planAssignment.planId', 'code name level features')
        .populate('verification', 'status verifiedAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProfileModel.countDocuments(finalFilters)
    ]);

    // Calcular paginación
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return {
      profiles: profiles as unknown as IProfile[],
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProfiles: totalCount,
        hasNextPage,
        hasPrevPage
      }
    };

  } catch (error) {
    console.error('Error en getSponsoredProfiles:', error);
    throw new Error('Error al obtener perfiles patrocinados');
  }
};

/**
 * Obtiene el conteo total de perfiles patrocinados válidos
 */
export const getSponsoredProfilesCount = async (): Promise<number> => {
  try {
    // Filtros base para perfiles válidos
    const baseFilters = {
      isActive: true,
      visible: true,
      isDeleted: false,
      'planAssignment.expiresAt': { $gt: new Date() },
      'planAssignment.planId': { $exists: true, $ne: null }
    };

    // Obtener planes patrocinados
    const sponsoredPlans = await PlanDefinitionModel.find({
      'features.showInSponsored': true,
      active: true
    }).select('_id');

    const sponsoredPlanIds = sponsoredPlans.map(plan => plan._id);

    if (sponsoredPlanIds.length === 0) {
      return 0;
    }

    // Contar perfiles que cumplen todos los criterios
    const count = await ProfileModel.countDocuments({
      ...baseFilters,
      'planAssignment.planId': { $in: sponsoredPlanIds }
    });

    return count;

  } catch (error) {
    console.error('Error en getSponsoredProfilesCount:', error);
    throw new Error('Error al contar perfiles patrocinados');
  }
};

/**
 * Verifica si un perfil específico es elegible para aparecer en la sección patrocinada
 */
export const isProfileSponsored = async (profileId: string): Promise<boolean> => {
  try {
    const profile = await ProfileModel.findById(profileId)
      .populate('planAssignment.planId', 'features active')
      .lean();

    if (!profile) {
      return false;
    }

    // Verificar criterios básicos
    if (!profile.isActive || !profile.visible || profile.isDeleted) {
      return false;
    }

    // Verificar plan
    if (!profile.planAssignment?.planId || !profile.planAssignment?.expiresAt) {
      return false;
    }

    // Verificar que el plan no haya expirado
    if (new Date(profile.planAssignment.expiresAt) <= new Date()) {
      return false;
    }

    // Verificar que el plan tenga showInSponsored: true
    const plan = profile.planAssignment.planId as any;
    return plan?.features?.showInSponsored === true && plan?.active === true;

  } catch (error) {
    console.error('Error en isProfileSponsored:', error);
    return false;
  }
};