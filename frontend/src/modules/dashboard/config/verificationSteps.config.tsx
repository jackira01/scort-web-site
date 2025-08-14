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
    key: 'selfieWithPoster',
    label: 'Selfie con Cartel',
    icon: <Camera className="h-5 w-5" />,
    description: 'Selfie sosteniendo un cartel con el nombre del perfil',
  },
  {
    key: 'selfieWithDoc',
    label: 'Selfie con Documento',
    icon: <Camera className="h-5 w-5" />,
    description: 'Selfie sosteniendo el documento de identidad',
  },
  {
    key: 'fullBodyPhotos',
    label: 'Fotos de Cuerpo Completo',
    icon: <Users className="h-5 w-5" />,
    description: 'Fotografías de cuerpo completo',
  },
  {
    key: 'video',
    label: 'Video de Verificación',
    icon: <Video className="h-5 w-5" />,
    description: 'Video de verificación',
  },
  {
    key: 'videoCallRequested',
    label: 'Videollamada',
    icon: <Phone className="h-5 w-5" />,
    description: 'Verificación por videollamada',
  },
  {
    key: 'socialMedia',
    label: 'Redes Sociales',
    icon: <Users className="h-5 w-5" />,
    description: 'Verificación de cuentas de redes sociales',
  },
];

export const getVerifiedCount = (steps: any) => {
  if (!steps) return 0;
  
  return Object.values(steps).filter(step => 
    step && (step as any).isVerified === true
  ).length;
};