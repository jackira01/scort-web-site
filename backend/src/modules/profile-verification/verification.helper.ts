import type { IProfile, IProfileVerification } from '../profile/profile.types';

/**
 * Enriches a profile with dynamic verification data calculated at runtime.
 * This ensures that time-based factors (account age, contact consistency) are always up-to-date
 * without requiring database writes.
 * 
 * IMPORTANT: This function ONLY injects computed fields (accountAge, contactConsistency).
 * It does NOT recalculate verificationProgress - that should come from the database.
 * The verificationProgress is only recalculated when verification steps change (via recalculateVerificationProgress).
 * 
 * @param profile The profile object (should be a plain object/lean)
 * @param minAgeMonths Minimum age in months for account age verification (default: 12)
 * @returns The profile with injected computed verification fields
 */
export const enrichProfileVerification = (profile: any, minAgeMonths: number = 12): any => {
    if (!profile) return profile;

    // Clone profile to avoid mutating the original reference if needed
    const enrichedProfile = { ...profile };

    // Ensure verification object exists
    if (!enrichedProfile.verification) {
        enrichedProfile.verification = {
            verificationProgress: 0,
            verificationStatus: 'pending',
            steps: {}
        };
    }

    const now = new Date();
    const verification = enrichedProfile.verification;

    // --- 1. Calculate Time-Based Computed Factors ---

    // Factor: Account Age (> minAgeMonths)
    // Check if createdAt exists and is older than minAgeMonths
    let isAccountAgeVerified = false;
    if (enrichedProfile.createdAt) {
        const createdAt = new Date(enrichedProfile.createdAt);
        const thresholdDate = new Date(now);
        thresholdDate.setMonth(now.getMonth() - minAgeMonths);

        isAccountAgeVerified = createdAt <= thresholdDate;
    }

    // Factor: Contact Consistency (> 3 months without changes)
    // Logic mirrored from phone-verification.utils.ts but synchronous
    let isContactConsistent = false;

    if (enrichedProfile.contact) {
        // If never changed (hasChanged is undefined or false), it's consistent
        // This matches the logic in phone-verification.utils.ts
        if (!enrichedProfile.contact.hasChanged) {
            isContactConsistent = true;
        }
        // If changed, check if enough time has passed
        else if (enrichedProfile.contact.lastChangeDate) {
            const lastChange = new Date(enrichedProfile.contact.lastChangeDate);
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(now.getMonth() - 3);

            isContactConsistent = lastChange <= threeMonthsAgo;
        }
        // If changed but no date (shouldn't happen ideally), assume not consistent
    }

    // --- 2. Inject Computed Fields into Steps ---
    // These are NOT saved to DB, only injected in the response for frontend consumption

    if (!enrichedProfile.verification.steps) {
        enrichedProfile.verification.steps = {};
    }

    enrichedProfile.verification.steps.accountAge = {
        isVerified: isAccountAgeVerified,
        status: isAccountAgeVerified ? 'verified' : 'pending'
    };

    enrichedProfile.verification.steps.contactConsistency = {
        isVerified: isContactConsistent,
        status: isContactConsistent ? 'verified' : 'pending',
        // Debug info to help diagnose contact consistency calculation
        debug: {
            hasChanged: enrichedProfile.contact?.hasChanged,
            lastChangeDate: enrichedProfile.contact?.lastChangeDate,
            hasContactNumber: !!enrichedProfile.contact?.number,
            calculatedAt: new Date().toISOString()
        }
    } as any;

    // Also update the phoneChangeDetected flag to match reality
    // If consistent (verified), then change detected is false (stable)
    // If not consistent (not verified), then change detected is true (unstable)
    enrichedProfile.verification.steps.phoneChangeDetected = !isContactConsistent;

    // --- 3. Recalculate Verification Progress ---
    // We recalculate the progress here to ensure it reflects the dynamic factors (Account Age, Contact Consistency)
    // immediately, without waiting for a database update.

    // We need to cast to unknown first to avoid circular dependency issues or strict type checks 
    // since we are inside the helper that might be used by the types
    const { calculateVerificationProgress } = require('./verification-progress.utils');

    if (calculateVerificationProgress) {
        console.group('🔄 Recalculating Progress in enrichProfileVerification');
        console.log('Profile ID:', profile._id);
        const newProgress = calculateVerificationProgress(
            enrichedProfile.verification,
            enrichedProfile.user,
            enrichedProfile,
            minAgeMonths
        );
        console.log('Old Progress:', enrichedProfile.verification.verificationProgress);
        console.log('New Progress:', newProgress);
        console.groupEnd();
        enrichedProfile.verification.verificationProgress = newProgress;
    }

    return enrichedProfile;
};
