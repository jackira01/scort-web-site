'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfileById } from '@/services/user.service';

export const useProfileDetails = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profileDetails', profileId],
    queryFn: () => getProfileById(profileId!),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};