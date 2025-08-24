import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateProfile } from '@/services/user.service';

interface UseUpdateProfileMutationProps {
  profileId: string;
  onSuccess?: () => void;
}

export const useUpdateProfileMutation = ({
  profileId,
  onSuccess
}: UseUpdateProfileMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: { isActive?: boolean; [key: string]: any }) => {
      return updateProfile(profileId, profileData);
    },
    onSuccess: () => {
      toast.success('Perfil actualizado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['profile', profileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['allProfiles'],
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Error al actualizar el perfil');
    },
  });
};