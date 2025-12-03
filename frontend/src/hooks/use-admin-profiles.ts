'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllProfilesForAdmin } from '@/services/profile.service';

export const useAdminProfiles = (
  page: number = 1, 
  limit: number = 10, 
  fields?: string, 
  userId?: string,
  profileName?: string,
  profileId?: string
) => {
  return useQuery({
    queryKey: ['adminProfiles', page, limit, fields, userId, profileName, profileId],
    queryFn: () => getAllProfilesForAdmin(page, limit, fields, userId, profileName, profileId),
    staleTime: 2 * 60 * 1000, // 2 minutos - evitar fetching excesivo
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};