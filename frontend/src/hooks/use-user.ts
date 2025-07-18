import { getUserById, updateUser } from '@/services/user.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { User } from '@/types/user.types';

export const useUser = () => {
  const { data: session } = useSession();
  const userId = session?.user?._id;

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId, // solo se activa si hay ID
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) => {
      if (!userId) throw new Error('User ID not available');
      return updateUser(userId, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
};

