'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserProfiles } from '@/services/user.service';

export const useUserProfiles = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['userProfiles', userId],
    queryFn: () => getUserProfiles(userId || ''),
    enabled: !!userId,
    staleTime: 0, // Sin cache para que se actualice inmediatamente
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};