import axios, { isAxiosError } from 'axios';
import type { FilterQuery, ProfilesResponse } from '@/types/profile.types';
import { API_URL } from '@/lib/config';

// Función GET eliminada - solo se usa POST para filtros de perfiles

/**
 * Obtiene perfiles filtrados usando POST (para filtros complejos)
 * Ahora con soporte opcional para conteos integrados
 */
export const getFilteredProfilesPost = async (
  filters: FilterQuery,
): Promise<ProfilesResponse> => {
  const postUrl = `${API_URL}/api/filters/profiles`;

  const requestBody = filters;

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



      const transformedData: ProfilesResponse = {
        profiles: backendData.profiles,
        pagination: {
          currentPage: backendData.currentPage,
          totalPages: backendData.totalPages,
          totalProfiles: backendData.totalCount,
          hasNextPage: backendData.hasNextPage,
          hasPrevPage: backendData.hasPrevPage,
        },
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
      'planAssignment',
      'upgrades',
      'activeUpgrades',
      'hasDestacadoUpgrade',
    ],
    limit: params.limit || 12,
    page: params.page || 1,
    sortBy: params.sortBy || 'createdAt',
    sortOrder: params.sortOrder || 'desc',
  };

  // Usar POST para mejor rendimiento con campos específicos
  const result = await getFilteredProfilesPost(optimizedParams);

  return result;
};

/**
 * Obtiene opciones de filtros disponibles
 */
export const getFilterOptions = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/filters/options`);

    return response.data;
  } catch (error) {

    if (isAxiosError(error)) {
      console.error('🔍 DEBUG filters.service - Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }

    throw error;
  }
};

// Función getProfilesCount eliminada - ahora se usa getFilterCounts optimizado

// Función getFilteredProfilesWithCounts eliminada - ahora se usa getFilteredProfilesPost con includeCounts

/**
 * Obtiene solo los conteos de filtros sin perfiles (más eficiente para filtros)
 * @param filters - Filtros opcionales para aplicar a los conteos (ej: categoría)
 */
