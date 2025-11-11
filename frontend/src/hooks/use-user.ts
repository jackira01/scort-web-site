'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCentralizedSession } from '@/hooks/use-centralized-session';
import { getUserById, getUsers, updateUser } from '@/services/user.service';
import type { User, UserPaginatedResponse } from '@/types/user.types';
import { useEffect } from 'react';

export const useUser = () => {
  const { userId } = useCentralizedSession();

  const query = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId || userId === 'undefined') {
        throw new Error('User ID not available in session');
      }
      const data = await getUserById(userId);

      return data;
    },
    enabled: !!userId && userId !== 'undefined',
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Usar useEffect para logs de errores si es necesario
  useEffect(() => {
    if (query.error) {
      console.error('🔍 DEBUG useUser - Error fetching user:', query.error);
    }
  }, [query.error]);

  return query;
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string | undefined; data: Partial<User> }) => {
      if (!userId) throw new Error('User ID not available');
      return updateUser(userId, data);
    },
    onSuccess: (_data, variables) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pagination-users'] });
    },
    onError: (error) => {
      console.error('🔍 DEBUG useUpdateUser - Error updating user:', error);
    }
  });
};

export const usePaginatedUsers = (
  page: number,
  limit: number,
  filters: any,
) => {
  return useQuery<UserPaginatedResponse>({
    queryKey: ['dashboard-pagination-users', page, limit, filters],
    queryFn: async () => getUsers(page, limit, filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { deleteUser } = await import('@/services/user.service');
      return deleteUser(userId);
    },
    onSuccess: () => {
      // Invalidar todas las queries de usuarios para refrescar la lista
      queryClient.invalidateQueries({
        queryKey: ['dashboard-pagination-users'],
        exact: false
      });
      queryClient.invalidateQueries({
        queryKey: ['allUsers'], // ✅ Query key correcto usado en DashUserPanel
        exact: false
      });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });

      // También refetch activo para actualización inmediata
      queryClient.refetchQueries({
        queryKey: ['allUsers'],
        type: 'active'
      });
      queryClient.refetchQueries({
        queryKey: ['dashboard-pagination-users'],
        type: 'active'
      });
    },
    onError: (error) => {
      console.error('❌ Error al eliminar usuario:', error);
    }
  });
};
