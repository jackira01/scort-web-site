"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCouponValidForPlan = void 0;
const isCouponValidForPlan = (coupon, planId, upgradeId) => {
    console.log('🔍 [COUPON VALIDATION] Validando cupón:', {
        code: coupon.code,
        type: coupon.type,
        planId,
        upgradeId,
        validPlanIds: coupon.validPlanIds,
        validUpgradeIds: coupon.validUpgradeIds
    });
    if (coupon.type === 'percentage' || coupon.type === 'fixed_amount') {
        const hasValidPlanIds = coupon.validPlanIds && coupon.validPlanIds.length > 0;
        const hasValidUpgradeIds = coupon.validUpgradeIds && coupon.validUpgradeIds.length > 0;
        if (!hasValidPlanIds && !hasValidUpgradeIds) {
            console.log('❌ [COUPON VALIDATION] Cupón percentage/fixed_amount sin listas de validación');
            return false;
        }
        if (hasValidPlanIds && planId) {
            const isValidPlan = coupon.validPlanIds.includes(planId);
            console.log('🔍 [COUPON VALIDATION] Verificando plan en validPlanIds:', { planId, validPlanIds: coupon.validPlanIds, isValid: isValidPlan });
            if (isValidPlan)
                return true;
        }
        if (hasValidUpgradeIds && upgradeId) {
            const isValidUpgrade = coupon.validUpgradeIds.includes(upgradeId);
            console.log('🔍 [COUPON VALIDATION] Verificando upgrade en validUpgradeIds:', { upgradeId, validUpgradeIds: coupon.validUpgradeIds, isValid: isValidUpgrade });
            if (isValidUpgrade)
                return true;
        }
        console.log('❌ [COUPON VALIDATION] Plan/Upgrade no encontrado en listas de validación');
        return false;
    }
    if (coupon.applicablePlans && coupon.applicablePlans.length > 0) {
        const isValidForApplicablePlans = planId && coupon.applicablePlans.includes(planId);
        console.log('✅ [COUPON VALIDATION] Cupón no específico, validando applicablePlans:', isValidForApplicablePlans);
        return !!isValidForApplicablePlans;
    }
};
exports.isCouponValidForPlan = isCouponValidForPlan;
