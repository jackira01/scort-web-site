import {
  Camera,
  FileText,
  Phone,
  Users,
  Video,
  VideoIcon,
} from 'lucide-react';
import type { VerificationStep } from '../types/verification.types';

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

export const getVerifiedCount = (verification: any): number => {
  if (!verification?.steps) return 0;

  let count = 0;

  // Contar solo los pasos verificados
  verificationSteps.forEach(step => {
    if (verification.steps[step.key]?.isVerified) {
      count++;
    }
  });

  return count;
};

// Función para obtener el total de pasos
export const getTotalSteps = (): number => {
  return verificationSteps.length; // Ahora 4 pasos: documentos, video, videollamada, redes sociales
};