'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfileVerification } from '@/services/user.service';

export const useProfileVerification = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profileVerification', profileId],
    queryFn: () => getProfileVerification(profileId!),
    enabled: !!profileId,
    staleTime: 0, // Sin cache para que se actualice inmediatamente
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};