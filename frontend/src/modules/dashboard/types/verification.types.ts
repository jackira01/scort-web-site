import { ReactNode } from 'react';

export interface ProfileVerificationData {
  _id: string;
  profile: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationProgress: number;
  steps: {
    documentPhotos: {
      frontPhoto?: string;
      backPhoto?: string;
      selfieWithDocument?: string;
      isVerified: boolean;
    };
    videoVerification: {
      videoLink?: string;
      isVerified: boolean;
    };
    socialMedia: {
      isVerified: boolean;
    };
  };
}

export interface VerificationStep {
  key: keyof ProfileVerificationData['steps'];
  label: string;
  icon: ReactNode;
  description: string;
}

export interface AdminProfileVerificationCarouselProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  profileId: string;
}

export interface VerificationStepRenderProps {
  step: VerificationStep;
  stepData: any;
  onPreviewImage: (image: string) => void;
  getCurrentVideoLink: (stepKey: 'videoVerification') => string;
  handleVideoLinkChange: (stepKey: 'videoVerification', videoLink: string) => void;
}