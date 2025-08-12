import { useQuery } from '@tanstack/react-query';
import { verifyProfileName } from '@/services/user.service';

export const useVerifyProfileName = (profileName: string) => {
    return useQuery({
        queryKey: ['verifyProfileName', profileName],
        queryFn: () => verifyProfileName(profileName),
        enabled: false, // Solo se ejecuta manualmente
        staleTime: 30 * 1000, // 30 segundos - verificación de nombres
        gcTime: 2 * 60 * 1000, // 2 minutos en cache
    });
};
