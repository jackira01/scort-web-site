import {
  Camera,
  FileText,
  Phone,
  Users,
  Video,
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
    key: 'video',
    label: 'Video de Verificación',
    icon: <Video className="h-5 w-5" />,
    description: 'Video de verificación',
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

  // Contar solo los pasos simplificados verificados
  verificationSteps.forEach(step => {
    if (verification.steps[step.key]?.isVerified) {
      count++;
    }
  });

  return count;
};

// Función para obtener el total de pasos simplificados
export const getTotalSteps = (): number => {
  return verificationSteps.length; // Siempre 3 pasos: documentos, video, redes sociales
};