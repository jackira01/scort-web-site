import { useState, useEffect, useMemo } from 'react';
import { usePlans } from '@/hooks/usePlans';
import { useConfigValue } from '@/hooks/use-config-parameters';
import { ContentLimits, DefaultPlanConfig } from '../types';

export const useContentLimits = (selectedPlan: any) => {
    const [contentLimits, setContentLimits] = useState<ContentLimits>({
        maxPhotos: 20,
        maxVideos: 8,
        maxAudios: 6
    });

    // Obtener planes disponibles
    const { data: plansResponse } = usePlans({
        limit: 50,
        page: 1,
        isActive: true
    });

    // Memoizar plans
    const plans = useMemo(() => {
        return plansResponse?.plans || [];
    }, [plansResponse?.plans]);

    // Obtener configuración del plan por defecto
    const { value: defaultConfigRaw } = useConfigValue<DefaultPlanConfig>(
        'system.default_plan',
        {
            enabled: true,
            defaultValue: { enabled: false, planId: null, planCode: null }
        }
    );

    // Memoizar defaultConfig
    const defaultConfig = useMemo(() => {
        return defaultConfigRaw;
    }, [defaultConfigRaw?.enabled, defaultConfigRaw?.planId, defaultConfigRaw?.planCode]);

    // Cargar límites del plan por defecto o seleccionado
    useEffect(() => {
        if (selectedPlan && selectedPlan.contentLimits) {
            setContentLimits({
                maxPhotos: selectedPlan.contentLimits.photos?.max || 20,
                maxVideos: selectedPlan.contentLimits.videos?.max || 8,
                maxAudios: selectedPlan.contentLimits.audios?.max || 6
            });
        } else if (defaultConfig?.enabled && defaultConfig.planId && plans.length > 0) {
            const defaultPlan = plans.find(plan => plan._id === defaultConfig.planId);

            if (defaultPlan && defaultPlan.contentLimits) {
                setContentLimits({
                    maxPhotos: defaultPlan.contentLimits.photos?.max || 20,
                    maxVideos: defaultPlan.contentLimits.videos?.max || 8,
                    maxAudios: defaultPlan.contentLimits.audios?.max || 6
                });
            }
        } else {
            setContentLimits({
                maxPhotos: 5,
                maxVideos: 2,
                maxAudios: 2
            });
        }
    }, [defaultConfig, plans, selectedPlan?._id, selectedPlan?.contentLimits]);

    return { contentLimits, plans };
};
