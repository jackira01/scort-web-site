'use client';

import { useQuery } from '@tanstack/react-query';
import { getFilterCounts } from '@/services/filters.service';
import type { FilterQuery, FilterCounts } from '@/types/profile.types';

/**
 * Hook optimizado para obtener todos los conteos de filtros de una vez
 */
export const useOptimizedFilterCounts = () => {
  return useQuery({
    queryKey: ['optimizedFilterCounts'],
    queryFn: getFilterCounts,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener conteos de perfiles por categoría (mantiene compatibilidad)
 */
export const useCategoryFilterCounts = () => {
  const { data: allCounts, isLoading, error } = useOptimizedFilterCounts();
  
  return {
    data: allCounts?.categories || {},
    isLoading,
    error,
  };
};

/**
 * Hook para obtener conteos de perfiles por género (mantiene compatibilidad)
 */
export const useGenderFilterCounts = () => {
  const { data: allCounts, isLoading, error } = useOptimizedFilterCounts();
  
  return {
    data: allCounts?.genders || {},
    isLoading,
    error,
  };
};

/**
 * Hook para obtener conteos de perfiles por orientación sexual (mantiene compatibilidad)
 */
export const useSexFilterCounts = () => {
  const { data: allCounts, isLoading, error } = useOptimizedFilterCounts();
  
  return {
    data: allCounts?.sex || {},
    isLoading,
    error,
  };
};

/**
 * Hook para obtener conteos de perfiles por ubicación (mantiene compatibilidad)
 */
export const useLocationFilterCounts = () => {
  const { data: allCounts, isLoading, error } = useOptimizedFilterCounts();
  
  return {
    data: allCounts?.locations || {},
    isLoading,
    error,
  };
};

// Hook useFilterCount eliminado - ahora se usa useOptimizedFilterCounts

/**
 * Hook para obtener todos los conteos de filtros de una vez (ahora optimizado)
 */
export const useAllFilterCounts = () => {
  const { data, isLoading, error, refetch } = useOptimizedFilterCounts();
  
  return {
    categories: data?.categories || {},
    genders: data?.genders || {},
    sex: data?.sex || {},
    locations: data?.locations || {},
    isLoading,
    error,
    refetch,
  };
};