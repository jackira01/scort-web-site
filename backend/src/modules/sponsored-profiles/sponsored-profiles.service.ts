import { ProfileModel } from '../profile/profile.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { AttributeGroupModel as AttributeGroup } from '../attribute-group/attribute-group.model';
import { sortProfiles } from '../visibility/visibility.service';
import { extractCategoryFromFeatures } from '../profile/profile.service';
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

    const now = new Date();

    // Construir filtros base para perfiles válidos
    const baseFilters: any = {
      isActive: true,
      visible: true,
      isDeleted: false,
      planAssignment: { $exists: true, $ne: null }, // CRÍTICO: Debe tener planAssignment
      'planAssignment.expiresAt': { $gt: now }, // Plan no expirado
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
      baseFilters['verification.verificationStatus'] = 'check';
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

    // Obtener planes con showInSponsored: true
    const sponsoredPlans = await PlanDefinitionModel.find({
      'features.showInSponsored': true,
      active: true
    }).select('_id code name features includedUpgrades level');

    const sponsoredPlanIds = sponsoredPlans.map(plan => plan._id);

    if (sponsoredPlanIds.length === 0) {
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

    // Construir proyección de campos
    const requiredFields = ['planAssignment', 'upgrades', 'lastShownAt', 'createdAt', 'name', 'features'];
    let projection: Record<string, number> = {};

    if (fields.length > 0) {
      const allFields = Array.from(new Set([...fields, ...requiredFields]));
      projection = allFields.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {} as Record<string, number>);
    }

    // Obtener TODOS los perfiles que cumplen los filtros (sin paginación aún)
    // para poder aplicar sortProfiles al conjunto completo
    const [allProfiles, totalCount] = await Promise.all([
      ProfileModel
        .find(finalFilters, projection)
        .populate('user', 'email username')
        .populate('planAssignment.planId', 'code name level features includedUpgrades')
        .populate('verification', 'status verifiedAt')
        .populate('features.group_id', 'key name')
        .lean(),
      ProfileModel.countDocuments(finalFilters)
    ]);

    // Aplicar ordenamiento usando el motor de visibilidad
    // Pasamos 'SPONSORED' como contexto para diferenciar logs
    const sortedProfiles = await sortProfiles(allProfiles as unknown as IProfile[], now, 'SPONSORED');

    // Aplicar paginación DESPUÉS del ordenamiento
    const paginatedProfiles = sortedProfiles.slice(skip, skip + limitNum);

    // Agregar propiedad hasDestacadoUpgrade a cada perfil
    const profilesWithUpgradeInfo = paginatedProfiles.map((profile) => {
      // Verificar si el plan incluye DESTACADO por defecto
      const planAssignment: any = profile.planAssignment || {};
      const planIncludesDestacado = planAssignment.planId?.includedUpgrades?.includes('DESTACADO') || false;

      // 1. Normalizar array de upgrades (Source of Truth)
      let upgrades = profile.upgrades || [];

      // Verificar si ya existe un upgrade DESTACADO activo en la lista
      const hasPurchasedDestacado = upgrades.some(
        (upgrade) => {
          const isDestacado = upgrade.code === 'DESTACADO';
          const hasStartAt = !!upgrade.startAt;
          const hasEndAt = !!upgrade.endAt;
          const isActive = hasStartAt && hasEndAt &&
            new Date(upgrade.startAt) <= now &&
            new Date(upgrade.endAt) > now;

          return isDestacado && isActive;
        }
      );

      // Si el plan incluye el upgrade pero no está en la lista de upgrades (porque es implícito del plan),
      // lo agregamos virtualmente para que el array sea la fuente de verdad
      if (planIncludesDestacado && !hasPurchasedDestacado) {
        upgrades = [
          ...upgrades,
          {
            code: 'DESTACADO',
            startAt: planAssignment.startAt || profile.createdAt,
            endAt: planAssignment.expiresAt || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
            purchaseAt: planAssignment.startAt || profile.createdAt
          }
        ];
      }

      // 2. Derivar flags booleanos DESDE el array normalizado
      const hasDestacadoUpgrade = upgrades.some(
        (upgrade) => {
          const isDestacado = upgrade.code === 'DESTACADO';
          const hasStartAt = !!upgrade.startAt;
          const hasEndAt = !!upgrade.endAt;
          const isActive = hasStartAt && hasEndAt &&
            new Date(upgrade.startAt) <= now &&
            new Date(upgrade.endAt) > now;

          return isDestacado && isActive;
        }
      );

      // Extraer categoría
      const category = extractCategoryFromFeatures(profile.features);

      return {
        ...profile,
        upgrades,
        hasDestacadoUpgrade,
        category
      };
    });

    // Calcular paginación
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return {
      profiles: profilesWithUpgradeInfo as unknown as IProfile[],
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
    const now = new Date();

    // Filtros base para perfiles válidos
    const baseFilters = {
      isActive: true,
      visible: true,
      isDeleted: false,
      'planAssignment.expiresAt': { $gt: now },
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