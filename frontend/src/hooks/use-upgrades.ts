import { useQuery } from '@tanstack/react-query';
import { getAvailableUpgrades } from '@/services/upgrade.service';

export interface UpgradeDefinition {
    _id: string;
    code: string;
    name: string;
    price: number;
    durationHours: number;
    requires: string[];
    stackingPolicy: 'extend' | 'replace' | 'reject';
    effect: {
        levelDelta?: number;
        setLevelTo?: number;
        priorityBonus: number;
        positionRule: 'BY_SCORE' | 'BACK' | 'FRONT';
    };
    active: boolean;
}

export const useUpgrades = () => {
    return useQuery<{ upgrades: UpgradeDefinition[] }>({
        queryKey: ['upgrades'],
        queryFn: getAvailableUpgrades,
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false,
    });
};
