'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfilesWithStories } from '@/services/profile.service';

export const useProfilesWithStories = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['profilesWithStories', page, limit],
    queryFn: () => getProfilesWithStories(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutos - evitar fetching excesivo
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};