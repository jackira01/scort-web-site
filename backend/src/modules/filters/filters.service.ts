import { AttributeGroupModel as AttributeGroup } from '../attribute-group/attribute-group.model';
import { ProfileModel as Profile } from '../profile/profile.model';
import { sortProfiles } from '../visibility/visibility.service';
import { updateLastShownAt } from '../feeds/feeds.service';
import { cacheService, CACHE_TTL, CACHE_KEYS } from '../../services/cache.service';
import { logger } from '../../utils/logger';
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
      profileVerified,
      documentVerified,
      hasDestacadoUpgrade,
      hasVideos,
      page = 1,
      limit = 20,
      // sortBy = 'createdAt',
      // sortOrder = 'desc',
      fields,
    } = filters;

    // Generar clave de caché basada en los filtros
    const cacheKey = cacheService.generateKey(
      CACHE_KEYS.FILTERS,
      JSON.stringify(filters)
    );

    // Intentar obtener del caché primero
    const cachedResult = await cacheService.get<FilterResponse>(cacheKey);
    if (cachedResult) {
      logger.info(`Cache hit para filtros: ${cacheKey}`);
      return cachedResult;
    }

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
    if (category) {
      // Agregar la categoría a las features para procesarla junto con las demás
      if (!features) {
        features = {};
      }
      features.category = category;
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

    // Filtro por verificación de perfil (basado en videoVerification)
    if (profileVerified !== undefined) {
      // Buscar perfiles que tengan verificación de video completada
      const profileVerificationQuery = await Profile.aggregate([
        {
          $lookup: {
            from: 'profileverifications',
            localField: 'verification',
            foreignField: '_id',
            as: 'verificationData'
          }
        },
        {
          $match: {
            'verificationData.steps.videoVerification.isVerified': profileVerified
          }
        },
        {
          $project: {
            _id: 1
          }
        }
      ]);

      const verifiedProfileIds = profileVerificationQuery.map(p => p._id);

      if (profileVerified) {
        // Solo incluir perfiles con video verificado
        query._id = { $in: verifiedProfileIds };
      } else {
        // Excluir perfiles con video verificado
        query._id = { $nin: verifiedProfileIds };
      }
    }

    // Filtro por verificación de documentos (basado en documentPhotos)
    if (documentVerified !== undefined) {
      // Buscar perfiles que tengan verificación de documentos completada
      const documentVerificationQuery = await Profile.aggregate([
        {
          $lookup: {
            from: 'profileverifications',
            localField: 'verification',
            foreignField: '_id',
            as: 'verificationData'
          }
        },
        {
          $match: {
            'verificationData.steps.documentPhotos.isVerified': documentVerified
          }
        },
        {
          $project: {
            _id: 1
          }
        }
      ]);

      const documentVerifiedProfileIds = documentVerificationQuery.map(p => p._id);

      if (documentVerified) {
        // Solo incluir perfiles con documentos verificados
        if (query._id && query._id.$in) {
          // Si ya hay filtro de profileVerified, hacer intersección
          query._id = { $in: query._id.$in.filter((id: any) => documentVerifiedProfileIds.some(docId => docId.equals(id))) };
        } else if (query._id && query._id.$nin) {
          // Si hay exclusión previa, combinar con inclusión de documentos
          query._id = { $in: documentVerifiedProfileIds, $nin: query._id.$nin };
        } else {
          query._id = { $in: documentVerifiedProfileIds };
        }
      } else {
        // Excluir perfiles con documentos verificados
        if (query._id && query._id.$in) {
          // Si ya hay inclusión, filtrar excluyendo documentos verificados
          query._id = { $in: query._id.$in.filter((id: any) => !documentVerifiedProfileIds.some(docId => docId.equals(id))) };
        } else if (query._id && query._id.$nin) {
          // Si ya hay exclusión, agregar más IDs a excluir
          query._id = { $nin: [...query._id.$nin, ...documentVerifiedProfileIds] };
        } else {
          query._id = { $nin: documentVerifiedProfileIds };
        }
      }
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
    if (features && Object.keys(features).length > 0) {
      const featureConditions: any[] = [];

      // Manejo especial para ageRange
      if (features.ageRange && typeof features.ageRange === 'object') {
        const { min, max } = features.ageRange as { min?: number; max?: number };

        if (min !== undefined || max !== undefined) {
          // SOLUCIÓN: Usar $expr para convertir string a number en la comparación
          const ageConditions: any[] = [];

          if (min !== undefined) {
            ageConditions.push({
              $expr: {
                $gte: [{ $toInt: "$age" }, min]
              }
            });
          }

          if (max !== undefined) {
            ageConditions.push({
              $expr: {
                $lte: [{ $toInt: "$age" }, max]
              }
            });
          }

          // Si ya existe $and, agregar las condiciones, si no, crearla
          if (query.$and) {
            query.$and.push(...ageConditions);
          } else {
            query.$and = ageConditions;
          }

        }
      }

      // Procesar otras características (excluyendo ageRange)
      const otherFeatures = Object.fromEntries(
        Object.entries(features).filter(([key]) => key !== 'ageRange')
      );

      if (Object.keys(otherFeatures).length > 0) {
        // Primero necesitamos obtener los IDs de los grupos por sus keys
        const groupKeys = Object.keys(otherFeatures);

        const attributeGroups = await AttributeGroup.find({
          key: { $in: groupKeys },
        });

        const groupKeyToId = new Map();
        attributeGroups.forEach((group) => {
          groupKeyToId.set(group.key, group._id);
        });

        for (const [groupKey, value] of Object.entries(otherFeatures)) {
          const groupId = groupKeyToId.get(groupKey);

          if (!groupId) {
            console.warn('⚠️ No groupId found for feature key:', groupKey);
            continue;
          }

          if (Array.isArray(value)) {
            // Si es un array, buscar cualquiera de los valores (normalizados)
            const normalizedValues = value.map((v) => v.toLowerCase().trim());

            const condition = {
              features: {
                $elemMatch: {
                  group_id: groupId,
                  'value.key': { $in: normalizedValues },
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
                  'value.key': normalizedValue,
                },
              },
            };

            featureConditions.push(condition);
          }
        }

        if (featureConditions.length > 0) {
          // Si ya existe $and (por ejemplo, de ageRange), agregar las condiciones en lugar de sobrescribir
          if (query.$and) {
            query.$and.push(...featureConditions);
          } else {
            query.$and = featureConditions;
          }
        }
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

    // Campos mínimos necesarios para ProfileCard
    const profileCardFields = [
      '_id',
      'name',
      'age',
      'location',
      'description',
      'verification',
      'media.gallery',
      'online',
      'hasVideo'
    ];

    const finalFields = Array.isArray(fields) && fields.length > 0
      ? Array.from(new Set([...fields, ...requiredFields]))
      : Array.from(new Set([...profileCardFields, ...requiredFields]));

    const selectFields = finalFields.join(' ');

    const startTime = Date.now();

    // Usar agregación para obtener todos los perfiles con información de usuario
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

    // Agregar lookup para planAssignment.plan
    aggregationPipeline.push({
      $lookup: {
        from: 'plandefinitions',
        localField: 'planAssignment.plan',
        foreignField: '_id',
        as: 'planAssignmentPlan'
      }
    });
    aggregationPipeline.push({
      $addFields: {
        'planAssignment.plan': { $arrayElemAt: ['$planAssignmentPlan', 0] }
      }
    });
    aggregationPipeline.push({
      $project: {
        planAssignmentPlan: 0
      }
    });

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

    // Agregar proyección final para limitar campos devueltos
    const projectionFields: any = {};
    finalFields.forEach(field => {
      projectionFields[field] = 1;
    });

    // Asegurar que siempre incluimos el campo user para verificaciones
    projectionFields['user'] = 1;

    aggregationPipeline.push({
      $project: projectionFields
    });

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
        { $count: 'total' }
      ])
    ]);

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

    // Agregar información de verificación y hasDestacadoUpgrade a los perfiles
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

      // Calcular hasDestacadoUpgrade
      const now = new Date();
      let hasDestacadoUpgrade = false;

      // Verificar si tiene plan DIAMANTE
      if (profile.planAssignment?.planCode === 'DIAMANTE') {
        hasDestacadoUpgrade = true;
      } else if (profile.upgrades && Array.isArray(profile.upgrades)) {
        // Verificar si tiene upgrade DESTACADO/HIGHLIGHT activo
        hasDestacadoUpgrade = profile.upgrades.some((upgrade: any) =>
          ['DESTACADO', 'HIGHLIGHT'].includes(upgrade.code) &&
          new Date(upgrade.startAt) <= now &&
          new Date(upgrade.endAt) > now
        );
      }

      return {
        ...profile,
        hasDestacadoUpgrade,
        verification: {
          isVerified,
          verificationLevel
        }
      };
    });

    const result = {
      ...paginationInfo,
      profiles: profilesWithVerification,
    };

    // Guardar resultado en caché (5 minutos para consultas de filtros)
    await cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
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
    // Intentar obtener del caché primero
    const cacheKey = cacheService.generateKey(CACHE_KEYS.FILTERS, 'options');
    const cachedOptions = await cacheService.get<FilterOptions>(cacheKey);
    if (cachedOptions) {
      logger.info('Cache hit para opciones de filtros');
      return cachedOptions;
    }
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

    const result = {
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

    // Guardar en caché por 30 minutos (las opciones cambian poco)
    await cacheService.set(cacheKey, result, CACHE_TTL.LONG);
    logger.info('Opciones de filtros guardadas en caché');

    return result;
  } catch (error) {
    // Error in getFilterOptions
    throw error;
  }
};
