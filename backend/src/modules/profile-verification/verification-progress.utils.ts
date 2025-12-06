import type { IProfileVerification, IProfile } from '../profile/profile.types';
import type { IUser } from '../user/User.model';

export const calculateVerificationProgress = (
  verification: IProfileVerification,
  user?: IUser,
  profile?: IProfile,
  minAgeMonths: number = 12 // Default to 12 months (1 year) if not provided
): number => {
  let score = 0;
  // 7 Factors: Document, Selfie, Cartel, Video, Social, AccountAge, ContactConsistency
  const POINTS_PER_FACTOR = 100 / 7;

  console.group('🔍 DEBUG: calculateVerificationProgress');
  console.log('Min Age Months Config:', minAgeMonths);
  console.log('Verification Steps Input:', JSON.stringify(verification.steps, null, 2));

  // 1. Documento de Identidad (Frente y Reverso)
  if (verification.steps?.documentVerification?.frontPhoto &&
    verification.steps?.documentVerification?.backPhoto &&
    verification.steps?.documentVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
    console.log('✅ Document Verification: Verified (+14.29)');
  } else {
    console.log('❌ Document Verification: Failed', {
      hasFront: !!verification.steps?.documentVerification?.frontPhoto,
      hasBack: !!verification.steps?.documentVerification?.backPhoto,
      isVerified: verification.steps?.documentVerification?.isVerified
    });
  }

  // 2. Selfie con documento
  if (verification.steps?.selfieVerification?.photo &&
    verification.steps?.selfieVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
    console.log('✅ Selfie: Verified (+14.29)');
  } else {
    console.log('❌ Selfie: Failed', {
      hasPhoto: !!verification.steps?.selfieVerification?.photo,
      isVerified: verification.steps?.selfieVerification?.isVerified
    });
  }

  // 3. Cartel de verificación
  if (verification.steps?.cartelVerification?.mediaLink &&
    verification.steps?.cartelVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
    console.log('✅ Cartel Verification: Verified (+14.29)');
  } else {
    console.log('❌ Cartel Verification: Failed', {
      hasLink: !!verification.steps?.cartelVerification?.mediaLink,
      isVerified: verification.steps?.cartelVerification?.isVerified
    });
  }

  // 4. Videollamada de verificación
  if (verification.steps?.videoCallRequested?.isVerified === true) {
    score += POINTS_PER_FACTOR;
    console.log('✅ Video Call: Verified (+14.29)');
  } else {
    console.log('❌ Video Call: Failed', {
      isVerified: verification.steps?.videoCallRequested?.isVerified
    });
  }

  // 5. Redes sociales
  if (verification.steps?.socialMedia?.isVerified === true) {
    score += POINTS_PER_FACTOR;
    console.log('✅ Social Media: Verified (+14.29)');
  } else {
    console.log('❌ Social Media: Failed', {
      isVerified: verification.steps?.socialMedia?.isVerified
    });
  }

  // Si tenemos el perfil, calculamos los factores dinámicos
  if (profile) {
    const now = new Date();

    // 6. Antigüedad de la cuenta (> minAgeMonths)
    let isAccountAgeVerified = false;
    if (profile.createdAt) {
      const createdAt = new Date(profile.createdAt);
      const thresholdDate = new Date(now);
      thresholdDate.setMonth(now.getMonth() - minAgeMonths);
      isAccountAgeVerified = createdAt <= thresholdDate;
      console.log('ℹ️ Account Age Check:', {
        createdAt: createdAt.toISOString(),
        thresholdDate: thresholdDate.toISOString(),
        minAgeMonths,
        isVerified: isAccountAgeVerified
      });
    } else {
      console.log('⚠️ Account Age: No createdAt found in profile');
    }

    if (isAccountAgeVerified) {
      score += POINTS_PER_FACTOR;
      console.log('✅ Account Age: Verified (+14.29)');
    } else {
      console.log('❌ Account Age: Failed');
    }

    // 7. Consistencia de contacto
    let isContactConsistent = false;
    if (profile.contact) {
      // If never changed (hasChanged is undefined or false), it's consistent
      if (!profile.contact.hasChanged) {
        isContactConsistent = true;
        console.log('ℹ️ Contact Consistency: Never changed (Consistent)');
      } else if (profile.contact.lastChangeDate) {
        const lastChange = new Date(profile.contact.lastChangeDate);
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        isContactConsistent = lastChange <= threeMonthsAgo;
        console.log('ℹ️ Contact Consistency Check:', {
          lastChange: lastChange.toISOString(),
          threeMonthsAgo: threeMonthsAgo.toISOString(),
          isVerified: isContactConsistent
        });
      } else {
        console.log('⚠️ Contact Consistency: Changed but no date found');
      }
    } else {
      console.log('⚠️ Contact Consistency: No contact info found');
    }

    if (isContactConsistent) {
      score += POINTS_PER_FACTOR;
      console.log('✅ Contact Consistency: Verified (+14.29)');
    } else {
      console.log('❌ Contact Consistency: Failed');
    }

  } else {
    console.warn('⚠️ Dynamic Factors skipped: Profile object missing');
  }

  const finalScore = Math.round(score);
  console.log('🏁 Final Score:', finalScore);
  console.groupEnd();

  return finalScore;
};
