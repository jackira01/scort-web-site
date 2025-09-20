'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getUserById } from '@/services/user.service';

export function SeedUserCache() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?._id) {
      const userId = session.user._id;
      
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
  }, [status, session?.user?._id, queryClient]);

  return null;
}
