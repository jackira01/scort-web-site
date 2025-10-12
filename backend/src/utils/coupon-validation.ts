import type { ICoupon } from '../modules/coupons/coupon.types';

/**
 * 🎯 Valida si un cupón es aplicable a un plan específico
 * Esta función implementa la lógica para cupones con validPlanIds y validUpgradeIds
 * que se aplican a cupones de tipo percentage y fixed_amount
 * 
 * @param coupon - El cupón a validar
 * @param planId - ID del plan (opcional)
 * @param upgradeId - ID del upgrade (opcional)
 * @returns true si el cupón es válido para el plan/upgrade
 */
export const isCouponValidForPlan = (
  coupon: ICoupon,
  planId?: string,
  upgradeId?: string
): boolean | undefined => {
  // 📝 Log para debugging
  console.log('🔍 [COUPON VALIDATION] Validando cupón:', {
    code: coupon.code,
    type: coupon.type,
    planId,
    upgradeId,
    validPlanIds: coupon.validPlanIds,
    validUpgradeIds: coupon.validUpgradeIds
  });

  // 1️⃣ Para cupones percentage y fixed_amount, verificar las listas blancas
  if (coupon.type === 'percentage' || coupon.type === 'fixed_amount') {
    const hasValidPlanIds = coupon.validPlanIds && coupon.validPlanIds.length > 0;
    const hasValidUpgradeIds = coupon.validUpgradeIds && coupon.validUpgradeIds.length > 0;

    // Si el cupón no tiene restricciones específicas, no es válido (debe tener al menos una lista)
    if (!hasValidPlanIds && !hasValidUpgradeIds) {
      console.log('❌ [COUPON VALIDATION] Cupón percentage/fixed_amount sin listas de validación');
      return false;
    }

    // Verificar si el plan está en la lista de planes válidos
    if (hasValidPlanIds && planId) {
      const isValidPlan = coupon.validPlanIds!.includes(planId);
      console.log('🔍 [COUPON VALIDATION] Verificando plan en validPlanIds:', { planId, validPlanIds: coupon.validPlanIds, isValid: isValidPlan });
      if (isValidPlan) return true;
    }

    // Verificar si el upgrade está en la lista de upgrades válidos
    if (hasValidUpgradeIds && upgradeId) {
      const isValidUpgrade = coupon.validUpgradeIds!.includes(upgradeId);
      console.log('🔍 [COUPON VALIDATION] Verificando upgrade en validUpgradeIds:', { upgradeId, validUpgradeIds: coupon.validUpgradeIds, isValid: isValidUpgrade });
      if (isValidUpgrade) return true;
    }

    console.log('❌ [COUPON VALIDATION] Plan/Upgrade no encontrado en listas de validación');
    return false;
  }

  // 2️⃣ Para otros tipos de cupón, usar la lógica existente (applicablePlans)
  if (coupon.applicablePlans && coupon.applicablePlans.length > 0) {
    const isValidForApplicablePlans = planId && coupon.applicablePlans.includes(planId);
    console.log('✅ [COUPON VALIDATION] Cupón no específico, validando applicablePlans:', isValidForApplicablePlans);
    return !!isValidForApplicablePlans;
  }
  // Si no tiene restricciones, es válido para cualquier plan
};