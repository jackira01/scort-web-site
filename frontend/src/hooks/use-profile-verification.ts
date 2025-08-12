'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfileVerification } from '@/services/user.service';

export const useProfileVerification = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profileVerification', profileId],
    queryFn: () => getProfileVerification(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000, // 3 minutos - evitar fetching excesivo
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};