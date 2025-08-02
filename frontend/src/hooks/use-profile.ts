'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfileById } from '@/services/user.service';

export const useProfile = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => getProfileById(profileId!),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};