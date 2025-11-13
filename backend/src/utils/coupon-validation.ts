import type { ICoupon } from '../modules/coupons/coupon.types';

/**
 * 🎯 Valida si un cupón es aplicable a un plan específico con su variante
 * Esta función implementa la lógica para todos los tipos de cupones con soporte
 * para validPlanVariants (combinaciones exactas - RECOMENDADO) o campos deprecados
 * 
 * @param coupon - El cupón a validar
 * @param planCode - Código del plan (ej: "PREMIUM")
 * @param variantDays - Días de la variante (ej: 30)
 * @param upgradeId - ID del upgrade (opcional)
 * @returns true si el cupón es válido para el plan/variante/upgrade
 */
export const isCouponValidForPlan = (
  coupon: ICoupon,
  planCode?: string,
  variantDays?: number,
  upgradeId?: string
): boolean | undefined => {
  // 1️⃣ Para cupones percentage y fixed_amount
  if (coupon.type === 'percentage' || coupon.type === 'fixed_amount') {
    // NUEVA ESTRUCTURA: validPlanVariants (combinaciones exactas - SIN AMBIGÜEDAD)
    if (coupon.validPlanVariants && coupon.validPlanVariants.length > 0) {
      // Si no se proporciona planCode y variantDays, no es válido
      if (!planCode || variantDays === undefined) {
        return false;
      }

      // Buscar combinación exacta plan-variante
      const isValidCombination = coupon.validPlanVariants.some(
        variant => variant.planCode === planCode && variant.variantDays === variantDays
      );

      return isValidCombination;
    }

    // FALLBACK DEPRECADO: validPlanCodes + validVariantDays (producto cartesiano)
    const hasOldPlanCodes = coupon.validPlanCodes && coupon.validPlanCodes.length > 0;
    const hasOldVariantDays = coupon.validVariantDays && coupon.validVariantDays.length > 0;
    const hasOldFormat = coupon.validPlanIds && coupon.validPlanIds.length > 0;
    const hasUpgradeIds = coupon.validUpgradeIds && coupon.validUpgradeIds.length > 0;

    // Si no hay restricciones en absoluto, rechazar (debe tener al menos una restricción)
    if (!hasOldPlanCodes && !hasOldFormat && !hasUpgradeIds) {
      return false;
    }

    // Validar con formato antiguo validPlanCodes + validVariantDays (producto cartesiano)
    if (hasOldPlanCodes && planCode) {
      const isPlanValid = coupon.validPlanCodes!.includes(planCode);
      if (!isPlanValid) {
        // Si el plan no está en la lista, verificar upgrades antes de rechazar
        if (hasUpgradeIds && upgradeId && coupon.validUpgradeIds!.includes(upgradeId)) {
          return true;
        }
        return false;
      }

      // Si hay restricción de variantes, validar también los días
      if (hasOldVariantDays) {
        const isVariantValid = variantDays !== undefined && coupon.validVariantDays!.includes(variantDays);
        return isVariantValid;
      }

      // Si no hay restricción de variantes, es válido para cualquier variante del plan
      return true;
    }

    // FORMATO MÁS ANTIGUO: validPlanIds (sin sufijo de días)
    if (hasOldFormat && planCode) {
      const isValidPlan = coupon.validPlanIds!.some(id =>
        id === planCode || id.toUpperCase() === planCode
      );
      if (isValidPlan) return true;
    }

    // Verificar si el upgrade está en la lista de upgrades válidos
    if (hasUpgradeIds && upgradeId) {
      const isValidUpgrade = coupon.validUpgradeIds!.includes(upgradeId);
      if (isValidUpgrade) return true;
    }

    return false;
  }

  // 2️⃣ Para cupones de plan_assignment, verificar planCode específico
  if (coupon.type === 'plan_assignment') {
    return coupon.planCode === planCode;
  }

  // 3️⃣ Para otros tipos de cupón, usar applicablePlans (deprecado)
  if (coupon.applicablePlans && coupon.applicablePlans.length > 0) {
    const isValidForApplicablePlans = planCode && coupon.applicablePlans.includes(planCode);
    return !!isValidForApplicablePlans;
  }

  // Si no tiene restricciones, es válido para cualquier plan
  return true;
};