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
  const query = useQuery({
    queryKey: ['filtered-profiles', filters],
    queryFn: async () => {
      try {
        const result = await getProfilesForCards(filters);
        return result;
      } catch (error) {
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
    placeholderData: (previousData) => previousData, // Mantener datos anteriores durante la carga
    ...options,
  });
};