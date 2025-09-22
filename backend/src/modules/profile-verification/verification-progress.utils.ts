import type { IProfileVerification } from '../profile/profile.types';
import type { IUser } from '../user/User.model';

/**
 * Calcula el progreso de verificación basado en la nueva lógica simplificada
 * Solo 3 pasos: Fotos de documentos, Media de verificación (video/imagen), Redes sociales
 * IMPORTANTE: Solo cuenta los steps que tienen isVerified: true
 */
export const calculateVerificationProgress = (
  verification: IProfileVerification,
  user?: IUser
): number => {
  let completedSteps = 0;
  const totalSteps = 3; // Siempre 3 pasos en la versión simplificada

  // 1. Fotos de documentos - Solo cuenta si está verificado
  if ((verification.steps?.documentPhotos?.frontPhoto || 
       verification.steps?.documentPhotos?.backPhoto) &&
    verification.steps?.documentPhotos?.isVerified === true) {
    completedSteps++;
  }

  // 2. Media de verificación (video o imagen) - Solo cuenta si está verificado
  if (verification.steps?.mediaVerification?.mediaLink &&
    verification.steps?.mediaVerification?.isVerified === true) {
    completedSteps++;
  }

  // 3. Redes sociales - Solo cuenta si está verificado
  if (verification.steps?.socialMedia?.isVerified === true) {
    completedSteps++;
  }

  // Calcular porcentaje basado en el total de pasos (3)
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return Math.round(progressPercentage);
};

// Funciones auxiliares removidas ya que no son necesarias en la nueva lógica simplificada