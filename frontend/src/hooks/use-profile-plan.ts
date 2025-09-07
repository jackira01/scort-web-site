'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfilePlanInfo } from '@/services/plans.service';
import type { ProfilePlanInfo } from '@/services/plans.service';

/**
 * Hook para obtener información del plan de un perfil específico
 * Utiliza React Query para cachear y optimizar las peticiones
 */
export const useProfilePlan = (profileId: string | null) => {
  return useQuery({
    queryKey: ['profilePlan', profileId],
    queryFn: () => getProfilePlanInfo(profileId!),
    enabled: !!profileId, // Solo ejecutar si hay profileId
    staleTime: 2 * 60 * 1000, // 2 minutos - evitar fetching excesivo
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnMount: false, // No refetch automático al montar
    refetchOnWindowFocus: false, // No refetch al enfocar ventana
    retry: 1, // Solo un reintento en caso de error
  });
};

/**
 * Hook para obtener información del plan con invalidación manual
 * Útil cuando necesitas refrescar los datos después de operaciones
 */
export const useProfilePlanWithRefresh = (profileId: string | null) => {
  const query = useProfilePlan(profileId);
  
  return {
    ...query,
    refresh: () => query.refetch(),
  };
};