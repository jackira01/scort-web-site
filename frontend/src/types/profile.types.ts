export interface ProfileMediaItem {
  _id?: string;
  link?: string;
  type?: 'image' | 'video';
}

export interface ProfileMedia {
  gallery?: string[];
  videos?: ProfileMediaItem[];
  audios?: ProfileMediaItem[];
  stories?: { link: string; type: 'image' | 'video' }[];
}

export interface LocationValue {
  value: string; // Valor normalizado (sin tildes, minúsculas)
  label: string; // Valor para mostrar (con tildes, formato original)
}

export interface ProfileLocation {
  country: LocationValue;
  department: LocationValue;
  city: LocationValue;
}

export interface ProfileVerification {
  _id?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationProgress?: number;
  documents?: {
    type: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

// Interfaz base para perfiles compatible con backend
export interface IProfile {
  _id: string;
  user: string;
  name: string;
  description?: string;
  isActive: boolean;
  location: ProfileLocation;
  features: {
    group_id: string;
    value: string | string[];
  }[];
  services?: string[];
  age: string;
  contact: {
    number: string;
    whatsapp?: string;
    telegram?: string;
    changedAt: Date | string;
  };
  height: string;
  media: {
    gallery: string[];
    videos: string[];
    stories: { _id?: string; link: string; type: 'image' | 'video' }[];
    audios: string[];
  };
  availability: {
    dayOfWeek: string;
    slots: {
      start: string;
      end: string;
      timezone: string;
    }[];
  }[];
  verification: ProfileVerification | boolean;
  rates: {
    hour: string;
    price: number;
  }[];
  paymentHistory: string[];
  lastLogin: Date | string;

  // Campos para motor de visibilidad
  planAssignment: {
    planCode: string;
    variantDays: number;
    startAt: Date | string;
    expiresAt: Date | string;
  } | null;
  upgrades: {
    code: string;
    startAt: Date | string;
    endAt: Date | string;
    purchaseAt: Date | string;
  }[];
  lastShownAt?: Date | string;
  visible: boolean;

  // Campos adicionales para UI
  isOnline?: boolean;
  level?: number;
  priority?: number;
  hasDestacadoUpgrade?: boolean;
}

// Mantener Profile para compatibilidad
export interface Profile {
  _id: string;
  name: string;
  age: number;
  location: ProfileLocation;
  description: string;
  media: ProfileMedia;
  verification: ProfileVerification;
  user?: {
    isVerified: boolean;
  };
}

export interface FilterQuery {
  category?: string;
  location?: {
    department?: string;
    city?: string;
  };
  features?: {
    gender?: string;
    age?: string[];
    height?: string[];
    weight?: string[];
    bodyType?: string[];
    ethnicity?: string[];
    hairColor?: string[];
    eyeColor?: string[];
    services?: string[];
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  availability?: {
    days?: string[];
    hours?: {
      start?: string;
      end?: string;
    };
  };
  isActive?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fields?: string[];
}

export interface FilterCounts {
  categories?: Record<string, number>;
  genders?: Record<string, number>;
  sex?: Record<string, number>;
  locations?: Record<string, number>;
}

export interface ProfilesResponse {
  profiles: Profile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filterCounts?: FilterCounts;
}

export interface ProfileCardData {
  _id: string;
  name: string;
  age: number;
  location: ProfileLocation;
  description: string;
  media: ProfileMedia;
  verification: ProfileVerification;
  featured?: boolean;
  online?: boolean;
  hasVideo?: boolean;
}

// Tipos para el feed de Home
export interface HomeFeedProfile extends IProfile {
  level: number;
  priority: number;
}

export interface HomeFeedResponse {
  profiles: HomeFeedProfile[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  metadata: {
    levelSeparators: Array<{
      level: number;
      startIndex: number;
      count: number;
    }>;
  };
}

export interface FeedStatsResponse {
  totalProfiles: number;
  visibleProfiles: number;
  profilesByLevel: Record<number, number>;
  averageLastShownHours: number;
}

export interface HomeFeedOptions {
  page?: number;
  pageSize?: number;
}