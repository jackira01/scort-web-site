import type { IProfile, IProfileVerification } from '../profile/profile.types';
import type { IUser } from '../user/User.model';

export const calculateVerificationProgress = (
  verification: IProfileVerification,
  user?: IUser,
  profile?: IProfile,
  minAgeMonths: number = 12 // Default to 12 months (1 year) if not provided
): number => {
  let score = 0;
  // 8 Factors: Document, Selfie, Cartel, Video, Social, AccountAge, ContactConsistency, Deposito
  const POINTS_PER_FACTOR = 100 / 8;

  // 1. Documento de Identidad (Frente y Reverso)
  if (verification.steps?.documentVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 2. Selfie con documento
  if (verification.steps?.selfieVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 3. Cartel de verificación
  if (verification.steps?.cartelVerification?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 4. Videollamada de verificación
  if (verification.steps?.videoCallRequested?.isVerified === true) {
    score += POINTS_PER_FACTOR;
  }

  // 5. Redes sociales
  if (verification.steps?.socialMedia?.isVerified === true) {
    score += POINTS_PER_FACTOR;
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
    }

    if (isAccountAgeVerified) {
      score += POINTS_PER_FACTOR;
    }

    // 7. Consistencia de contacto
    let isContactConsistent = false;
    if (profile.contact) {
      // If never changed (hasChanged is undefined or false), it's consistent
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

  // 8. Depósito (Si NO pide depósito, gana puntos)
  // Nota: verification.steps.deposito es un booleano.
  // true = PIDE depósito (Malo para confianza)
  // false = NO PIDE depósito (Bueno para confianza)
  // undefined = Asumimos que pide (true) por defecto en el modelo
  const asksForDeposit = verification.steps?.deposito ?? true; // Default to true if undefined

  if (asksForDeposit === false) {
    score += POINTS_PER_FACTOR;
  }

  const finalScore = Math.round(score);

  return finalScore;
};
