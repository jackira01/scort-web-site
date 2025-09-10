import { AttributeGroupModel as AttributeGroup } from '../attribute-group/attribute-group.model';
import { ProfileModel as Profile } from '../profile/profile.model';
import { sortProfiles } from '../visibility/visibility.service';
import { updateLastShownAt } from '../feeds/feeds.service';
import type {
  FilterOptions,
  FilterQuery,
  FilterResponse,
} from './filters.types';

/**
 * Obtiene todos los perfiles con filtros aplicados
 */
export const getFilteredProfiles = async (
  filters: FilterQuery,
): Promise<FilterResponse> => {
  try {
    const {
      category,
      location,
      priceRange,
      availability,
      isActive,
      isVerified,
      hasDestacadoUpgrade,
      hasVideos,
      page = 1,
      limit = 20,
      // sortBy = 'createdAt',
      // sortOrder = 'desc',
      fields,
    } = filters;

    let features = filters.features;

    // Construir query de MongoDB
    const query: any = {};

    // Alinear con home feed: solo perfiles visibles, no eliminados
    const now = new Date();
    query.visible = true;
    query.isDeleted = { $ne: true };
    // Temporalmente comentado para debugging - permitir perfiles sin plan activo
    // query['planAssignment.expiresAt'] = { $gt: now };

    // Solo agregar filtro isActive si está definido (para activación/desactivación)
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Filtro por categoría (se maneja como feature)
    console.log('🔍 DEBUG - Category filter:', category);
    if (category) {
      // Agregar la categoría a las features para procesarla junto con las demás
      if (!features) {
        features = {};
      }
      features.category = category;
      console.log('🔍 DEBUG - Features after adding category:', features);
    }

    // Filtro por ubicación
    if (location) {
      if (location.country) {
        query['location.country'] = location.country;
      }
      if (location.department) {
        query['location.department.value'] = location.department;
      }
      if (location.city) {
        query['location.city.value'] = location.city;
      }
    }

    // Filtro por verificación
    if (isVerified !== undefined) {
      query['user.isVerified'] = isVerified;
    }

    // Filtro por destacado (upgrade activo)
    if (hasDestacadoUpgrade !== undefined && hasDestacadoUpgrade) {
      const now = new Date();
      query.$or = [
        // Perfiles con upgrade DESTACADO/HIGHLIGHT activo
        {
          upgrades: {
            $elemMatch: {
              code: { $in: ['DESTACADO', 'HIGHLIGHT'] },
              startAt: { $lte: now },
              endAt: { $gt: now }
            }
          }
        },
        // Perfiles con plan DIAMANTE
        {
          'planAssignment.planCode': 'DIAMANTE'
        }
      ];
    }

    // Filtro por videos
    if (hasVideos !== undefined && hasVideos) {
      query['media.videos'] = { $exists: true, $not: { $size: 0 } };
    }

    // Filtro por características (features)
    console.log('🔍 DEBUG - Features object:', features);
    if (features && Object.keys(features).length > 0) {
      console.log('🔍 DEBUG - Processing features with keys:', Object.keys(features));
      const featureConditions: any[] = [];

      // Primero necesitamos obtener los IDs de los grupos por sus keys
      const groupKeys = Object.keys(features);
      console.log('🔍 DEBUG - Features keys:', groupKeys);
      const attributeGroups = await AttributeGroup.find({
        key: { $in: groupKeys },
      });
      console.log('🔍 DEBUG - Found attribute groups:', attributeGroups.map(g => ({ key: g.key, _id: g._id })));
      const groupKeyToId = new Map();
      attributeGroups.forEach((group) => {
        groupKeyToId.set(group.key, group._id);
      });
      console.log('🔍 DEBUG - Group key to ID map:', Array.from(groupKeyToId.entries()));

      for (const [groupKey, value] of Object.entries(features)) {
        const groupId = groupKeyToId.get(groupKey);
        console.log(`🔍 DEBUG - Processing feature: ${groupKey} = ${value}, groupId: ${groupId}`);
        if (!groupId) {
          console.log(`⚠️ WARNING - No groupId found for feature key: ${groupKey}`);
          continue;
        }

        if (Array.isArray(value)) {
          // Si es un array, buscar cualquiera de los valores (normalizados)
          const normalizedValues = value.map((v) => v.toLowerCase().trim());
          const condition = {
            features: {
              $elemMatch: {
                group_id: groupId,
                value: { $in: normalizedValues },
              },
            },
          };
          featureConditions.push(condition);
        } else {
          // Si es un valor único (normalizado) - buscar en el array de valores del perfil
          const normalizedValue = (value as string).toLowerCase().trim();
          const condition = {
            features: {
              $elemMatch: {
                group_id: groupId,
                value: { $in: [normalizedValue] },
              },
            },
          };
          featureConditions.push(condition);
        }
      }

      if (featureConditions.length > 0) {
        query.$and = featureConditions;
      }
    }

    // Filtro por rango de precios
    if (priceRange) {
      const priceConditions: any = {};
      if (priceRange.min !== undefined) {
        priceConditions.$gte = priceRange.min;
      }
      if (priceRange.max !== undefined) {
        priceConditions.$lte = priceRange.max;
      }

      if (Object.keys(priceConditions).length > 0) {
        query['rates.price'] = priceConditions;
      }
    }

    // Filtro por disponibilidad
    if (availability) {
      const availabilityConditions: any[] = [];

      if (availability.dayOfWeek) {
        const dayCondition = {
          availability: {
            $elemMatch: {
              dayOfWeek: availability.dayOfWeek,
            },
          },
        };
        availabilityConditions.push(dayCondition);
      }

      if (
        availability.timeSlot &&
        (availability.timeSlot.start || availability.timeSlot.end)
      ) {
        const timeCondition: any = {
          availability: {
            $elemMatch: {
              slots: {
                $elemMatch: {
                  ...(availability.timeSlot.start && {
                    start: { $lte: availability.timeSlot.start },
                  }),
                  ...(availability.timeSlot.end && {
                    end: { $gte: availability.timeSlot.end },
                  }),
                },
              },
            },
          },
        };
        availabilityConditions.push(timeCondition);
      }

      if (availabilityConditions.length > 0) {
        if (query.$and) {
          query.$and.push(...availabilityConditions);
        } else {
          query.$and = availabilityConditions;
        }
      }
    }

    // Configurar paginación
    const skip = (page - 1) * limit;

    // Determinar campos a seleccionar: asegurar campos requeridos por el motor de visibilidad
    const requiredFields = ['planAssignment', 'upgrades', 'lastShownAt', 'createdAt'];
    const finalFields = Array.isArray(fields) && fields.length > 0
      ? Array.from(new Set([...fields, ...requiredFields]))
      : ['_id', 'name', 'age', 'location', 'description', 'verification', 'media', 'isActive', ...requiredFields];
    const selectFields = finalFields.join(' ');

    const startTime = Date.now();

    // Debug: Log para verificar la query
    console.log('🔍 DEBUG getFilteredProfiles - Query inicial:', JSON.stringify(query, null, 2));

    // Usar agregación para filtrar perfiles con usuarios verificados (alineado con homeFeed)
    const aggregationPipeline: any[] = [
      {
        $match: query
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
      $match: {
        'userInfo.isVerified': true
      }
    },
      {
        $addFields: {
          user: { $arrayElemAt: ['$userInfo', 0] }
        }
      },
      {
        $project: {
          userInfo: 0
        }
      }
    ];

    console.log('🔍 DEBUG getFilteredProfiles - Pipeline de agregación:', JSON.stringify(aggregationPipeline, null, 2));

    // Agregar lookup para verification si es necesario
    if (!fields || fields.includes('verification')) {
      aggregationPipeline.push({
        $lookup: {
          from: 'profileverifications',
          localField: 'verification',
          foreignField: '_id',
          as: 'verification'
        }
      });
      aggregationPipeline.push({
        $addFields: {
          verification: { $arrayElemAt: ['$verification', 0] }
        }
      });
    }

    // Agregar lookup para features si es necesario
    if (fields && fields.includes('features')) {
      aggregationPipeline.push({
        $lookup: {
          from: 'attributegroups',
          localField: 'features.group_id',
          foreignField: '_id',
          as: 'featureGroups'
        }
      });
    }

    // Ejecutar agregación para obtener perfiles
    const [allProfiles, totalCountResult] = await Promise.all([
      Profile.aggregate(aggregationPipeline),
      Profile.aggregate([
        {
          $match: query
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $match: {
            'userInfo.isVerified': true
          }
        },
        { $count: 'total' }
      ])
    ]);

    console.log('🔍 DEBUG getFilteredProfiles - Perfiles encontrados:', allProfiles.length);
    console.log('🔍 DEBUG getFilteredProfiles - Total count result:', totalCountResult);

    const totalCount = totalCountResult[0]?.total || 0;

    // Ordenar perfiles usando el motor de visibilidad (nivel -> score -> lastShownAt -> createdAt)
    const sortedProfiles = await sortProfiles(allProfiles as any, now);

    // Aplicar paginación después del ordenamiento
    const paginatedProfiles = sortedProfiles.slice(skip, skip + limit);

    // Actualizar lastShownAt para los perfiles servidos (rotación justa)
    if (paginatedProfiles.length > 0) {
      await updateLastShownAt(paginatedProfiles.map(p => (p._id as any).toString()));
    }

    const executionTime = Date.now() - startTime;
    void executionTime; // mantener variable para debugging futuro si se requiere

    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const paginationInfo = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
      limit,
    };

    // Agregar información de verificación a los perfiles
    const profilesWithVerification = paginatedProfiles.map(profile => {
      // Calcular estado de verificación basado en verificationStatus
      let isVerified = false;
      let verificationLevel = 'pending';
      
      if (profile.verification) {
        const verifiedCount = Object.values(profile.verification).filter(status => status === 'verified').length;
        const totalFields = Object.keys(profile.verification).length;
        
        if (verifiedCount === totalFields && totalFields > 0) {
          isVerified = true;
          verificationLevel = 'verified';
        } else if (verifiedCount > 0) {
          verificationLevel = 'partial';
        }
      }
      
      return {
        ...profile,
        verification: {
          isVerified,
          verificationLevel
        }
      };
    });

    return {
      ...paginationInfo,
      profiles: profilesWithVerification,
    };
  } catch (error) {
    // Error in getFilteredProfiles
    throw error;
  }
};

/**
 * Obtiene las opciones disponibles para los filtros
 */
export const getFilterOptions = async (): Promise<FilterOptions> => {
  try {
    const [locations, attributeGroups, priceRange] = await Promise.all([
      // Obtener ubicaciones únicas
      Profile.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            countries: { $addToSet: '$location.country' },
            departments: { $addToSet: '$location.department' },
            cities: { $addToSet: '$location.city' },
          },
        },
      ]),

      // Obtener grupos de atributos
      AttributeGroup.find(),

      // Obtener rango de precios
      Profile.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $unwind: '$rates' },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$rates.price' },
            maxPrice: { $max: '$rates.price' },
          },
        },
      ]),
    ]);

    // Obtener categorías desde el grupo de atributos 'category'
    const categoryGroup = attributeGroups.find(
      (group) => group.key === 'category',
    );
    const categories = categoryGroup
      ? categoryGroup.variants
        .filter((variant: any) => variant.active)
        .map((variant: any) => ({
          label: variant.label || variant.value, // Compatibilidad con datos antiguos
          value: variant.value,
        }))
      : [];

    // Procesar features de attribute groups
    const features: { [groupKey: string]: any[] } = {};
    attributeGroups.forEach((group) => {
      features[group.key] = group.variants
        .filter((variant: any) => variant.active)
        .map((variant: any) => ({
          label: variant.label || variant.value, // Compatibilidad con datos antiguos
          value: variant.value,
        }));
    });

    return {
      categories: categoryGroup
        ? categoryGroup.variants
          .filter((variant: any) => variant.active)
          .map((variant: any) => ({
            label: variant.label || variant.value, // Compatibilidad con datos antiguos
            value: variant.value,
          }))
          .filter(Boolean)
        : [],
      locations: {
        countries: (locations[0]?.countries || []).filter(Boolean),
        departments: (locations[0]?.departments || []).filter(Boolean),
        cities: (locations[0]?.cities || []).filter(Boolean),
      },
      features,
      priceRange: {
        min: priceRange[0]?.minPrice || 0,
        max: priceRange[0]?.maxPrice || 0,
      },
    };
  } catch (error) {
    // Error in getFilterOptions
    throw error;
  }
};
