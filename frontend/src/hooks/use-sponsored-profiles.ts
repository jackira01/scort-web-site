'use client';

import { useQuery, UseQueryOptions, useQueryClient } from '@tanstack/react-query';
import {
  getSponsoredProfiles,
  getSponsoredProfilesForCards,
  getSponsoredProfilesCount,
  checkProfileSponsored,
  type SponsoredProfilesQuery,
  type SponsoredProfilesResponse
} from '@/services/sponsored-profiles.service';

/**
 * Hook para obtener perfiles patrocinados optimizados para cards
 */
export const useSponsoredProfiles = (
  query: SponsoredProfilesQuery = {},
  options?: Omit<UseQueryOptions<SponsoredProfilesResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['sponsored-profiles', query],
    queryFn: async () => {
      try {
        const result = await getSponsoredProfiles(query);
        return result;
      } catch (error) {
        console.error('Error en useSponsoredProfiles:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 3 * 60 * 1000, // 3 minutos - datos considerados frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en cache
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos para rotación
    refetchOnMount: true, // Refetch cuando se monta el componente
    retry: (failureCount, error) => {
      // Reintentar hasta 3 veces, pero no en errores 4xx
      if (failureCount >= 3) return false;
      if (error instanceof Error && error.message.includes('4')) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
    ...options,
  });
};

/**
 * Hook para obtener perfiles patrocinados optimizados específicamente para tarjetas
 * con campos limitados para mejor rendimiento
 */
export const useSponsoredProfilesForCards = (
  page: number = 1,
  limit: number = 20,
  options?: Omit<UseQueryOptions<SponsoredProfilesResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['sponsored-profiles-cards', page, limit],
    queryFn: async () => {
      try {
        const result = await getSponsoredProfilesForCards(page, limit);
        return result;
      } catch (error) {
        console.error('Error en useSponsoredProfilesForCards:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos - más frecuente para UI
    gcTime: 8 * 60 * 1000, // 8 minutos en cache
    refetchOnWindowFocus: false,
    refetchInterval: 3 * 60 * 1000, // Refetch cada 3 minutos para rotación activa
    refetchOnMount: true,
    retry: 2, // Menos reintentos para UI más responsiva
    retryDelay: 1000, // Delay fijo más corto
    ...options,
  });
};

/**
 * Hook para obtener el conteo total de perfiles patrocinados
 */
export const useSponsoredProfilesCount = (
  options?: Omit<UseQueryOptions<number>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['sponsored-profiles-count'],
    queryFn: async () => {
      try {
        const count = await getSponsoredProfilesCount();
        return count;
      } catch (error) {
        console.error('Error en useSponsoredProfilesCount:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutos - el conteo cambia menos frecuentemente
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
    refetchOnWindowFocus: false,
    refetchInterval: 10 * 60 * 1000, // Refetch cada 10 minutos
    retry: 3,
    retryDelay: 2000,
    ...options,
  });
};

/**
 * Hook para verificar si un perfil específico es patrocinado
 */
export const useProfileSponsoredCheck = (
  profileId: string,
  options?: Omit<UseQueryOptions<boolean>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['profile-sponsored-check', profileId],
    queryFn: async () => {
      try {
        const isSponsored = await checkProfileSponsored(profileId);
        return isSponsored;
      } catch (error) {
        console.error('Error en useProfileSponsoredCheck:', error);
        throw error;
      }
    },
    enabled: !!profileId, // Solo ejecutar si hay profileId
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos en cache
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1500,
    ...options,
  });
};

/**
 * Hook para invalidar y refrescar datos de perfiles patrocinados
 * Útil después de cambios en planes o estados de perfiles
 */
export const useSponsoredProfilesActions = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sponsored-profiles'] });
    queryClient.invalidateQueries({ queryKey: ['sponsored-profiles-cards'] });
    queryClient.invalidateQueries({ queryKey: ['sponsored-profiles-count'] });
  };

  const invalidateProfiles = () => {
    queryClient.invalidateQueries({ queryKey: ['sponsored-profiles'] });
    queryClient.invalidateQueries({ queryKey: ['sponsored-profiles-cards'] });
  };

  const invalidateCount = () => {
    queryClient.invalidateQueries({ queryKey: ['sponsored-profiles-count'] });
  };

  const invalidateProfileCheck = (profileId: string) => {
    queryClient.invalidateQueries({ queryKey: ['profile-sponsored-check', profileId] });
  };

  const prefetchNextPage = async (currentPage: number, limit: number = 20) => {
    await queryClient.prefetchQuery({
      queryKey: ['sponsored-profiles-cards', currentPage + 1, limit],
      queryFn: () => getSponsoredProfilesForCards(currentPage + 1, limit),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    invalidateAll,
    invalidateProfiles,
    invalidateCount,
    invalidateProfileCheck,
    prefetchNextPage,
  };
};

/**
 * Hook combinado para la sección de perfiles destacados
 * Incluye datos, conteo y acciones en un solo hook
 */
export const useFeaturedSponsoredProfiles = (
  page: number = 1,
  limit: number = 20,
  filters?: Partial<SponsoredProfilesQuery>
) => {
  // Construir query completo con paginación y filtros
  const query: SponsoredProfilesQuery = {
    page,
    limit,
    ...filters,
  };

  const profilesQuery = useSponsoredProfiles(query);
  const countQuery = useSponsoredProfilesCount();
  const actions = useSponsoredProfilesActions();

  return {
    // Datos de perfiles
    profiles: profilesQuery.data?.profiles || [],
    pagination: profilesQuery.data?.pagination,

    // Estados de carga
    isLoading: profilesQuery.isLoading,
    isError: profilesQuery.isError || countQuery.isError,
    error: profilesQuery.error || countQuery.error,

    // Estados adicionales
    isFetching: profilesQuery.isFetching,
    isRefetching: profilesQuery.isRefetching,

    // Conteo total
    totalCount: countQuery.data || 0,
    isCountLoading: countQuery.isLoading,

    // Acciones
    refetch: profilesQuery.refetch,
    refetchCount: countQuery.refetch,
    ...actions,
  };
};