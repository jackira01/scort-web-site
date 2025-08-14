import axios from 'axios';
import type { FilterQuery, ProfilesResponse } from '@/types/profile.types';
import { API_URL } from '@/lib/config';

/**
 * Obtiene perfiles filtrados usando GET (para filtros simples)
 */
export const getFilteredProfiles = async (
  params: FilterQuery,
): Promise<ProfilesResponse> => {
  console.log('📡 [DEBUG] Iniciando petición GET con parámetros:', params);
  
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

  const finalUrl = `${API_URL}/api/filters/profiles?${queryParams.toString()}`;
  console.log('📡 [DEBUG] URL de la petición GET:', finalUrl);
  console.log('📡 [DEBUG] Query params construidos:', queryParams.toString());

  const response = await axios.get(finalUrl);
  
  console.log('📡 [DEBUG] Respuesta GET recibida:', {
    status: response.status,
    statusText: response.statusText,
    data: response.data
  });
  
  // El backend devuelve { success: true, data: FilterResponse }
  // Necesitamos transformar la estructura para que coincida con ProfilesResponse
  if (response.data.success && response.data.data) {
    const backendData = response.data.data;
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
    
    console.log('📡 [DEBUG] Datos transformados GET:', transformedData);
    
    return transformedData;
  } else {
    console.error('📡 [DEBUG] Error en respuesta GET:', response.data);
    throw new Error(response.data.message || 'Error en la respuesta del servidor');
  }
};

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
