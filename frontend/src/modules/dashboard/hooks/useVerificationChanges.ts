import { useState } from 'react';
import type { ProfileVerificationData } from '../types/verification.types';

interface UseVerificationChangesReturn {
  hasChanges: boolean;
  pendingChanges: Record<string, boolean>;
  pendingVideoLinks: Record<string, string>;
  handleToggleVerification: (stepKey: keyof ProfileVerificationData['steps'], isVerified: boolean) => void;
  handleVideoLinkChange: (stepKey: 'videoVerification', videoLink: string) => void;
  getCurrentVerificationStatus: (stepKey: keyof ProfileVerificationData['steps'], verificationData?: ProfileVerificationData) => boolean;
  getCurrentVideoLink: (stepKey: 'videoVerification', verificationData?: ProfileVerificationData) => string;
  resetChanges: () => void;
  buildUpdatedSteps: (verificationData: ProfileVerificationData) => ProfileVerificationData['steps'];
}

export const useVerificationChanges = (): UseVerificationChangesReturn => {
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [pendingVideoLinks, setPendingVideoLinks] = useState<Record<string, string>>({});

  const handleToggleVerification = (
    stepKey: keyof ProfileVerificationData['steps'],
    isVerified: boolean,
  ) => {
    setPendingChanges(prev => ({
      ...prev,
      [stepKey]: isVerified
    }));

    setHasChanges(true);
  };

  const handleVideoLinkChange = (
    stepKey: 'videoVerification',
    videoLink: string,
  ) => {
    setPendingVideoLinks(prev => ({
      ...prev,
      [stepKey]: videoLink
    }));

    setHasChanges(true);
  };

  const getCurrentVerificationStatus = (
    stepKey: keyof ProfileVerificationData['steps'],
    verificationData?: ProfileVerificationData
  ) => {
    if (stepKey in pendingChanges) {
      return pendingChanges[stepKey];
    }
    return verificationData?.steps?.[stepKey]?.isVerified || false;
  };

  const getCurrentVideoLink = (
    stepKey: 'videoVerification',
    verificationData?: ProfileVerificationData
  ) => {
    if (stepKey in pendingVideoLinks) {
      return pendingVideoLinks[stepKey];
    }
    return verificationData?.steps?.[stepKey]?.videoLink || '';
  };

  const resetChanges = () => {
    setPendingChanges({});
    setPendingVideoLinks({});
    setHasChanges(false);
  };

  const buildUpdatedSteps = (verificationData: ProfileVerificationData) => {
    const currentSteps = verificationData.steps;
    const updatedSteps: ProfileVerificationData['steps'] = {
      documentPhotos: {
        frontPhoto: currentSteps.documentPhotos?.frontPhoto || '',
        backPhoto: currentSteps.documentPhotos?.backPhoto || '',
        selfieWithDocument: currentSteps.documentPhotos?.selfieWithDocument || '',
        isVerified: currentSteps.documentPhotos?.isVerified || false
      },
      videoVerification: {
        videoLink: currentSteps.videoVerification?.videoLink,
        isVerified: currentSteps.videoVerification?.isVerified || false
      },
      socialMedia: {
        isVerified: currentSteps.socialMedia?.isVerified || false
      }
    };

    // Aplicar los cambios pendientes de verificación
    Object.entries(pendingChanges).forEach(([stepKey, isVerified]) => {
      if (stepKey === 'documentPhotos') {
        updatedSteps.documentPhotos.isVerified = isVerified;
      } else if (stepKey === 'videoVerification') {
        updatedSteps.videoVerification.isVerified = isVerified;
      } else if (stepKey === 'socialMedia') {
        updatedSteps.socialMedia.isVerified = isVerified;
      }
    });

    // Aplicar los cambios pendientes de videoLink
    Object.entries(pendingVideoLinks).forEach(([stepKey, videoLink]) => {
      if (stepKey === 'videoVerification') {
        updatedSteps.videoVerification.videoLink = videoLink;
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