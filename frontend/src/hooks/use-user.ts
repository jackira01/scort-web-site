'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getUserById, getUsers, updateUser } from '@/services/user.service';
import type { User, UserPaginatedResponse } from '@/types/user.types';

export const useUser = () => {
  const { data: session } = useSession();
  const userId = session?.user?._id;

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => {
      if (!userId || userId === 'undefined') {
        throw new Error('User ID not available in session');
      }
      return getUserById(userId);
    },
    enabled: !!userId && userId !== 'undefined',
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string | undefined; data: Partial<User> }) => {
      if (!userId) throw new Error('User ID not available');
      return updateUser(userId, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pagination-users'] });
    },
  });
};

export const usePaginatedUsers = (
  page: number,
  limit: number,
  filters: any,
) => {
  return useQuery<UserPaginatedResponse>({
    queryKey: ['dashboard-pagination-users', page],
    queryFn: async () => getUsers(page, limit, filters),
  });
};
