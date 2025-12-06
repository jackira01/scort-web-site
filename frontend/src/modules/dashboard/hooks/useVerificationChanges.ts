import { useState, useEffect } from 'react';
import type { ProfileVerificationData } from '../types/verification.types';

interface UseVerificationChangesReturn {
  hasChanges: boolean;
  pendingChanges: Record<string, boolean>;
  pendingVideoLinks: Record<string, string>;
  handleToggleVerification: (stepKey: keyof ProfileVerificationData['data']['steps'], isVerified: boolean) => void;
  handleVideoLinkChange: (stepKey: 'cartelVerification' | 'videoCallRequested', videoLink: string) => void;
  getCurrentVerificationStatus: (stepKey: keyof ProfileVerificationData['data']['steps'], verificationData?: ProfileVerificationData) => boolean;
  getCurrentVideoLink: (stepKey: 'cartelVerification' | 'videoCallRequested', verificationData?: ProfileVerificationData) => string;
  resetChanges: () => void;
  buildUpdatedSteps: (verificationData: ProfileVerificationData) => ProfileVerificationData['data']['steps'];
}

export const useVerificationChanges = (): UseVerificationChangesReturn => {
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [pendingVideoLinks, setPendingVideoLinks] = useState<Record<string, string>>({});

  // Debug log para monitorear el estado de hasChanges
  useEffect(() => {
  }, [hasChanges, pendingChanges, pendingVideoLinks]);

  const handleToggleVerification = (
    stepKey: keyof ProfileVerificationData['data']['steps'],
    isVerified: boolean
  ) => {

    setPendingChanges(prev => ({
      ...prev,
      [stepKey]: isVerified
    }));

    setHasChanges(true);
  };

  const handleVideoLinkChange = (
    stepKey: 'cartelVerification' | 'videoCallRequested',
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

    if (stepKey in pendingChanges) {
      return pendingChanges[stepKey];
    }

    const result = verificationData?.data?.steps?.[stepKey]?.isVerified || false;
    return result;
  };

  const getCurrentVideoLink = (
    stepKey: 'cartelVerification' | 'videoCallRequested',
    verificationData?: ProfileVerificationData
  ) => {
    if (stepKey in pendingVideoLinks) {
      return pendingVideoLinks[stepKey];
    }

    if (stepKey === 'cartelVerification') {
      return verificationData?.data?.steps?.[stepKey]?.mediaLink || '';
    }

    return verificationData?.data?.steps?.[stepKey]?.videoLink || '';
  };

  const resetChanges = () => {
    setPendingChanges({});
    setPendingVideoLinks({});
    setHasChanges(false);
  };

  const buildUpdatedSteps = (verificationData: ProfileVerificationData | any) => {

    // Determinar la estructura correcta de los datos
    let stepsData;

    // Si es la estructura del backend { success: true, data: { _id, steps, ... } }
    if (verificationData?.success && verificationData?.data?.data?.steps) {
      stepsData = verificationData.data.data.steps;
    }
    // Si es la estructura del backend { success: true, data: { steps: ... } } (sin nested data)
    else if (verificationData?.success && verificationData?.data?.steps) {
      stepsData = verificationData.data.steps;
    }
    // Si es la estructura directa { data: { steps: ... } }
    else if (verificationData?.data?.steps) {
      stepsData = verificationData.data.steps;
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

    // Comenzar con los steps actuales
    const updatedSteps: ProfileVerificationData['data']['steps'] = {
      ...stepsData
    };

    // Aplicar cambios pendientes de verificación
    Object.entries(pendingChanges).forEach(([stepKey, isVerified]) => {
      const key = stepKey as keyof ProfileVerificationData['data']['steps'];
      if (updatedSteps[key]) {
        updatedSteps[key] = {
          ...updatedSteps[key],
          isVerified
        };
      }
    });

    // Aplicar cambios pendientes de video links
    Object.entries(pendingVideoLinks).forEach(([stepKey, videoLink]) => {
      const key = stepKey as 'cartelVerification' | 'videoCallRequested';
      if (updatedSteps[key]) {

        if (key === 'cartelVerification' && 'mediaLink' in updatedSteps[key]) {
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
