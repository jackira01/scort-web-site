'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllProfiles } from '@/services/profile.service';

export const useAllProfiles = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['allProfiles', page, limit],
    queryFn: () => getAllProfiles(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutos - evitar fetching excesivo
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};