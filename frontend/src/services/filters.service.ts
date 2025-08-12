import axios from 'axios';
import type { FilterQuery, ProfilesResponse } from '@/types/profile.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Obtiene perfiles filtrados usando GET (para filtros simples)
 */
export const getFilteredProfiles = async (
  params: FilterQuery,
): Promise<ProfilesResponse> => {
  const queryParams = new URLSearchParams();

  // Agregar parámetros básicos
  if (params.category) queryParams.append('category', params.category);
  if (params.isActive !== undefined)
    queryParams.append('isActive', params.isActive.toString());
  if (params.isVerified !== undefined)
    queryParams.append('isVerified', params.isVerified.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  // Agregar campos específicos
  if (params.fields && params.fields.length > 0) {
    queryParams.append('fields', params.fields.join(','));
  }

  // Agregar ubicación
  if (params.location?.department) {
    queryParams.append('location[department]', params.location.department);
  }
  if (params.location?.city) {
    queryParams.append('location[city]', params.location.city);
  }

  // Agregar rango de precios
  if (params.priceRange?.min) {
    queryParams.append('minPrice', params.priceRange.min.toString());
  }
  if (params.priceRange?.max) {
    queryParams.append('maxPrice', params.priceRange.max.toString());
  }

  const response = await axios.get(
    `${API_URL}/api/filters/profiles?${queryParams.toString()}`,
  );
  
  // El backend devuelve { success: true, data: ProfilesResponse }
  // Necesitamos extraer solo la data
  if (response.data.success && response.data.data) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'Error en la respuesta del servidor');
  }
};

/**
 * Obtiene perfiles filtrados usando POST (para filtros complejos)
 */
export const getFilteredProfilesPost = async (
  filters: FilterQuery,
): Promise<ProfilesResponse> => {
  console.log('Making request to:', `${API_URL}/api/filters/profiles`);
  console.log('With filters:', filters);

  try {
    const response = await fetch(`${API_URL}/api/filters/profiles`, {
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
    console.log('Response received:', responseData);
    
    // El backend devuelve { success: true, data: ProfilesResponse }
    // Necesitamos extraer solo la data
    if (responseData.success && responseData.data) {
      return responseData.data;
    } else {
      throw new Error(responseData.message || 'Error en la respuesta del servidor');
    }
  } catch (error) {
    console.error('Request failed:', error);
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

  console.log('getProfilesForCards - optimizedParams:', optimizedParams);

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
 * Obtiene el conteo total de perfiles con filtros aplicados
 */
export const getProfilesCount = async (
  params: FilterQuery,
): Promise<{ count: number }> => {
  const queryParams = new URLSearchParams();

  if (params.category) queryParams.append('category', params.category);
  if (params.isActive !== undefined)
    queryParams.append('isActive', params.isActive.toString());
  if (params.isVerified !== undefined)
    queryParams.append('isVerified', params.isVerified.toString());

  if (params.location?.department) {
    queryParams.append('location[department]', params.location.department);
  }
  if (params.location?.city) {
    queryParams.append('location[city]', params.location.city);
  }

  const response = await axios.get(
    `${API_URL}/api/filters/profiles/count?${queryParams.toString()}`,
  );
  return response.data;
};
