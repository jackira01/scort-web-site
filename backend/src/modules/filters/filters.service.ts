import { ProfileModel as Profile } from '../profile/profile.model';
import { AttributeGroupModel as AttributeGroup } from '../attribute-group/attribute-group.model';
import type { FilterQuery, FilterResponse, FilterOptions } from './filters.types';

/**
 * Obtiene todos los perfiles con filtros aplicados
 */
export const getFilteredProfiles = async (filters: FilterQuery): Promise<FilterResponse> => {
    try {
      const {
        category,
        location,
        features,
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

      // Construir query de MongoDB
      const query: any = {};
      
      // Solo agregar filtro isActive si está definido
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      // Filtro por categoría
      if (category) {
        query.category = category;
      }

      // Filtro por ubicación
      if (location) {
        if (location.country) {
          query['location.country'] = location.country;
        }
        if (location.department) {
          query['location.department'] = location.department;
        }
        if (location.city) {
          query['location.city'] = location.city;
        }
      }

      // Filtro por verificación
      if (isVerified !== undefined) {
        query['user.isVerified'] = isVerified;
      }

      // Filtro por características (features)
      if (features && Object.keys(features).length > 0) {
        const featureConditions: any[] = [];
        
        // Primero necesitamos obtener los IDs de los grupos por sus keys
        const groupKeys = Object.keys(features);
        const attributeGroups = await AttributeGroup.find({ key: { $in: groupKeys } });
        const groupKeyToId = new Map();
        attributeGroups.forEach(group => {
          groupKeyToId.set(group.key, group._id);
        });
        
        for (const [groupKey, value] of Object.entries(features)) {
          const groupId = groupKeyToId.get(groupKey);
          if (!groupId) continue;
          
          if (Array.isArray(value)) {
            // Si es un array, buscar cualquiera de los valores
            featureConditions.push({
              'features': {
                $elemMatch: {
                  'group_id': groupId,
                  'value': { $in: value }
                }
              }
            });
          } else {
            // Si es un valor único
            featureConditions.push({
              'features': {
                $elemMatch: {
                  'group_id': groupId,
                  'value': value
                }
              }
            });
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
          availabilityConditions.push({
            'availability': {
              $elemMatch: {
                'dayOfWeek': availability.dayOfWeek
              }
            }
          });
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
      
      // Configurar ordenamiento
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Determinar campos a seleccionar
      const selectFields = fields && fields.length > 0 
        ? fields.join(' ') 
        : '_id name age location description verification media isActive';

      // Construir consulta base
      let profileQuery = Profile.find(query)
        .select(selectFields)
        .populate('user', 'isVerified')
        .populate('features.group_id')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Agregar populate para campos que requieren datos completos
      if (!fields || fields.includes('verification')) {
        profileQuery = profileQuery.populate('verification');
      }

      // Ejecutar consulta
      const [profiles, totalCount] = await Promise.all([
        profileQuery.lean(),
        Profile.countDocuments(query)
      ]);

      // Calcular información de paginación
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        profiles,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage
      };
    } catch (error) {
      console.error('Error in getFilteredProfiles:', error);
      throw new Error('Error al obtener perfiles filtrados');
    }
};

/**
 * Obtiene las opciones disponibles para los filtros
 */
export const getFilterOptions = async (): Promise<FilterOptions> => {
    try {
      const [categories, locations, attributeGroups, priceRange] = await Promise.all([
        // Obtener categorías únicas
        Profile.distinct('category', { isActive: true }),
        
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
        
        // Obtener grupos de atributos activos
        AttributeGroup.find({ active: true }).populate('variants'),
        
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

      // Procesar features de attribute groups
      const features: { [groupKey: string]: string[] } = {};
      attributeGroups.forEach(group => {
        features[group.key] = group.variants
          .filter((variant: any) => variant.active)
          .map((variant: any) => variant.value);
      });

      return {
        categories: categories.filter(Boolean) as string[],
        locations: {
          countries: (locations[0]?.countries?.filter(Boolean) || []) as string[],
          departments: (locations[0]?.departments?.filter(Boolean) || []) as string[],
          cities: (locations[0]?.cities?.filter(Boolean) || []) as string[]
        },
        features,
        priceRange: {
          min: priceRange[0]?.minPrice || 0,
          max: priceRange[0]?.maxPrice || 1000000
        }
      };
    } catch (error) {
        console.error('Error in getFilterOptions:', error);
        throw new Error('Error al obtener opciones de filtros');
      }
};