import { useState, useEffect } from 'react';
import type { ProfileVerificationData } from '../types/verification.types';

interface UseVerificationChangesReturn {
  hasChanges: boolean;
  pendingChanges: Record<string, boolean>;
  pendingVideoLinks: Record<string, string>;
  handleToggleVerification: (stepKey: keyof ProfileVerificationData['data']['steps'], isVerified: boolean) => void;
  handleVideoLinkChange: (stepKey: 'videoVerification' | 'videoCallRequested', videoLink: string) => void;
  getCurrentVerificationStatus: (stepKey: keyof ProfileVerificationData['data']['steps'], verificationData?: ProfileVerificationData) => boolean;
  getCurrentVideoLink: (stepKey: 'videoVerification' | 'videoCallRequested', verificationData?: ProfileVerificationData) => string;
  resetChanges: () => void;
  buildUpdatedSteps: (verificationData: ProfileVerificationData) => ProfileVerificationData['data']['steps'];
}

export const useVerificationChanges = (): UseVerificationChangesReturn => {
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [pendingVideoLinks, setPendingVideoLinks] = useState<Record<string, string>>({});

  // Debug log para monitorear el estado de hasChanges
  useEffect(() => {
    console.log('🔍 useVerificationChanges state:', {
      hasChanges,
      pendingChangesCount: Object.keys(pendingChanges).length,
      pendingChanges,
      pendingVideoLinksCount: Object.keys(pendingVideoLinks).length
    });
  }, [hasChanges, pendingChanges, pendingVideoLinks]);

  const handleToggleVerification = (
    stepKey: keyof ProfileVerificationData['data']['steps'],
    isVerified: boolean
  ) => {
    console.log('🔄 handleToggleVerification called:', { stepKey, isVerified });
    
    setPendingChanges(prev => ({
      ...prev,
      [stepKey]: isVerified
    }));

    setHasChanges(true);
    console.log('✅ Changes updated, hasChanges set to true');
  };

  const handleVideoLinkChange = (
    stepKey: 'mediaVerification' | 'videoCallRequested',
    videoLink: string
  ) => {
    setPendingVideoLinks(prev => ({
      ...prev,
      [stepKey]: videoLink
    }));

    setHasChanges(true);
  };

  const getCurrentVerificationStatus = (
    stepKey: keyof ProfileVerificationData['data']['steps'],
    verificationData?: ProfileVerificationData
  ) => {
    console.log('🔍 getCurrentVerificationStatus called with:', {
      stepKey,
      hasPendingChanges: stepKey in pendingChanges,
      pendingValue: pendingChanges[stepKey],
      verificationDataExists: !!verificationData,
      stepData: verificationData?.data?.steps?.[stepKey],
      isVerified: verificationData?.data?.steps?.[stepKey]?.isVerified
    });

    if (stepKey in pendingChanges) {
      console.log('✅ Returning pending change:', pendingChanges[stepKey]);
      return pendingChanges[stepKey];
    }
    
    const result = verificationData?.data?.steps?.[stepKey]?.isVerified || false;
    console.log('✅ Returning verification data result:', result);
    return result;
  };

  const getCurrentVideoLink = (
    stepKey: 'mediaVerification' | 'videoCallRequested',
    verificationData?: ProfileVerificationData
  ) => {
    if (stepKey in pendingVideoLinks) {
      return pendingVideoLinks[stepKey];
    }
    
    if (stepKey === 'mediaVerification') {
      return verificationData?.data?.steps?.[stepKey]?.mediaLink || '';
    }
    
    return verificationData?.data?.steps?.[stepKey]?.videoLink || '';
  };

  const resetChanges = () => {
    console.log('🔄 Resetting changes');
    setPendingChanges({});
    setPendingVideoLinks({});
    setHasChanges(false);
    console.log('✅ Changes reset completed');
  };

  const buildUpdatedSteps = (verificationData: ProfileVerificationData | any) => {
    console.log('🔧 buildUpdatedSteps called with:', verificationData);
    
    // Determinar la estructura correcta de los datos
    let stepsData;
    
    // Si es la estructura del backend { success: true, data: { _id, steps, ... } }
    if (verificationData?.success && verificationData?.data?.data?.steps) {
      stepsData = verificationData.data.data.steps;
      console.log('📋 Using backend response structure (nested data) for steps');
    }
    // Si es la estructura del backend { success: true, data: { steps: ... } } (sin nested data)
    else if (verificationData?.success && verificationData?.data?.steps) {
      stepsData = verificationData.data.steps;
      console.log('📋 Using backend response structure (direct data) for steps');
    }
    // Si es la estructura directa { data: { steps: ... } }
    else if (verificationData?.data?.steps) {
      stepsData = verificationData.data.steps;
      console.log('📋 Using direct data structure for steps');
    }
    // Si no tiene la estructura esperada
    else {
      console.error('❌ Invalid verificationData structure:', verificationData);
      console.error('Available keys:', verificationData ? Object.keys(verificationData) : 'No data');
      if (verificationData?.data) {
        console.error('Data keys:', Object.keys(verificationData.data));
      }
      throw new Error('Estructura de datos de verificación inválida');
    }

    console.log('📊 Steps data to work with:', stepsData);

    // Comenzar con los steps actuales
    const updatedSteps: ProfileVerificationData['data']['steps'] = {
      ...stepsData
    };

    console.log('🔄 Applying pending changes...');
    console.log('- pendingChanges:', pendingChanges);
    console.log('- pendingVideoLinks:', pendingVideoLinks);

    // Aplicar cambios pendientes de verificación
    Object.entries(pendingChanges).forEach(([stepKey, isVerified]) => {
      const key = stepKey as keyof ProfileVerificationData['data']['steps'];
      if (updatedSteps[key]) {
        console.log(`✏️ Updating ${stepKey} verification to:`, isVerified);
        updatedSteps[key] = {
          ...updatedSteps[key],
          isVerified
        };
      }
    });

    // Aplicar cambios pendientes de video links
    Object.entries(pendingVideoLinks).forEach(([stepKey, videoLink]) => {
      const key = stepKey as 'mediaVerification' | 'videoCallRequested';
      if (updatedSteps[key]) {
        console.log(`🎥 Updating ${stepKey} video link to:`, videoLink);
        
        if (key === 'mediaVerification' && 'mediaLink' in updatedSteps[key]) {
          updatedSteps[key] = {
            ...updatedSteps[key],
            mediaLink: videoLink
          };
        } else if (key === 'videoCallRequested' && 'videoLink' in updatedSteps[key]) {
          updatedSteps[key] = {
            ...updatedSteps[key],
            videoLink
          };
        }
      }
    });

    console.log('✅ Final updated steps:', updatedSteps);
    return updatedSteps;
  };

  return {
    hasChanges,
    pendingChanges,
    pendingVideoLinks,
    handleToggleVerification,
    handleVideoLinkChange,
    getCurrentVerificationStatus,
    getCurrentVideoLink,
    resetChanges,
    buildUpdatedSteps,
  };
};