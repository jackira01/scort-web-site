import type { Types } from 'mongoose';

// DTO para actualizar pasos específicos de verificación (Nueva estructura)
export interface UpdateVerificationStepsDTO {
  frontPhotoVerification?: {
    photo?: string;
    isVerified?: boolean;
  };
  selfieVerification?: {
    photo?: string;
    isVerified?: boolean;
  };
  mediaVerification?: {
    mediaLink?: string;
    mediaType?: 'video' | 'image';
    isVerified?: boolean;
  };
  videoCallRequested?: {
    videoLink?: string;
    isVerified?: boolean;
  };
  socialMedia?: {
    isVerified?: boolean;
  };
  phoneChangeDetected?: boolean;
  lastLogin?: {
    isVerified?: boolean;
    date?: Date | null;
  };
  // Campos computados dinámicamente (no se guardan en DB)
  accountAge?: {
    isVerified: boolean;
    status: 'verified' | 'pending';
  };
  contactConsistency?: {
    isVerified: boolean;
    status: 'verified' | 'pending';
    debug?: {
      hasChanged?: boolean;
      lastChangeDate?: Date;
      hasContactNumber?: boolean;
      calculatedAt?: string;
    };
  };
}

// DTO para crear verificación de perfil
export interface CreateProfileVerificationDTO {
  profile: Types.ObjectId | string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  steps?: UpdateVerificationStepsDTO;
  verifiedAt?: Date;
  verificationFailedAt?: Date;
  verificationFailedReason?: string;
}

// DTO para actualizar verificación de perfil
export interface UpdateProfileVerificationDTO {
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  steps?: UpdateVerificationStepsDTO;
  verifiedAt?: Date;
  verificationFailedAt?: Date;
  verificationFailedReason?: string;
}

// DTO para actualizar estado de verificación
export interface UpdateVerificationStatusDTO {
  status: 'pending' | 'verified' | 'rejected';
  reason?: string;
}

// DTO para filtros de búsqueda
export interface ProfileVerificationFiltersDTO {
  status?: 'pending' | 'verified' | 'rejected';
  page?: number;
  limit?: number;
  profileId?: string;
  userId?: string;
}

// Respuesta de verificación con información del perfil
export interface ProfileVerificationResponseDTO {
  _id: string;
  profile: {
    _id: string;
    name: string;
    user: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationProgress: number;
  steps?: {
    frontPhotoVerification?: {
      photo?: string;
      isVerified?: boolean;
    };
    selfieVerification?: {
      photo?: string;
      isVerified?: boolean;
    };
    mediaVerification?: {
      mediaLink?: string;
      mediaType?: 'video' | 'image';
      isVerified?: boolean;
    };
    videoCallRequested?: {
      videoLink?: string;
      isVerified?: boolean;
    };
    socialMedia?: {
      isVerified?: boolean;
    };
    phoneChangeDetected?: boolean;
    lastLogin?: {
      isVerified?: boolean;
      date?: Date | null;
    };
    // Campos computados dinámicamente (no se guardan en DB)
    accountAge?: {
      isVerified: boolean;
      status: 'verified' | 'pending';
    };
    contactConsistency?: {
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
  verifiedAt?: Date;
  verificationFailedAt?: Date;
  verificationFailedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}