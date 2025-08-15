import axios from 'axios';
import type { FilterQuery, ProfilesResponse } from '@/types/profile.types';
import { API_URL } from '@/lib/config';

// Función GET eliminada - solo se usa POST para filtros de perfiles

/**
 * Obtiene perfiles filtrados usando POST (para filtros complejos)
 */
export const getFilteredProfilesPost = async (
  filters: FilterQuery,
): Promise<ProfilesResponse> => {
  console.log('📡 [DEBUG] Iniciando petición POST con filtros:', filters);
  
  const postUrl = `${API_URL}/api/filters/profiles`;
  console.log('📡 [DEBUG] URL de la petición POST:', postUrl);
  console.log('📡 [DEBUG] Body de la petición POST:', JSON.stringify(filters, null, 2));

  try {
    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    console.log('📡 [DEBUG] Respuesta POST status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('📡 [DEBUG] Error en petición POST:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('📡 [DEBUG] Respuesta POST recibida:', responseData);
    
    // El backend devuelve { success: true, data: FilterResponse }
    // Necesitamos transformar la estructura para que coincida con ProfilesResponse
    if (responseData.success && responseData.data) {
      const backendData = responseData.data;
      const transformedData = {
        profiles: backendData.profiles,
        pagination: {
          currentPage: backendData.currentPage,
          totalPages: backendData.totalPages,
          totalProfiles: backendData.totalCount, // Transformar totalCount a totalProfiles
          hasNextPage: backendData.hasNextPage,
          hasPrevPage: backendData.hasPrevPage,
        },
      };
      
      console.log('📡 [DEBUG] Datos transformados POST:', transformedData);
      
      return transformedData;
    } else {
      console.error('📡 [DEBUG] Error en respuesta POST:', responseData);
      throw new Error(responseData.message || 'Error en la respuesta del servidor');
    }
  } catch (error) {
    console.error('📡 [DEBUG] Error en petición POST:', error);
    throw error;
  }
};

/**
 * Obtiene perfiles para mostrar en las cards con campos optimizados
 */
export const getProfilesForCards = async (
  params: Omit<FilterQuery, 'fields'> = {},
): Promise<ProfilesResponse> => {
  console.log('🎯 [DEBUG] getProfilesForCards - Parámetros recibidos:', params);
  
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

  console.log('🎯 [DEBUG] getProfilesForCards - Parámetros optimizados:', optimizedParams);

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

/**
 * Obtiene el conteo total de perfiles con filtros aplicados usando POST
 */
export const getProfilesCount = async (
  filters: FilterQuery,
): Promise<{ count: number }> => {
  const response = await fetch(`${API_URL}/api/filters/profiles/count`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json();
  return responseData.success ? responseData.data : responseData;
};
