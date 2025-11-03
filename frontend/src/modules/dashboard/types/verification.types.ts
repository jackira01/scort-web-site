import { ReactNode } from 'react';

export interface ProfileVerificationData {
  _id: string;
  profile: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationProgress: number;
  data: {
    steps: {
      documentPhotos: {
        frontPhoto?: string;
        selfieWithDocument?: string; // Foto con documento al lado del rostro
        isVerified: boolean;
      };
      mediaVerification: {
        mediaLink?: string; // Video o foto de verificación con cartel
        mediaType?: 'video' | 'image';
        isVerified: boolean;
      };
      videoCallRequested: {
        videoLink?: string;
        isVerified: boolean;
      };
      socialMedia: {
        isVerified: boolean;
      };
    };
  };
}

export interface VerificationStep {
  key: keyof ProfileVerificationData['data']['steps'];
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
  stepData: ProfileVerificationData['data']['steps'][keyof ProfileVerificationData['data']['steps']] | undefined;
  onPreviewImage: (image: string) => void;
  getCurrentVideoLink: (stepKey: 'mediaVerification' | 'videoCallRequested') => string;
  handleVideoLinkChange: (stepKey: 'mediaVerification' | 'videoCallRequested', videoLink: string) => void;
}