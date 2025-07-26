'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getUserById } from '@/services/user.service';

export function SeedUserCache() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === 'authenticated' && session.user) {
      const userId = session?.user?._id;
      queryClient.prefetchQuery({
        queryKey: ['user', userId],
        queryFn: () => getUserById(userId),
      });
    }
  }, [status, session, queryClient]);

  return null;
}
