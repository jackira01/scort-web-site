// Re-export all types from plans.ts
export * from './plans';

// Additional types for compatibility
export interface IPlanDefinition {
  _id: string;
  code: string;
  name: string;
  description?: string;
  level: number;
  variants: {
    days: number;
    price: number;
    durationRank: number;
  }[];
  features: {
    showInHome: boolean;
    showInFilters: boolean;
    showInSponsored: boolean;
  };
  contentLimits: {
    photos: {
      min: number;
      max: number;
    };
    videos: {
      min: number;
      max: number;
    };
    audios: {
      min: number;
      max: number;
    };
    storiesPerDayMax: number;
  };
  includedUpgrades: string[];
  active: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}