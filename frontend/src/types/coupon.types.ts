export interface ICoupon {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'plan_assignment' | 'plan_specific';
  value: number;
  planCode?: string;
  variantDays?: number; // Solo para type: 'plan_assignment' - días específicos de la variante
  applicablePlans?: string[];
  validPlanIds?: string[]; // Para cupones plan_specific - IDs de planes válidos
  validUpgradeIds?: string[]; // Para cupones plan_specific - IDs de upgrades válidos
  maxUses: number;
  currentUses: number;
  remainingUses?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'plan_assignment' | 'plan_specific';
  value: number;
  planCode?: string;
  variantDays?: number; // Solo para type: 'plan_assignment' - días específicos de la variante
  applicablePlans?: string[];
  validPlanIds?: string[]; // Para cupones plan_specific - IDs de planes válidos
  validUpgradeIds?: string[]; // Para cupones plan_specific - IDs de upgrades válidos
  maxUses: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  name?: string;
  description?: string;
  value?: number;
  planCode?: string;
  variantDays?: number; // Solo para type: 'plan_assignment' - días específicos de la variante
  applicablePlans?: string[];
  validPlanIds?: string[]; // Para cupones plan_specific - IDs de planes válidos
  validUpgradeIds?: string[]; // Para cupones plan_specific - IDs de upgrades válidos
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: {
    code: string;
    name: string;
    type: string;
    value: number;
    planCode?: string;
  };
}

export interface CouponApplicationResult {
  success: boolean;
  originalPrice: number;
  finalPrice: number;
  discount: number;
  discountPercentage: number;
  planCode?: string;
  variantDays?: number; // Para plan_assignment - días específicos de la variante
  error?: string;
}

export interface CouponQuery {
  code?: string;
  type?: string;
  isActive?: boolean;
  validOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface CouponStats {
  total: number;
  active: number;
  expired: number;
  exhausted: number;
  byType: {
    percentage?: number;
    fixed_amount?: number;
    plan_assignment?: number;
    plan_specific?: number;
  };
}

export interface CouponResponse {
  success: boolean;
  message?: string;
  data?: ICoupon | ICoupon[] | CouponStats;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}