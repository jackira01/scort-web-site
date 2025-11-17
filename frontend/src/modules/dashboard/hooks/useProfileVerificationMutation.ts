import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface UseProfileVerificationMutationProps {
  profileId: string;
  verificationId?: string;
  onSuccess?: () => void;
}

export const useProfileVerificationMutation = ({
  profileId,
  verificationId,
  onSuccess
}: UseProfileVerificationMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stepsData: Record<string, any>) => {

      if (!verificationId) {
        throw new Error('ID de verificación no disponible');
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/profile-verification/${verificationId}/steps`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stepsData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la verificación');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      toast.success('Cambios guardados exitosamente. Se ha notificado a la empresa para revisión.');
      queryClient.invalidateQueries({
        queryKey: ['profileVerification', profileId],
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar los cambios');
    },
  });
};