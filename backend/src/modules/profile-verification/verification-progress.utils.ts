import type { IProfileVerification, IProfile } from '../profile/profile.types';
import type { IUser } from '../user/User.model';

export const calculateVerificationProgress = (
  verification: IProfileVerification,
  user?: IUser,
  profile?: IProfile
): number => {
  let score = 0;
  const POINTS_PER_FACTOR = 20;

  // 1. Fotos de documentos
  if ((verification.steps?.documentPhotos?.frontPhoto ||
    verification.steps?.documentPhotos?.selfieWithDocument) &&
    verification.steps?.documentPhotos?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 2. Media de verificación
  if (verification.steps?.mediaVerification?.mediaLink &&
    verification.steps?.mediaVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 3. Redes sociales
  if (verification.steps?.socialMedia?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // Si tenemos el perfil, calculamos los factores dinámicos
  if (profile) {
    const now = new Date();

    // 4. Antigüedad de la cuenta (> 1 año)
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

    // 5. Consistencia de contacto
    let isContactConsistent = false;
    if (profile.contact) {
      if (profile.contact.hasChanged === false) {
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

  return score;
};

// Funciones auxiliares removidas ya que no son necesarias en la nueva lógica simplificada