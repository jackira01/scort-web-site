import type { IProfileVerification, IProfile } from '../profile/profile.types';
import type { IUser } from '../user/User.model';

export const calculateVerificationProgress = (
  verification: IProfileVerification,
  user?: IUser,
  profile?: IProfile
): number => {
  let score = 0;
  // Ajustado a ~14.29 para mantener 100% con 7 factores (100/7 = 14.285...)
  const POINTS_PER_FACTOR = 100 / 7;

  // 1. Foto frontal del documento
  if (verification.steps?.frontPhotoVerification?.photo &&
    verification.steps?.frontPhotoVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 2. Selfie con documento
  if (verification.steps?.selfieVerification?.photo &&
    verification.steps?.selfieVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 3. Media de verificación
  if (verification.steps?.mediaVerification?.mediaLink &&
    verification.steps?.mediaVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 4. Videollamada de verificación
  if (verification.steps?.videoCallRequested?.videoLink &&
    verification.steps?.videoCallRequested?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 5. Redes sociales
  if (verification.steps?.socialMedia?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // Si tenemos el perfil, calculamos los factores dinámicos
  if (profile) {
    const now = new Date();

    // 6. Antigüedad de la cuenta (> 1 año)
    let isAccountAgeVerified = false;
    if (profile.createdAt) {
      const createdAt = new Date(profile.createdAt);
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      isAccountAgeVerified = createdAt <= oneYearAgo;
    }

    if (isAccountAgeVerified) {
      score += POINTS_PER_FACTOR;
    }

    // 7. Consistencia de contacto
    let isContactConsistent = false;
    if (profile.contact) {
      // If never changed (hasChanged is undefined or false), it's consistent
      // This matches the logic in phone-verification.utils.ts
      if (!profile.contact.hasChanged) {
        isContactConsistent = true;
      } else if (profile.contact.lastChangeDate) {
        const lastChange = new Date(profile.contact.lastChangeDate);
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        isContactConsistent = lastChange <= threeMonthsAgo;
      }
    }

    if (isContactConsistent) {
      score += POINTS_PER_FACTOR;
    }
  }

  return Math.round(score);
};