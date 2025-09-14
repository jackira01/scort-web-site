// Tipos para planes y upgrades basados en la estructura del backend

export interface PlanVariant {
  days: number;
  price: number;
  durationRank: number;
}

export interface PlanFeatures {
  showInHome: boolean;
  showInFilters: boolean;
  showInSponsored: boolean;
}

export interface ContentLimits {
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
}

export interface Plan {
  _id: string;
  code: string;
  name: string;
  description?: string;
  level: number;
  variants: PlanVariant[];
  features: PlanFeatures;
  contentLimits: ContentLimits;
  includedUpgrades: string[];
  active: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

export interface UpgradeEffect {
  levelDelta?: number; // -1 sube un nivel (mejora)
  setLevelTo?: number; // si quieres que un upgrade salte directo a un nivel
  priorityBonus?: number; // suma al score dentro del nivel
  positionRule?: 'FRONT' | 'BACK' | 'BY_SCORE'; // cómo se inserta temporalmente
}

export interface Upgrade {
  _id?: string;
  code: string;
  name: string;
  description?: string; // opcional en el backend
  price?: number; // opcional en el backend
  durationHours: number; // duración en horas
  requires: string[]; // códigos de upgrades requeridos
  stackingPolicy: 'extend' | 'replace' | 'reject';
  effect: UpgradeEffect; // singular, no plural
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipos para formularios
export interface CreatePlanRequest {
  code: string;
  name: string;
  level: number;
  variants: PlanVariant[];
  features: PlanFeatures;
  contentLimits: ContentLimits;
  includedUpgrades: string[];
  active: boolean;
}

export interface UpdatePlanRequest extends Partial<CreatePlanRequest> {
  _id: string;
}

export interface CreateUpgradeRequest {
  code: string;
  name: string;
  description?: string;
  price?: number;
  durationHours: number;
  requires: string[];
  stackingPolicy: 'extend' | 'replace' | 'reject';
  effect: UpgradeEffect;
  active: boolean;
}

export interface UpdateUpgradeRequest extends Partial<CreateUpgradeRequest> {
  _id: string;
}

// Tipos para respuestas de API
export interface PlansResponse {
  plans: Plan[];
  total: number;
  page: number;
  limit: number;
}

export interface UpgradesResponse {
  upgrades: Upgrade[];
  total: number;
  page: number;
  limit: number;
}

// Tipos para filtros y paginación
export interface PlansFilters {
  isActive?: boolean;
  level?: number;
  search?: string;
}

export interface UpgradesFilters {
  active?: boolean;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Tipos para el estado del componente
export interface PlansManagerState {
  activeTab: 'plans' | 'upgrades';
  selectedPlan?: Plan;
  selectedUpgrade?: Upgrade;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
}

// Constantes para validación
export const PLAN_LEVELS = {
  DIAMANTE: 1,
  ORO: 2,
  ESMERALDA: 3,
  ZAFIRO: 4,
  AMATISTA: 5
} as const;

export const UPGRADE_EFFECT_TYPES = {
  HIGHLIGHT: 'HIGHLIGHT',
  BOOST: 'BOOST',
  FEATURE_ACCESS: 'FEATURE_ACCESS',
  CONTENT_LIMIT: 'CONTENT_LIMIT'
} as const;

export type PlanLevel = typeof PLAN_LEVELS[keyof typeof PLAN_LEVELS];
export type UpgradeEffectType = typeof UPGRADE_EFFECT_TYPES[keyof typeof UPGRADE_EFFECT_TYPES];