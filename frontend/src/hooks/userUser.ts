// src/hooks/useUser.ts
import { getUserById, updateUser } from '@/services/user.service';
import { User } from '@/types/user.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useUser = (userId?: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId, // evita que haga fetch si aún no tienes el ID
    staleTime: 1000 * 60 * 5, // opcional: evita refetch por 5 mins
  });
};

/* export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,

    onSuccess: (_updatedUser, variables) => {
      // variables contiene el objeto { userId, data }
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
}; */