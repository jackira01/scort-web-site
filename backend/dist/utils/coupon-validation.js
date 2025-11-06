"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCouponValidForPlan = void 0;
const isCouponValidForPlan = (coupon, planId, upgradeId) => {
    if (coupon.type === 'percentage' || coupon.type === 'fixed_amount') {
        const hasValidPlanIds = coupon.validPlanIds && coupon.validPlanIds.length > 0;
        const hasValidUpgradeIds = coupon.validUpgradeIds && coupon.validUpgradeIds.length > 0;
        if (!hasValidPlanIds && !hasValidUpgradeIds) {
            return false;
        }
        if (hasValidPlanIds && planId) {
            const isValidPlan = coupon.validPlanIds.includes(planId);
            if (isValidPlan)
                return true;
        }
        if (hasValidUpgradeIds && upgradeId) {
            const isValidUpgrade = coupon.validUpgradeIds.includes(upgradeId);
            if (isValidUpgrade)
                return true;
        }
        return false;
    }
    if (coupon.applicablePlans && coupon.applicablePlans.length > 0) {
        const isValidForApplicablePlans = planId && coupon.applicablePlans.includes(planId);
        return !!isValidForApplicablePlans;
    }
};
exports.isCouponValidForPlan = isCouponValidForPlan;
