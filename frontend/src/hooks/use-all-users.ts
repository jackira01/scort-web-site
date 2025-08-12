'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/services/user.service';

export const useAllUsers = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['allUsers', page, limit],
    queryFn: () => getUsers(page, limit, {}),
    staleTime: 2 * 60 * 1000, // 2 minutos - evitar fetching excesivo
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};