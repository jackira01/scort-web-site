import { ProfileModel as Profile } from '../profile/profile.model';
import { AttributeGroupModel as AttributeGroup } from '../attribute-group/attribute-group.model';
import type { FilterQuery, FilterResponse, FilterOptions } from './filters.types';

/**
 * Obtiene todos los perfiles con filtros aplicados
 */
export const getFilteredProfiles = async (filters: FilterQuery): Promise<FilterResponse> => {
  try {
    console.log('🔍 [BACKEND FILTERS DEBUG] === INICIO DE FILTRADO ===');
    console.log('🔍 [BACKEND FILTERS DEBUG] Filtros recibidos:', JSON.stringify(filters, null, 2));

    const {
      category,
      location,
      priceRange,
      availability,
      isActive,
      isVerified,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fields
    } = filters;
    
    let features = filters.features;

    console.log('🔍 [BACKEND FILTERS DEBUG] Filtros desestructurados:');
    console.log('  - category:', category);
    console.log('  - location:', location);
    console.log('  - features:', features);
    console.log('  - priceRange:', priceRange);
    console.log('  - availability:', availability);
    console.log('  - isActive:', isActive);
    console.log('  - isVerified:', isVerified);
    console.log('  - page:', page, 'limit:', limit);
    console.log('  - sortBy:', sortBy, 'sortOrder:', sortOrder);

    // Construir query de MongoDB
    const query: any = {};
    console.log('🔍 [BACKEND FILTERS DEBUG] Construyendo query MongoDB...');

    // Solo agregar filtro isActive si está definido
    if (isActive !== undefined) {
      query.isActive = isActive;
      console.log('🔍 [BACKEND FILTERS DEBUG] Aplicando filtro isActive:', isActive);
    }

    // Filtro por categoría (se maneja como feature)
    if (category) {
      console.log('🔍 [BACKEND FILTERS DEBUG] Aplicando filtro category como feature:', category);
      // Agregar la categoría a las features para procesarla junto con las demás
      if (!features) {
        features = {};
      }
      features.category = category;
      console.log('🔍 [BACKEND FILTERS DEBUG] Features actualizadas con category:', features);
    }

    // Filtro por ubicación
    if (location) {
      console.log('🔍 [BACKEND FILTERS DEBUG] Aplicando filtros de ubicación:', location);
      if (location.country) {
        query['location.country'] = location.country;
        console.log('  - country:', location.country);
      }
      if (location.department) {
      query['location.department.value'] = location.department;
      console.log('  - department:', location.department);
    }
      if (location.city) {
      query['location.city.value'] = location.city;
      console.log('  - city:', location.city);
    }
    }

    // Filtro por verificación
    if (isVerified !== undefined) {
      query['user.isVerified'] = isVerified;
      console.log('🔍 [BACKEND FILTERS DEBUG] Aplicando filtro isVerified:', isVerified);
    }

    // Filtro por características (features)
    if (features && Object.keys(features).length > 0) {
      console.log('🔍 [BACKEND FILTERS DEBUG] Procesando filtros de características:', features);
      const featureConditions: any[] = [];

      // Primero necesitamos obtener los IDs de los grupos por sus keys
      const groupKeys = Object.keys(features);
      console.log('🔍 [BACKEND FILTERS DEBUG] Buscando grupos por keys:', groupKeys);
      const attributeGroups = await AttributeGroup.find({ key: { $in: groupKeys } });
      console.log('🔍 [BACKEND FILTERS DEBUG] Grupos encontrados:', attributeGroups.map(g => ({ key: g.key, id: g._id, name: g.name })));
      const groupKeyToId = new Map();
      attributeGroups.forEach(group => {
        groupKeyToId.set(group.key, group._id);
      });
      console.log('🔍 [BACKEND FILTERS DEBUG] Mapa de keys a IDs:', Array.from(groupKeyToId.entries()));

      for (const [groupKey, value] of Object.entries(features)) {
        console.log(`🔍 [BACKEND FILTERS DEBUG] Procesando característica: ${groupKey} = ${JSON.stringify(value)}`);
        const groupId = groupKeyToId.get(groupKey);
        if (!groupId) {
          console.log(`🔍 [BACKEND FILTERS DEBUG] ⚠️  Grupo no encontrado para key: ${groupKey}`);
          continue;
        }
        console.log(`🔍 [BACKEND FILTERS DEBUG] Grupo ID encontrado: ${groupId}`);

        if (Array.isArray(value)) {
          // Si es un array, buscar cualquiera de los valores (normalizados)
          const normalizedValues = value.map(v => v.toLowerCase().trim());
          const condition = {
            'features': {
              $elemMatch: {
                'group_id': groupId,
                'value': { $in: normalizedValues }
              }
            }
          };
          featureConditions.push(condition);
          console.log(`🔍 [BACKEND FILTERS DEBUG] Condición array creada:`, JSON.stringify(condition, null, 2));
        } else {
          // Si es un valor único (normalizado) - buscar en el array de valores del perfil
          const normalizedValue = value.toLowerCase().trim();
          const condition = {
            'features': {
              $elemMatch: {
                'group_id': groupId,
                'value': { $in: [normalizedValue] }
              }
            }
          };
          featureConditions.push(condition);
          console.log(`🔍 [BACKEND FILTERS DEBUG] Condición valor único creada:`, JSON.stringify(condition, null, 2));
        }
      }

      if (featureConditions.length > 0) {
        query.$and = featureConditions;
        console.log('🔍 [BACKEND FILTERS DEBUG] Condiciones de características aplicadas:', JSON.stringify(featureConditions, null, 2));
      }
    }

    // Filtro por rango de precios
    if (priceRange) {
      console.log('🔍 [BACKEND FILTERS DEBUG] Aplicando filtro de rango de precios:', priceRange);
      const priceConditions: any = {};
      if (priceRange.min !== undefined) {
        priceConditions.$gte = priceRange.min;
        console.log('🔍 [BACKEND FILTERS DEBUG] Precio mínimo:', priceRange.min);
      }
      if (priceRange.max !== undefined) {
        priceConditions.$lte = priceRange.max;
        console.log('🔍 [BACKEND FILTERS DEBUG] Precio máximo:', priceRange.max);
      }

      if (Object.keys(priceConditions).length > 0) {
        query['rates.price'] = priceConditions;
        console.log('🔍 [BACKEND FILTERS DEBUG] Condiciones de precio aplicadas:', priceConditions);
      }
    }

    // Filtro por disponibilidad
    if (availability) {
      console.log('🔍 [BACKEND FILTERS DEBUG] Aplicando filtro de disponibilidad:', availability);
      const availabilityConditions: any[] = [];

      if (availability.dayOfWeek) {
        const dayCondition = {
          'availability': {
            $elemMatch: {
              'dayOfWeek': availability.dayOfWeek
            }
          }
        };
        availabilityConditions.push(dayCondition);
        console.log('🔍 [BACKEND FILTERS DEBUG] Condición día de semana:', JSON.stringify(dayCondition, null, 2));
      }

      if (availability.timeSlot && (availability.timeSlot.start || availability.timeSlot.end)) {
        const timeCondition: any = {
          'availability': {
            $elemMatch: {
              'slots': {
                $elemMatch: {
                  ...(availability.timeSlot.start && { start: { $lte: availability.timeSlot.start } }),
                  ...(availability.timeSlot.end && { end: { $gte: availability.timeSlot.end } })
                }
              }
            }
          }
        };
        availabilityConditions.push(timeCondition);
        console.log('🔍 [BACKEND FILTERS DEBUG] Condición horario:', JSON.stringify(timeCondition, null, 2));
      }

      if (availabilityConditions.length > 0) {
        if (query.$and) {
          query.$and.push(...availabilityConditions);
        } else {
          query.$and = availabilityConditions;
        }
        console.log('🔍 [BACKEND FILTERS DEBUG] Condiciones de disponibilidad aplicadas:', JSON.stringify(availabilityConditions, null, 2));
      }
    }

    console.log('🔍 [BACKEND FILTERS DEBUG] === QUERY FINAL CONSTRUIDA ===');
    console.log('🔍 [BACKEND FILTERS DEBUG] Query MongoDB:', JSON.stringify(query, null, 2));

    // Configurar paginación
    const skip = (page - 1) * limit;
    console.log('🔍 [BACKEND FILTERS DEBUG] Paginación - skip:', skip, 'limit:', limit);

    // Configurar ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    console.log('🔍 [BACKEND FILTERS DEBUG] Ordenamiento:', sort);

    // Determinar campos a seleccionar
    const selectFields = fields && fields.length > 0
      ? fields.join(' ')
      : '_id name age location description verification media isActive';
    console.log('🔍 [BACKEND FILTERS DEBUG] Campos seleccionados:', selectFields);
    console.log('🔍 [BACKEND FILTERS DEBUG] ¿Se especificaron campos?:', !!fields);
    console.log('🔍 [BACKEND FILTERS DEBUG] ¿Incluye features?:', fields ? fields.includes('features') : false);

    // Construir consulta base
    let profileQuery = Profile.find(query)
      .select(selectFields)
      .populate('user', 'isVerified')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Agregar populate para campos que requieren datos completos
    if (!fields || fields.includes('verification')) {
      profileQuery = profileQuery.populate('verification');
    }
    
    // Solo hacer populate de features si está explícitamente incluido en los campos seleccionados
    if (fields && fields.includes('features')) {
      profileQuery = profileQuery.populate('features.group_id');
      console.log('🔍 [BACKEND FILTERS DEBUG] Agregando populate de features.group_id');
    } else {
      console.log('🔍 [BACKEND FILTERS DEBUG] NO se incluye populate de features (no está en campos seleccionados o no se especificaron campos)');
    }

    console.log('🔍 [BACKEND FILTERS DEBUG] === EJECUTANDO CONSULTA ===');
    const startTime = Date.now();

    // Ejecutar consulta
    const [profiles, totalCount] = await Promise.all([
      profileQuery.lean(),
      Profile.countDocuments(query)
    ]);

    const executionTime = Date.now() - startTime;
    console.log('🔍 [BACKEND FILTERS DEBUG] === RESULTADOS ===');
    console.log('🔍 [BACKEND FILTERS DEBUG] Tiempo de ejecución:', executionTime, 'ms');
    console.log('🔍 [BACKEND FILTERS DEBUG] Total de perfiles encontrados:', totalCount);
    console.log('🔍 [BACKEND FILTERS DEBUG] Perfiles en esta página:', profiles.length);
    console.log('🔍 [BACKEND FILTERS DEBUG] IDs de perfiles:', profiles.map(p => p._id));

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
      limit
    };

    console.log('🔍 [BACKEND FILTERS DEBUG] === INFORMACIÓN DE PAGINACIÓN ===');
    console.log('🔍 [BACKEND FILTERS DEBUG] Paginación:', paginationInfo);

    const result = {
      profiles,
      pagination: paginationInfo
    };

    console.log('🔍 [BACKEND FILTERS DEBUG] === FIN DEL PROCESO DE FILTRADO ===');
    console.log('🔍 [BACKEND FILTERS DEBUG] Resultado final - cantidad de perfiles:', result.profiles.length);

    return {
      ...result.pagination,
      profiles: result.profiles
    };
  } catch (error) {
    console.error('🚨 [BACKEND FILTERS DEBUG] === ERROR EN FILTRADO ===');
    console.error('🚨 [BACKEND FILTERS DEBUG] Error:', error);
    console.error('🚨 [BACKEND FILTERS DEBUG] Stack trace:', error);
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
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            countries: { $addToSet: '$location.country' },
            departments: { $addToSet: '$location.department' },
            cities: { $addToSet: '$location.city' }
          }
        }
      ]),

      // Obtener grupos de atributos
      AttributeGroup.find(),

      // Obtener rango de precios
      Profile.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$rates' },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$rates.price' },
            maxPrice: { $max: '$rates.price' }
          }
        }
      ])
    ]);

    // Obtener categorías desde el grupo de atributos 'category'
    const categoryGroup = attributeGroups.find(group => group.key === 'category');
    const categories = categoryGroup ? 
      categoryGroup.variants
        .filter((variant: any) => variant.active)
        .map((variant: any) => ({
          label: variant.label || variant.value,  // Compatibilidad con datos antiguos
          value: variant.value
        })) : [];

    // Procesar features de attribute groups
    const features: { [groupKey: string]: any[] } = {};
    attributeGroups.forEach(group => {
      features[group.key] = group.variants
        .filter((variant: any) => variant.active)
        .map((variant: any) => ({
          label: variant.label || variant.value,  // Compatibilidad con datos antiguos
          value: variant.value
        }));
    });

    return {
      categories: categoryGroup ? 
        categoryGroup.variants
          .filter((variant: any) => variant.active)
          .map((variant: any) => ({
            label: variant.label || variant.value,  // Compatibilidad con datos antiguos
            value: variant.value
          }))
          .filter(Boolean) : [],
      locations: {
        countries: (locations[0]?.countries?.filter(Boolean) || []),
        departments: (locations[0]?.departments?.filter(Boolean) || []),
        cities: (locations[0]?.cities?.filter(Boolean) || [])
      },
      features,
      priceRange: {
        min: priceRange[0]?.minPrice || 0,
        max: priceRange[0]?.maxPrice || 1000000
      }
    };
  } catch (error) {
    // Error in getFilterOptions
    throw new Error('Error al obtener opciones de filtros');
  }
};