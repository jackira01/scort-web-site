export interface ProfileMediaItem {
  _id?: string;
  link?: string;
  type?: 'image' | 'video';
}

export interface ProfileMedia {
  gallery?: string[];
  videos?: ProfileMediaItem[];
  audios?: ProfileMediaItem[];
}

export interface ProfileLocation {
  state: string;
  city: string;
}

export interface ProfileVerification {
  isVerified: boolean;
  verifiedAt?: Date;
  documents?: {
    type: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

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

export interface ProfilesResponse {
  profiles: Profile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProfiles: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
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