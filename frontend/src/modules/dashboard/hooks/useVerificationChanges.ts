import { useState } from 'react';
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
    stepKey: 'videoVerification' | 'videoCallRequested',
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
    return verificationData?.data?.steps?.[stepKey]?.isVerified || false;
  };

  const getCurrentVideoLink = (
    stepKey: 'videoVerification' | 'videoCallRequested',
    verificationData?: ProfileVerificationData
  ) => {
    if (stepKey in pendingVideoLinks) {
      return pendingVideoLinks[stepKey];
    }
    return verificationData?.data?.steps?.[stepKey]?.videoLink || '';
  };

  const resetChanges = () => {
    setPendingChanges({});
    setPendingVideoLinks({});
    setHasChanges(false);
  };

  const buildUpdatedSteps = (verificationData: ProfileVerificationData) => {
    // Comenzar con los steps actuales
    const updatedSteps: ProfileVerificationData['data']['steps'] = {
      ...verificationData.data.steps
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
      const key = stepKey as 'videoVerification' | 'videoCallRequested';
      if (updatedSteps[key] && 'videoLink' in updatedSteps[key]) {
        updatedSteps[key] = {
          ...updatedSteps[key],
          videoLink
        };
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