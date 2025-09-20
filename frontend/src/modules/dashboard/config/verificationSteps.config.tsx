import {
  Camera,
  FileText,
  Phone,
  Users,
  Video,
  VideoIcon,
} from 'lucide-react';
import type { VerificationStep } from '../types/verification.types';

interface ProfileVerificationSteps {
  steps: {
    [key: string]: {
      isVerified: boolean;
    };
  };
}

export const verificationSteps: VerificationStep[] = [
  {
    key: 'documentPhotos',
    label: 'Fotos de Documento',
    icon: <FileText className="h-5 w-5" />,
    description: 'Verificación de documentos de identidad',
  },
  {
    key: 'videoVerification',
    label: 'Video de Verificación',
    icon: <Video className="h-5 w-5" />,
    description: 'Video de verificación de identidad',
  },
  {
    key: 'videoCallRequested',
    label: 'Verificación por Videollamada',
    icon: <VideoIcon className="h-5 w-5" />,
    description: 'Verificación mediante videollamada en tiempo real',
  },
  {
    key: 'socialMedia',
    label: 'Redes Sociales',
    icon: <Users className="h-5 w-5" />,
    description: 'Verificación de cuentas de redes sociales',
  },
];

export const getVerifiedCount = (verification: ProfileVerificationSteps | unknown): number => {
  if (!verification || typeof verification !== 'object') return 0;
  
  const verificationData = verification as ProfileVerificationSteps;
  if (!verificationData?.steps) return 0;

  let count = 0;

  // Contar solo los pasos verificados
  verificationSteps.forEach(step => {
    if (verificationData.steps[step.key]?.isVerified) {
      count++;
    }
  });

  return count;
};

// Función para obtener el total de pasos
export const getTotalSteps = (): number => {
  return verificationSteps.length; // Ahora 4 pasos: documentos, video, videollamada, redes sociales
};