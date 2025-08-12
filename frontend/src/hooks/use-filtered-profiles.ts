'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { FilterQuery, ProfilesResponse } from '@/types/profile.types';
import { getProfilesForCards, getFilteredProfilesPost } from '@/services/filters.service';

/**
 * Hook para obtener perfiles filtrados optimizados para cards
 */
export const useFilteredProfiles = (
  filters: Omit<FilterQuery, 'fields'> = {},
  options?: Omit<UseQueryOptions<ProfilesResponse>, 'queryKey' | 'queryFn'>
) => {
  console.log('useFilteredProfiles called with filters:', filters);
  
  const queryKey = ['filtered-profiles', filters];
  console.log('useFilteredProfiles queryKey:', queryKey);
  
  const query = useQuery({
    queryKey: ['filtered-profiles', filters],
    queryFn: async () => {
      console.log('🚀 Query function executing with filters:', filters);
      try {
        const result = await getProfilesForCards(filters);
        console.log('✅ Query function result:', result);
        return result;
      } catch (error) {
        console.error('❌ Query function error:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en cache
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
    refetchOnMount: true, // Refetch cuando se monta el componente
    retry: 3, // Reintentos en caso de error
    ...options,
  });
  
  console.log('🔍 Query state:', {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    status: query.status,
    fetchStatus: query.fetchStatus
  });
  
  return query;
};

/**
 * Hook para obtener perfiles con filtros personalizados (incluyendo campos específicos)
 */
export const useCustomFilteredProfiles = (
  filters: FilterQuery,
  options?: Omit<UseQueryOptions<ProfilesResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['custom-filtered-profiles', filters],
    queryFn: () => getFilteredProfilesPost(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    enabled: Object.keys(filters).length > 0,
    ...options,
  });
};

/**
 * Hook para obtener perfiles con paginación
 */
export const usePaginatedProfiles = (
  page: number = 1,
  limit: number = 12,
  filters: Omit<FilterQuery, 'page' | 'limit' | 'fields'> = {},
  options?: Omit<UseQueryOptions<ProfilesResponse>, 'queryKey' | 'queryFn'>
) => {
  const paginatedFilters = {
    ...filters,
    page,
    limit,
  };

  return useQuery({
    queryKey: ['paginated-profiles', page, limit, filters],
    queryFn: () => getProfilesForCards(paginatedFilters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Mantener datos anteriores durante la carga
    ...options,
  });
};