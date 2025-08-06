import type { IProfileVerification } from '../profile/profile.types';
import type { IUser } from '../user/User.model';

/**
 * Calcula el progreso de verificación basado en 10 pasos diferentes
 * Cada paso completado vale 10 puntos porcentuales (total 100%)
 */
export const calculateVerificationProgress = (
  verification: IProfileVerification,
  user?: IUser
): number => {
  let completedSteps = 0;
  const totalSteps = 10;

  // 1. Fotos de documentos
  if (verification.steps?.documentPhotos?.documents?.length > 0) {
    completedSteps++;
  }

  // 2. Selfie con póster
  if (verification.steps?.selfieWithPoster?.photo) {
    completedSteps++;
  }

  // 3. Selfie con documento
  if (verification.steps?.selfieWithDoc?.photo) {
    completedSteps++;
  }

  // 4. Fotos de cuerpo completo
  if (verification.steps?.fullBodyPhotos?.photos?.length >= 2) {
    completedSteps++;
  }

  // 5. Vídeo
  if (verification.steps?.video?.videoLink) {
    completedSteps++;
  }

  // 6. Solicitud de videollamada
  if (verification.steps?.videoCallRequested?.videoLink) {
    completedSteps++;
  }

  // 7. Redes sociales
  if (verification.steps?.socialMedia?.accounts?.length > 0) {
    completedSteps++;
  }

  // 8. Detección de cambio de teléfono
  // false = no ha cambiado (bueno) = +1 punto
  // true = ha cambiado (malo) = 0 puntos
  if (verification.steps?.phoneChangeDetected === false) {
    completedSteps++;
  }

  // 9. Last Login (del modelo User)
  // true = ha hecho login en los últimos 30 días = +1 punto
  if (user?.lastLogin?.isVerified === true) {
    completedSteps++;
  }

  // 10. Verificación general del usuario (isVerified del modelo User)
  if (user?.isVerified === true) {
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