'use client';

import { useQuery } from '@tanstack/react-query';
import { getAvailablePlans } from '@/services/plans.service';
import type { Plan } from '@/types/plans';

/**
 * Hook para obtener los planes disponibles
 * Utiliza React Query para cachear y optimizar las peticiones
 */
export const useAvailablePlans = () => {
  return useQuery({
    queryKey: ['availablePlans'],
    queryFn: getAvailablePlans,
    staleTime: 10 * 60 * 1000, // 10 minutos - los planes no cambian frecuentemente
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
    refetchOnMount: false, // No refetch automático al montar
    refetchOnWindowFocus: false, // No refetch al enfocar ventana
    retry: 2, // Dos reintentos en caso de error
  });
};