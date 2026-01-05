import { AttributeGroupModel as AttributeGroup } from '../attribute-group/attribute-group.model';
import { ProfileModel as Profile } from '../profile/profile.model';
import { extractCategoryFromFeatures } from '../profile/profile.service';
import { sortProfiles } from '../visibility/visibility.service';
import { updateLastShownAt } from '../feeds/feeds.service';
import { cacheService, CACHE_TTL, CACHE_KEYS } from '../../services/cache.service';
import { logger } from '../../utils/logger';
import type {
  FilterOptions,
  FilterQuery,
  FilterResponse,
} from './filters.types';
import { enrichProfileVerification } from '../profile-verification/verification.helper';

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

    // CRÍTICO: Excluir perfiles sin planAssignment (perfiles en proceso, no listos para público)
    query.planAssignment = { $exists: true, $ne: null };
    query['planAssignment.expiresAt'] = { $gt: now };

    // Por defecto, solo mostrar perfiles activos (isActive: true)
    // El frontend puede sobrescribir esto enviando isActive: false explícitamente
    if (isActive !== undefined) {
      query.isActive = isActive;
    } else {
      // Si no se especifica, filtrar solo perfiles activos por defecto
      query.isActive = true;
    }

    // ✨ CASO ESPECIAL: Categoría "perfiles" = todos los perfiles activos y visibles
    // Validar antes que cualquier otro filtro de categoría
    if (category && category.toLowerCase() === 'perfiles') {
      logger.info('📋 [FILTROS] Categoría "perfiles" detectada - mostrando todos los perfiles activos y visibles');
      // No aplicar filtro de categoría - mostrar todos los perfiles
      // Los filtros de ubicación, precio, etc. seguirán aplicándose
      // Simplemente no agregamos la categoría a las features
    } else if (category) {
      // Filtro por categoría específica (escorts, masajistas, etc.)
      // Buscar el AttributeGroup de 'category' para validar que existe
      let categoryFeatureId: any = null;
      const categoryGroup = await AttributeGroup.findOne({ key: 'category' });

      if (categoryGroup) {
        // Si existe el grupo, agregar a features para procesarla después
        if (!features) {
          features = {};
        }
        features.category = category;
        categoryFeatureId = categoryGroup._id;
      } else {
        // ⚠️ ADVERTENCIA: No existe AttributeGroup con key='category'
        // Esto causará que no se retornen resultados cuando se filtre por categoría
        console.warn('⚠️ [FILTROS] No existe AttributeGroup con key="category". El filtro de categoría no funcionará.');
        console.warn('⚠️ [FILTROS] Se debe crear el grupo de atributos "category" con las variantes: escorts, masajistas, modelos, etc.');

        // Retornar respuesta vacía inmediatamente
        return {
          profiles: [],
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit,
        };
      }
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

    // Filtro por verificación de documentos (basado en frontPhotoVerification y selfieVerification)
    if (documentVerified !== undefined) {
      // Buscar perfiles que tengan ambas verificaciones de documentos completadas
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
            $and: [
              { 'verificationData.steps.frontPhotoVerification.isVerified': documentVerified },
              { 'verificationData.steps.selfieVerification.isVerified': documentVerified }
            ]
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
    const requiredFields = ['planAssignment', 'upgrades', 'lastShownAt', 'createdAt', 'features'];

    // Campos mínimos necesarios para ProfileCard
    const profileCardFields = [
      '_id',
      'name',
      'age',
      'location',
      'contact', // IMPORTANTE: Necesario para verificación dinámica
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

    // Agregar lookup para planAssignment.planId (NO .plan)
    aggregationPipeline.push({
      $lookup: {
        from: 'plandefinitions',
        localField: 'planAssignment.planId',
        foreignField: '_id',
        as: 'planAssignmentPlan'
      }
    });
    aggregationPipeline.push({
      $addFields: {
        'planAssignment.planId': { $arrayElemAt: ['$planAssignmentPlan', 0] }
      }
    });
    aggregationPipeline.push({
      $project: {
        planAssignmentPlan: 0
      }
    });

    // CRÍTICO: Filtrar solo perfiles con planes que permitan aparecer en filtros
    // ELIMINADO: Se ha decidido mostrar todos los perfiles válidos independientemente de esta flag
    // para evitar que perfiles pagados sean ocultados incorrectamente.
    /*
    aggregationPipeline.push({
      $match: {
        'planAssignment.planId.features.showInFilters': true
      }
    });
    */

    // Agregar lookup para features si es necesario (o si necesitamos extraer categoría)
    // Siempre hacemos lookup porque 'category' es un campo derivado de features
    if (finalFields.includes('features') || true) {
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
    
    // Asegurar que featureGroups esté disponible para el mapeo posterior
    projectionFields['featureGroups'] = 1;

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

    console.log(`📊 [FILTROS DEBUG] Perfiles después de agregación: ${allProfiles.length}`);
    console.log(`📊 [FILTROS DEBUG] Total count: ${totalCount}`);
    console.log(`📊 [FILTROS DEBUG] Perfiles con plan válido: ${allProfiles.filter((p: any) => p.planAssignment?.planId).length}`);

    console.log(`\n📊 [FILTROS] Ordenando ${allProfiles.length} perfiles encontrados (página ${page}, límite ${limit})`);

    // Ordenar perfiles usando el servicio de visibilidad
    // Pasamos 'FILTERS' como contexto para diferenciar logs
    const sortedProfiles = await sortProfiles(allProfiles as any, now, 'FILTERS');

    // Aplicar paginación sobre los resultados ordenados
    const paginatedProfiles = sortedProfiles.slice(skip, skip + limit);

    console.log(`\n📄 [FILTROS] Mostrando perfiles ${skip + 1} a ${skip + paginatedProfiles.length} de ${totalCount} totales`);

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

    // Obtener todos los grupos de atributos para población manual robusta (fallback si el lookup falla)
    const allAttributeGroups = await AttributeGroup.find().lean();

    const profilesWithVerification = paginatedProfiles.map((rawProfile, index) => {
      // ✅ CORRECCIÓN: No llamamos a enrichProfileVerification. 
      // Confiamos en que el Cron Job y la DB tienen la información más actualizada.
      const profile = rawProfile;

      // Calcular estado de verificación basado DIRECTAMENTE en el progreso de la DB
      let isVerified = false;
      let verificationLevel = 'pending';

      // Aseguramos que verification exista y sea un objeto
      const verification = (typeof profile.verification === 'object' && profile.verification !== null)
        ? profile.verification as any
        : {};

      // Usamos el verificationProgress que viene de la DB (que ya arreglamos con el Cron)
      const progress = verification.verificationProgress || 0;

      // Determinamos el nivel basado en el porcentaje real almacenado
      if (progress === 100) {
        isVerified = true;
        verificationLevel = 'verified';
      } else if (progress > 0) {
        // Si tiene algo de progreso pero no 100%
        verificationLevel = 'partial';
      }

      // ---------------------------------------------------------
      // Lógica de Destacado (Se mantiene igual, estaba correcta)
      // ---------------------------------------------------------
      let hasDestacadoUpgrade = false;

      // Verificar si tiene plan DIAMANTE
      if (profile.planAssignment?.planCode === 'DIAMANTE') {
        hasDestacadoUpgrade = true;
      } else if (profile.upgrades && Array.isArray(profile.upgrades)) {
        // Verificar si tiene upgrade DESTACADO/HIGHLIGHT activo
        hasDestacadoUpgrade = profile.upgrades.some((upgrade: any) =>
          ['DESTACADO', 'HIGHLIGHT'].includes(upgrade.code) &&
          upgrade.startAt &&
          upgrade.endAt &&
          new Date(upgrade.startAt) <= now &&
          new Date(upgrade.endAt) > now
        );
      }

      // Manually populate features if featureGroups exists or using fallback
      if (profile.features && Array.isArray(profile.features)) {
         // DEBUG: Log para verificar población de features
         if (index === 0) {
             // console.log('🔍 [FILTROS DEBUG] FeatureGroups count:', (profile as any).featureGroups?.length || 0);
             // console.log('🔍 [FILTROS DEBUG] Features before populate:', JSON.stringify(profile.features.slice(0, 2)));
         }

         profile.features = profile.features.map((f: any) => {
             // Intentar usar featureGroups del lookup primero
             let group = (profile as any).featureGroups?.find((g: any) => g._id.toString() === f.group_id.toString());
             
             // Si no se encuentra (por fallo en lookup o tipos), usar la lista completa
             if (!group && allAttributeGroups) {
                 group = allAttributeGroups.find((g: any) => g._id.toString() === f.group_id.toString());
             }
             
             return { ...f, group_id: group || f.group_id };
         });

         if (index === 0) {
             // console.log('🔍 [FILTROS DEBUG] Features after populate:', JSON.stringify(profile.features.slice(0, 2)));
         }
      }

      // Extraer categoría
      const category = extractCategoryFromFeatures(profile.features);
      
      if (index === 0) {
          console.log('🔍 [FILTROS DEBUG] Extracted category:', category);
      }

      return {
        ...profile,
        hasDestacadoUpgrade,
        category,
        verification: {
          ...verification,
          isVerified,        // Booleano simple para el frontend
          verificationLevel, // Estado legible (verified/partial/pending)
          // Mantenemos el progreso original de la DB
          verificationProgress: progress
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
