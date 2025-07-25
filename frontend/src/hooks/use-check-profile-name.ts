import { useQuery } from '@tanstack/react-query';
import { verifyProfileName } from '@/services/user.service';

export const useVerifyProfileName = (profileName: string) => {
    return useQuery({
        queryKey: ['verifyProfileName', profileName],
        queryFn: () => verifyProfileName(profileName),
        enabled: false,
        staleTime: 0,
        gcTime: 0,
    });
};
