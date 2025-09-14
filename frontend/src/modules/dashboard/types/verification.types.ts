import { ReactNode } from 'react';

export interface ProfileVerificationData {
  _id: string;
  profile: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationProgress: number;
  steps: {
    documentPhotos: {
      documents: string[];
      isVerified: boolean;
    };
    video: {
      videoLink?: string;
      isVerified: boolean;
    };
    socialMedia: {
      accounts: string[];
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
  getCurrentVideoLink: (stepKey: 'video') => string;
  handleVideoLinkChange: (stepKey: 'video', videoLink: string) => void;
}