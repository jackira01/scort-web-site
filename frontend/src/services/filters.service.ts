import axios from '@/lib/axios';
import type { FilterQuery, ProfilesResponse, FilterCounts } from '@/types/profile.types';
import { API_URL } from '@/lib/config';

// Función GET eliminada - solo se usa POST para filtros de perfiles

/**
 * Obtiene perfiles filtrados usando POST (para filtros complejos)
 * Ahora con soporte opcional para conteos integrados
 */
export const getFilteredProfilesPost = async (
  filters: FilterQuery,
  includeCounts: boolean = false,
): Promise<ProfilesResponse> => {
  const postUrl = `${API_URL}/api/filters/profiles`;

  // Agregar parámetro para solicitar conteos si se especifica
  const requestBody = includeCounts ? { ...filters, includeCounts } : filters;

  try {
    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    if (responseData.success && responseData.data) {
      const backendData = responseData.data;

      // Procesar conteos si están incluidos
      let filterCounts: FilterCounts | undefined;
      if (includeCounts && backendData.filterCounts) {
        filterCounts = {
          categories: backendData.filterCounts.categories || {},
          genders: backendData.filterCounts.genders || {},
          sex: backendData.filterCounts.sex || {},
          locations: backendData.filterCounts.locations || {},
        };
      }

      const transformedData: ProfilesResponse = {
        profiles: backendData.profiles,
        pagination: {
          currentPage: backendData.currentPage,
          totalPages: backendData.totalPages,
          totalProfiles: backendData.totalCount,
          hasNextPage: backendData.hasNextPage,
          hasPrevPage: backendData.hasPrevPage,
        },
        filterCounts,
      };

      return transformedData;
    } else {
      throw new Error(responseData.message || 'Error en la respuesta del servidor');
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene perfiles para mostrar en las cards con campos optimizados
 */
export const getProfilesForCards = async (
  params: Omit<FilterQuery, 'fields'> = {},
): Promise<ProfilesResponse> => {


  const optimizedParams: FilterQuery = {
    ...params,
    fields: [
      '_id',
      'name',
      'age',
      'location',
      'description',
      'media',
      'verification',
      'isActive',
    ],
    limit: params.limit || 12,
    page: params.page || 1,
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'desc',
  };



  // Usar POST para mejor rendimiento con campos específicos
  return getFilteredProfilesPost(optimizedParams);
};

/**
 * Obtiene opciones de filtros disponibles
 */
export const getFilterOptions = async () => {
  const response = await axios.get(`${API_URL}/api/filters/options`);
  return response.data;
};

// Función getProfilesCount eliminada - ahora se usa getFilterCounts optimizado

// Función getFilteredProfilesWithCounts eliminada - ahora se usa getFilteredProfilesPost con includeCounts

/**
 * Obtiene solo los conteos de filtros sin perfiles (más eficiente para filtros)
 */
export const getFilterCounts = async (): Promise<FilterCounts> => {
  try {
    // Usar filtros vacíos para obtener conteos generales
    const emptyFilters: FilterQuery = { limit: 0 }; // limit 0 para no traer perfiles
    const response = await getFilteredProfilesPost(emptyFilters, true);
    return response.filterCounts || {};
  } catch (error) {
    console.error('Error getting filter counts:', error);
    return {};
  }
};
