export interface FilterQuery {
  category?: string;
  location?: {
    country?: string;
    department?: string;
    city?: string;
  };
  features?: {
    [key: string]: string | string[];
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  availability?: {
    dayOfWeek?: string;
    timeSlot?: {
      start?: string;
      end?: string;
    };
  };
  isActive?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  fields?: string[];
}

export interface FilterResponse {
  profiles: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FilterOptions {
  categories: string[];
  locations: {
    countries: string[];
    departments: string[];
    cities: string[];
  };
  features: {
    [groupKey: string]: string[];
  };
  priceRange: {
    min: number;
    max: number;
  };
}