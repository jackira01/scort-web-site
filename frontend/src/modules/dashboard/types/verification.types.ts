import { ReactNode } from 'react';

export interface ProfileVerificationData {
  _id: string;
  profile: string;
  verificationStatus: 'pending' | 'check';
  verificationProgress: number;
  data: {
    steps: {
      documentVerification: {
        frontPhoto?: string;
        backPhoto?: string;
        isVerified: boolean;
      };
      selfieVerification: {
        photo?: string; // Foto con documento al lado del rostro
        isVerified: boolean;
      };
      cartelVerification: {
        mediaLink?: string; // Video o foto de verificación con cartel
        mediaType?: 'video' | 'image';
        isVerified: boolean;
      };
      videoCallRequested: {
        videoLink?: string;
        isVerified: boolean;
      };
      socialMedia: {
        instagram?: string;
        facebook?: string;
        tiktok?: string;
        twitter?: string;
        onlyFans?: string;
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
        };
      };
      deposito?: boolean;
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
  getCurrentVideoLink: (stepKey: 'mediaVerification' | 'videoCallRequested' | 'cartelVerification') => string;
  handleVideoLinkChange: (stepKey: 'mediaVerification' | 'videoCallRequested' | 'cartelVerification', videoLink: string) => void;
}