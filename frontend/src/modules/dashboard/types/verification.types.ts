import { ReactNode } from 'react';

export interface ProfileVerificationData {
  _id: string;
  profile: string;
  verificationStatus: 'pending' | 'check';
  verificationProgress: number;
  data: {
    steps: {
      frontPhotoVerification: {
        photo?: string;
        isVerified: boolean;
      };
      backPhotoVerification: {
        photo?: string; // Foto reverso del documento de identidad
        isVerified: boolean;
      };
      selfieVerification: {
        photo?: string; // Foto con documento al lado del rostro
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
      accountAge: {
        isVerified: boolean;
        status: 'verified' | 'pending';
      };
      contactConsistency: {
        isVerified: boolean;
        status: 'verified' | 'pending';
        debug?: {
          hasChanged?: boolean;
          lastChangeDate?: Date;
          hasContactNumber?: boolean;
          calculatedAt?: string;
        };
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