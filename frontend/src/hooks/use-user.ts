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
    queryFn: () => getUserById(userId || ''),
    enabled: !!userId,
    staleTime: 0, // Siempre considerar los datos como obsoletos
    refetchOnMount: true, // Refrescar cuando el componente se monta
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recibe foco
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
