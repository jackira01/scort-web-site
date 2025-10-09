/* export interface UserProfile {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
    verificationInProgress: boolean;
    plan: 'Gratis' | 'Premium' | 'VIP';
    lastConnection: string;
    verificationImages?: string[];
} */
export interface BaseUser {
  _id: string;
  isVerified?: boolean;
  verification_in_progress?: boolean;
  role?: 'admin' | 'user' | 'guest';
  accountType?: 'common' | 'agency';
  agencyInfo?: {
    businessName?: string;
    businessDocument?: string;
    conversionRequestedAt?: Date | string;
    conversionApprovedAt?: Date | string;
    conversionApprovedBy?: string;
    conversionStatus: 'pending' | 'approved' | 'rejected';
  };
  emailVerified?: string;
}
export interface User extends BaseUser {
  email?: string;
  name: string;
  verificationDocument: string[];
  profiles?: Profile[];
  password?: string;
  role: 'admin' | 'user' | 'guest';
  accountType: 'common' | 'agency';
  agencyInfo?: {
    businessName?: string;
    businessDocument?: string;
    conversionRequestedAt?: Date | string;
    conversionApprovedAt?: Date | string;
    conversionApprovedBy?: string;
    conversionStatus: 'pending' | 'approved' | 'rejected';
  };
}


export interface Profile {
  _id: string;
  user: string;
  name: string;
  description?: string;
  location: {
    country: {
      value: string;
      label: string;
    };
    department: {
      value: string;
      label: string;
    };
    city: {
      value: string;
      label: string;
    };
  };
  features: Array<{
    group_id: string;
    value: string[];
  }>;
  age: string;
  contact: {
    number?: string;
    whatsapp?: string;
    telegram?: string;
    changedAt?: Date;
  };
  height: string;
  basicServices: string[];
  additionalServices: string[];
  socialMedia: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    onlyFans?: string;
  };
  media: {
    gallery: string[];
    videos: Array<{
      url: string;
      thumbnail: string;
    }>;
    profilePicture: string;
  };
  services: string[];
  planAssignment?: {
    planId?: string;
    planCode?: string;
    variantDays: number;
    startAt: Date;
    expiresAt: Date;
  };
  upgrades: Array<{
    code: string;
    startAt: Date;
    endAt: Date;
  }>;
  activeUpgrades: Array<{
    code: string;
    startAt: Date;
    endAt: Date;
  }>;
  hasDestacadoUpgrade: boolean;
  hasImpulsoUpgrade: boolean;
  visible: boolean;
  isActive: boolean;
}

export interface UserPaginatedResponse {
  docs: User[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}
