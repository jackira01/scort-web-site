import type { IProfileVerification } from '../profile/profile.types';
import type { IUser } from '../user/User.model';

/**
 * Calcula el progreso de verificación basado en 10 pasos diferentes
 * Cada paso completado vale 10 puntos porcentuales (total 100%)
 * IMPORTANTE: Solo cuenta los steps que tienen isVerified: true
 */
export const calculateVerificationProgress = (
  verification: IProfileVerification,
  user?: IUser
): number => {
  let completedSteps = 0;
  const totalSteps = 9;

  // 1. Fotos de documentos - Solo cuenta si está verificado
  if (verification.steps?.documentPhotos?.documents?.length > 0 &&
    verification.steps?.documentPhotos?.isVerified === true) {
    completedSteps++;
  }

  // 2. Selfie con póster - Solo cuenta si está verificado
  if (verification.steps?.selfieWithPoster?.photo &&
    verification.steps?.selfieWithPoster?.isVerified === true) {
    completedSteps++;
  }

  // 3. Selfie con documento - Solo cuenta si está verificado
  if (verification.steps?.selfieWithDoc?.photo &&
    verification.steps?.selfieWithDoc?.isVerified === true) {
    completedSteps++;
  }

  // 4. Fotos de cuerpo completo - Solo cuenta si está verificado
  if (verification.steps?.fullBodyPhotos?.photos?.length > 0 &&
    verification.steps?.fullBodyPhotos?.isVerified === true) {
    completedSteps++;
  }

  // 5. Vídeo - Solo cuenta si está verificado
  if (verification.steps?.video?.videoLink &&
    verification.steps?.video?.isVerified === true) {
    completedSteps++;
  }

  // 6. Solicitud de videollamada - Solo cuenta si está verificado
  if (verification.steps?.videoCallRequested?.isVerified === true) {
    completedSteps++;
  }

  // 7. Redes sociales - Solo cuenta si está verificado
  if (verification.steps?.socialMedia?.accounts?.length > 0 &&
    verification.steps?.socialMedia?.isVerified === true) {
    completedSteps++;
  }

  // 8. Detección de cambio de teléfono
  // false = no ha cambiado (bueno) = +1 punto
  // true = ha cambiado (malo) = 0 puntos
  if (verification.steps?.phoneChangeDetected === false) {
    completedSteps++;
  }

  // 9. Last Login (del modelo ProfileVerification)
  // true = ha hecho login en los últimos 30 días = +1 punto
  if (verification.steps?.lastLogin?.isVerified === true) {
    completedSteps++;
  }

  // Calcular porcentaje (cada paso vale 10%)
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return Math.round(progressPercentage);
};

/**
 * Verifica si el usuario ha hecho login en los últimos 30 días
 */
export const checkLastLoginVerification = (lastLoginDate: Date | null): boolean => {
  if (!lastLoginDate) {
    return true; // Por defecto true si no hay fecha previa
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return lastLoginDate >= thirtyDaysAgo;
};

/**
 * Verifica si el teléfono ha cambiado en los últimos 30 días
 */
export const checkPhoneChangeDetection = (phoneChangedAt: Date | null): boolean => {
  if (!phoneChangedAt) {
    return false; // No ha cambiado
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return phoneChangedAt >= thirtyDaysAgo; // true = ha cambiado recientemente
};