export { default as CouponInput, useCouponInput } from './CouponInput';
export { default as PriceSummary, SimplePriceSummary } from './PriceSummary';

// Re-export types for convenience
export type {
  ICoupon,
  CreateCouponInput,
  UpdateCouponInput,
  CouponValidationResult,
  CouponApplicationResult,
  CouponQuery,
  CouponStats
} from '@/types/coupon.types';