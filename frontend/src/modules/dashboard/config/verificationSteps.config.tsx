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
    subKey: 'frontPhoto',
    label: 'Documento de Identidad (Frente)',
    icon: <FileText className="h-5 w-5" />,
    description: 'Foto frontal clara del documento de identidad',
  },
  {
    key: 'documentPhotos',
    subKey: 'selfieWithDocument',
    label: 'Foto con Documento al Lado del Rostro',
    icon: <Camera className="h-5 w-5" />,
    description: 'Foto de la persona sosteniendo el documento al lado de su rostro',
  },
  {
    key: 'mediaVerification',
    label: 'Foto de Verificación con Cartel',
    icon: <Video className="h-5 w-5" />,
    description: 'Video o imagen mostrando un cartel con datos de verificación',
  },
  {
    key: 'videoCallRequested',
    label: 'Videollamada de Verificación',
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
    const stepData = verificationData.steps[step.key as keyof typeof verificationData.steps];

    if (!stepData) return;

    // Si tiene subKey, verificar que el subKey tenga valor (no isVerified)
    if (step.subKey) {
      if ((stepData as any)[step.subKey]) {
        count++;
      }
    } else {
      // Si no tiene subKey, verificar el isVerified del step completo
      if (stepData.isVerified) {
        count++;
      }
    }
  });

  return count;
};

// Función para obtener el total de pasos
export const getTotalSteps = (): number => {
  return verificationSteps.length; // Ahora 4 pasos: documentos, video, videollamada, redes sociales
};