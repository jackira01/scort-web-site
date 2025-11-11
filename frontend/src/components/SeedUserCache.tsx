'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCentralizedSession } from '@/hooks/use-centralized-session';
import { useEffect } from 'react';
import { getUserById } from '@/services/user.service';

export function SeedUserCache() {
  const { userId, status } = useCentralizedSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      // Solo prefetch si no está ya en cache
      const existingData = queryClient.getQueryData(['user', userId]);
      if (!existingData) {
        queryClient.prefetchQuery({
          queryKey: ['user', userId],
          queryFn: () => getUserById(userId),
          staleTime: 5 * 60 * 1000, // 5 minutos
        });
      }
    }
  }, [status, userId, queryClient]);

  return null;
}

export default SeedUserCache;
