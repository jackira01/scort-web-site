export interface ICoupon {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'plan_assignment';
  value: number; // Para percentage: 0-100, para fixed_amount: precio final, para plan_assignment: no aplica
  planCode?: string; // Solo para type: 'plan_assignment'
  applicablePlans?: string[]; // Códigos de planes donde se puede aplicar el cupón
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
  applicablePlans?: string[];
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
  applicablePlans?: string[];
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