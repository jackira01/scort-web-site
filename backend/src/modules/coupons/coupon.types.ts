export interface ICoupon {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'plan_assignment';
  value: number; // Para percentage: 0-100, para fixed_amount: precio final, para plan_assignment: no aplica
  planCode?: string; // Solo para type: 'plan_assignment'
  variantDays?: number; // Solo para type: 'plan_assignment' - días específicos de la variante
  applicablePlans?: string[]; // Códigos de planes donde se puede aplicar el cupón
  validPlanIds?: string[]; // Lista de planes específicos donde se puede usar (para percentage y fixed_amount)
  validUpgradeIds?: string[]; // Lista de upgrades específicos donde se puede usar (para percentage y fixed_amount)
  maxUses: number; // -1 para ilimitado
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdBy: string; // ID del admin que creó el cupón
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'plan_assignment';
  value: number;
  planCode?: string;
  variantDays?: number; // Solo para type: 'plan_assignment' - días específicos de la variante
  applicablePlans?: string[];
  validPlanIds?: string[]; // Lista de planes específicos donde se puede usar (para percentage y fixed_amount)
  validUpgradeIds?: string[]; // Lista de upgrades específicos donde se puede usar (para percentage y fixed_amount)
  maxUses: number;
  validFrom: Date;
  validUntil: Date;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  name?: string;
  description?: string;
  value?: number;
  planCode?: string;
  variantDays?: number; // Solo para type: 'plan_assignment' - días específicos de la variante
  applicablePlans?: string[];
  validPlanIds?: string[]; // Lista de planes específicos donde se puede usar (para percentage y fixed_amount)
  validUpgradeIds?: string[]; // Lista de upgrades específicos donde se puede usar (para percentage y fixed_amount)
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: ICoupon;
}

export interface CouponApplicationResult {
  success: boolean;
  originalPrice: number;
  finalPrice: number;
  discount: number;
  planCode?: string; // Para plan_assignment
  variantDays?: number; // Para plan_assignment - días específicos de la variante
  error?: string;
}

export interface CouponQuery {
  code?: string;
  type?: string;
  isActive?: boolean;
  validOnly?: boolean; // Solo cupones vigentes
  page?: number;
  limit?: number;
}