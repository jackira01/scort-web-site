'use client';

import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfileVerification } from '@/hooks/use-profile-verification';

interface VerificationStatusProps {
  profileId: string;
}

interface VerificationStep {
  label: string;
  isVerified: boolean;
  hasData: boolean;
  details?: any;
}

const getStatusBadge = (step: VerificationStep) => {
  if (step.isVerified) {
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

const getStatusIcon = (step: VerificationStep) => {
  if (step.isVerified) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  // Si tiene datos pero no está verificado, podrías mostrar un reloj (pendiente)
  if (step.hasData && !step.isVerified) {
    // return <Clock className="h-5 w-5 text-yellow-500" />; // Opcional
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
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Bloque de error corregido
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

  // Reconstrucción del array de pasos basado en los datos reales del backend
  // La respuesta de axios devuelve { success: true, data: { ... } }, por lo que verificationData es ese objeto.
  // Necesitamos acceder a verificationData.data para obtener los datos reales de la verificación.
  const data = verificationData.data || verificationData;

  const verificationSteps: VerificationStep[] = [
    {
      label: "Mayoría de edad",
      isVerified: !!data.steps?.documentVerification?.isVerified,
      hasData: !!data.steps?.documentVerification?.frontPhoto && !!data.steps?.documentVerification?.backPhoto
    },
    {
      label: "Identidad confirmada",
      isVerified: !!data.steps?.selfieVerification?.isVerified,
      hasData: !!data.steps?.selfieVerification?.photo
    },
    {
      label: "Verificación con Multimedia",
      isVerified: !!data.steps?.cartelVerification?.isVerified,
      hasData: !!data.steps?.cartelVerification?.mediaLink
    },
    {
      label: "Verificación por videollamada",
      isVerified: !!data.steps?.videoCallRequested?.isVerified,
      hasData: !!data.steps?.videoCallRequested?.videoLink
    },
    {
      label: "Estabilidad",
      isVerified: !!data.steps?.accountAge?.isVerified,
      hasData: true
    },
    {
      label: "Confiabilidad",
      isVerified: !!data.steps?.contactConsistency?.isVerified,
      hasData: true,
      details: data.steps?.contactConsistency
    },
    {
      label: "Verificación por redes sociales",
      isVerified: !!data.steps?.socialMedia?.isVerified,
      hasData: true
    },
  ];

  return (
    <Card id="trust-factors" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Factores que garantizan la confiabilidad de este perfil:
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">
              {data.verificationProgress || 0}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Progreso de verificación</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {verificationSteps.map((step, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(step)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {step.label}
                </p>
                {getStatusBadge(step)}
              </div>

              {/* Mensajes condicionales */}
              {step.label === "Mayoría de edad" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "El documento de identidad del usuario ha sido verificado correctamente."
                    : "Este usuario aún no ha completado la verificación de su documento de identidad."}
                </p>
              )}
              {step.label === "Identidad confirmada" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "La identidad del usuario ha sido confirmada mediante video/foto de verificación."
                    : "Este usuario aún no ha completado el video/foto de verificación de identidad."}
                </p>
              )}
              {step.label === "Verificación con Multimedia" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "Este usuario ya envio fotos/videos verificando su perfil."
                    : "Este usuario aún no ha enviado fotos/videos de verificación de perfil."}
                </p>
              )}
              {step.label === "Verificación por videollamada" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "Se ha verificado en tiempo real mediante videollamada la identidad de este perfil."
                    : "Este usuario aún no ha completado el proceso de verificación por videollamada."}
                </p>
              )}
              {step.label === "Estabilidad" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "Este perfil ha estado activo por mas de 3 meses."
                    : "Este perfil no ha estado activo por mas de 3 meses. Esto no es necesariamente negativo, puede ser un perfil nuevo."}
                </p>
              )}
              {step.label === "Confiabilidad" && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified ? (
                    "El perfil no ha cambiado su telefono en X tiempo."
                  ) : (
                    <span>
                      "El usuario ha cambiado su teléfono recientemente."
                    </span>
                  )}
                </div>
              )}
              {step.label === "Verificación por redes sociales" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "El perfil ha proporcionado redes sociales confiables y coinciden con la información de este perfil."
                    : "Este perfil aún no ha proporcionado información de redes sociales para verificación."}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}