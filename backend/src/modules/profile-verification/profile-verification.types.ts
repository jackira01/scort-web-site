import type { Types } from 'mongoose';

// DTO para crear verificación de perfil (campos opcionales para flexibilidad)
export interface CreateProfileVerificationDTO {
  profile: Types.ObjectId | string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  documentPhotos?: {
    documents: string[];
    isVerified: boolean;
  };
  selfieWithDoc?: {
    photo: string;
    isVerified: boolean;
  };
  facePhotos?: boolean;
  fullBodyPhotos?: boolean;
  video?: string;
  videoCallRequested?: {
    videoLink: string;
    isVerified: boolean;
  };
  socialMedia?: boolean;
  lastSeen?: Date;
  phoneChangeDetected?: boolean;
  lastLogin?: {
    isVerified?: boolean;
    date?: Date | null;
  };
  verifiedAt?: Date;
  verificationFailedAt?: Date;
  verificationFailedReason?: string;
}

// DTO para crear verificación completa (todos los campos requeridos)
export interface CreateCompleteProfileVerificationDTO {
  profile: Types.ObjectId | string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  documentPhotos: {
    documents: string[];
    isVerified: boolean;
  };
  selfieWithDoc: {
    photo: string;
    isVerified: boolean;
  };
  facePhotos: boolean;
  fullBodyPhotos: boolean;
  video: string;
  videoCallRequested: {
    videoLink: string;
    isVerified: boolean;
  };
  socialMedia: boolean;
  lastSeen?: Date;
  phoneChangeDetected?: boolean;
  lastLogin?: {
    isVerified?: boolean;
    date?: Date | null;
  };
  verifiedAt?: Date;
  verificationFailedAt?: Date;
  verificationFailedReason?: string;
}

// DTO para actualizar verificación de perfil
export interface UpdateProfileVerificationDTO {
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  documentPhotos?: {
    documents?: string[];
    isVerified?: boolean;
  };
  selfieWithDoc?: {
    photo?: string;
    isVerified?: boolean;
  };
  facePhotos?: boolean;
  fullBodyPhotos?: boolean;
  video?: string;
  videoCallRequested?: {
    videoLink?: string;
    isVerified?: boolean;
  };
  socialMedia?: boolean;
  lastSeen?: Date;
  phoneChangeDetected?: boolean;
  lastLogin?: {
    isVerified?: boolean;
    date?: Date | null;
  };
  verifiedAt?: Date;
  verificationFailedAt?: Date;
  verificationFailedReason?: string;
  steps?: {
    documentPhotos?: {
      documents?: string[];
      isVerified?: boolean;
    };
    selfieWithPoster?: {
      photo?: string;
      isVerified?: boolean;
    };
    selfieWithDoc?: {
      photo?: string;
      isVerified?: boolean;
    };
    fullBodyPhotos?: {
      photos?: string[];
      isVerified?: boolean;
    };
    video?: {
      videoUrl?: string;
      isVerified?: boolean;
    };
    videoCallRequested?: {
      videoLink?: string;
      isVerified?: boolean;
    };
    socialMedia?: {
      accounts?: string[];
      isVerified?: boolean;
    };
    phoneChangeDetected?: boolean;
    lastLogin?: {
      isVerified?: boolean;
      date?: Date | null;
    };
  };
}

// DTO para actualizar estado de verificación
export interface UpdateVerificationStatusDTO {
  status: 'pending' | 'verified' | 'rejected';
  reason?: string;
}

// DTO para actualizar pasos específicos de verificación
export interface UpdateVerificationStepsDTO {
  documentPhotos?: {
    documents?: string[];
    isVerified?: boolean;
  };
  selfieWithPoster?: {
    photo?: string;
    isVerified?: boolean;
  };
  selfieWithDoc?: {
    photo?: string;
    isVerified?: boolean;
  };
  fullBodyPhotos?: {
    photos?: string[];
    isVerified?: boolean;
  };
  video?: {
    videoUrl?: string;
    isVerified?: boolean;
  };
  videoCallRequested?: {
    videoLink?: string;
    isVerified?: boolean;
  };
  socialMedia?: {
    accounts?: string[];
    isVerified?: boolean;
  };
  phoneChangeDetected?: boolean;
  lastLogin?: {
    isVerified?: boolean;
    date?: Date | null;
  };
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
  documentPhotos?: {
    documents: string[];
    isVerified: boolean;
  };
  selfieWithDoc?: {
    photo: string;
    isVerified: boolean;
  };
  facePhotos?: boolean;
  fullBodyPhotos?: boolean;
  video?: string;
  videoCallRequested?: {
    videoLink: string;
    isVerified: boolean;
  };
  socialMedia?: boolean;
  lastSeen?: Date;
  phoneChangeDetected?: boolean;
  verifiedAt?: Date;
  verificationFailedAt?: Date;
  verificationFailedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}