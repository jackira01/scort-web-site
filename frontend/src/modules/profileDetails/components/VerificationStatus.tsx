'use client';

import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfileVerification } from '@/hooks/use-profile-verification';

interface VerificationStatusProps {
  profileId: string;
}

interface VerificationFactor {
  label: string;
  description: string;
  isVerified: boolean;
}

const getStatusBadge = (isVerified: boolean) => {
  if (isVerified) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
        Verificado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      No verificado
    </Badge>
  );
};

const getStatusIcon = (isVerified: boolean) => {
  if (isVerified) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  return <XCircle className="h-5 w-5 text-gray-300" />;
};

export function VerificationStatus({ profileId }: VerificationStatusProps) {
  const { data: verificationData, isLoading, error } = useProfileVerification(profileId);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Estado de Verificación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Bloque de error
  if (error || !verificationData) {
    return (
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Estado de Verificación
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-4 space-y-2">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No se pudo cargar la información de verificación
          </p>
          <XCircle className="h-6 w-6 text-red-500" />
        </CardContent>
      </Card>
    );
  }

  // Extraer datos del verificación
  const verification = verificationData?.data;
  const steps = verification?.steps || {};

  // Array de factores de verificación alineados con el backend
  // Los 7 factores que se calculan: 2 fotos, media, videollamada, redes sociales, contacto, antigüedad
  const verificationFactors: VerificationFactor[] = [
    {
      label: "Documento de Identidad (Frente)",
      description: steps.frontPhotoVerification?.photo
        ? "Se ha verificado el documento de identidad frontal correctamente."
        : "Aún no se ha subido el documento de identidad frontal.",
      isVerified: steps.frontPhotoVerification?.isVerified || false
    },
    {
      label: "Foto con Documento al Lado del Rostro",
      description: steps.selfieVerification?.photo
        ? "Se ha verificado la foto con documento al lado del rostro."
        : "Aún no se ha subido la foto con documento al lado del rostro.",
      isVerified: steps.selfieVerification?.isVerified || false
    },
    {
      label: "Foto de Verificación con Cartel",
      description: steps.mediaVerification?.mediaLink
        ? "Se ha verificado la foto/video de verificación con cartel."
        : "Aún no se ha subido la foto/video de verificación con cartel.",
      isVerified: steps.mediaVerification?.isVerified || false
    },
    {
      label: "Videollamada de Verificación",
      description: steps.videoCallRequested?.videoLink
        ? "Se ha completado la verificación por videollamada."
        : "Aún no se ha completado la verificación por videollamada.",
      isVerified: steps.videoCallRequested?.isVerified || false
    },
    {
      label: "Redes Sociales",
      description: steps.socialMedia?.isVerified
        ? "Las redes sociales han sido verificadas como auténticas."
        : "Aún no se han verificado las redes sociales.",
      isVerified: steps.socialMedia?.isVerified || false
    },
    {
      label: "Consistencia en Datos de Contacto",
      description: steps.contactConsistency?.isVerified
        ? "El perfil mantiene estabilidad en su información de contacto sin cambios frecuentes."
        : "Se han detectado cambios recientes en los datos de contacto del perfil.",
      isVerified: steps.contactConsistency?.isVerified || false
    },
    {
      label: "Antigüedad del Perfil",
      description: steps.accountAge?.isVerified
        ? "Este usuario cuenta con más de un año de membresía activa, demostrando estabilidad."
        : "El perfil tiene menos de un año en la plataforma.",
      isVerified: steps.accountAge?.isVerified || false
    }
  ];

  return (
    <Card id="trust-factors" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Factores que garantizan la confiabilidad de este perfil:
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {verification?.verificationProgress || 0}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Progreso de verificación</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {verificationFactors.map((factor, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(factor.isVerified)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {factor.label}
                </p>
                {getStatusBadge(factor.isVerified)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {factor.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}