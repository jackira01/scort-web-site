import {
  Camera,
  FileText,
  Users,
  Video,
  VideoIcon
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
    key: 'documentVerification',
    label: 'Documento de Identidad',
    icon: <FileText className="h-5 w-5" />,
    description: 'Fotos frontal y reverso del documento de identidad',
  },
  {
    key: 'selfieVerification',
    label: 'Foto con Documento al Lado del Rostro',
    icon: <Camera className="h-5 w-5" />,
    description: 'Foto de la persona sosteniendo el documento al lado de su rostro',
  },
  {
    key: 'cartelVerification',
    label: 'Cartel de Verificación',
    icon: <Video className="h-5 w-5" />,
    description: 'Foto o video mostrando un cartel con datos de verificación',
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
  {
    key: 'deposito',
    label: 'Información de Depósito',
    icon: <FileText className="h-5 w-5" />, // Reusing FileText or finding a better icon like 'Coins' or 'Banknote' if available. Using FileText for now as safe bet or Money icon if imported.
    description: 'Información sobre si solicitas depósito por adelantado',
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

    // Verificar el isVerified del step
    if (stepData.isVerified) {
      count++;
    }
  });

  return count;
};

// Función para obtener el total de pasos
export const getTotalSteps = (): number => {
  return verificationSteps.length; // Ahora 5 pasos
};