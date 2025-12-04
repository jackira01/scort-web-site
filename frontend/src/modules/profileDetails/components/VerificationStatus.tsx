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
      label: "Mayoria de edad (Frente)",
      isVerified: !!data.steps?.frontPhotoVerification?.isVerified,
      hasData: true
    },
    {
      label: "Mayoria de edad (Reverso)",
      isVerified: !!data.steps?.backPhotoVerification?.isVerified,
      hasData: true
    },
    {
      label: "Identidad confirmada",
      isVerified: !!data.steps?.selfieVerification?.isVerified,
      hasData: true
    },
    {
      label: "Veracidad de fotos del perfil",
      isVerified: !!data.steps?.mediaVerification?.isVerified,
      hasData: true
    },
    {
      label: "Verificación por videollamada",
      isVerified: !!data.steps?.videoCallRequested?.isVerified,
      hasData: true
    },
    {
      label: "Miembro establecido con antigüedad",
      isVerified: !!data.steps?.accountAge?.isVerified,
      hasData: true
    },
    {
      label: "Consistencia en datos de contacto",
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
              {step.label === "Mayoria de edad (Frente)" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "El documento de identidad (frente) del usuario ha sido verificado correctamente."
                    : "Este usuario aún no ha enviado el frente de su documento de identidad."}
                </p>
              )}
              {step.label === "Mayoria de edad (Reverso)" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "El documento de identidad (reverso) del usuario ha sido verificado correctamente."
                    : "Este usuario aún no ha enviado el reverso de su documento de identidad."}
                </p>
              )}
              {step.label === "Identidad confirmada" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "La identidad del usuario ha sido confirmada mediante video/foto de verificación."
                    : "Este usuario aún no ha completado el video/foto de verificación de identidad."}
                </p>
              )}
              {step.label === "Veracidad de fotos del perfil" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "Las fotos de perfil corresponden a un video solicitado al usuario."
                    : "Este usuario aún no ha completado la verificación de veracidad de fotos."}
                </p>
              )}
              {step.label === "Verificación por videollamada" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "Se ha verificado en tiempo real mediante videollamada la identidad de este perfil."
                    : "Este usuario aún no ha completado el proceso de verificación por videollamada."}
                </p>
              )}
              {step.label === "Miembro establecido con antigüedad" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "Este usuario cuenta con más de un año de membresía activa, lo que demuestra confiabilidad y estabilidad en la plataforma."
                    : "Este usuario tiene menos de un año en la plataforma. La antigüedad se considera un factor de confiabilidad adicional."}
                </p>
              )}
              {step.label === "Consistencia en datos de contacto" && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified ? (
                    "El perfil mantiene estabilidad en su información de contacto sin cambios frecuentes, lo que indica confiabilidad."
                  ) : (
                    <span>
                      {step.details?.debug?.lastChangeDate ? (
                        <>
                          Se detectó un cambio de teléfono el <strong>{new Date(step.details.debug.lastChangeDate).toLocaleDateString()}</strong>.

                        </>
                      ) : (
                        "Se han detectado cambios recientes en los datos de contacto del perfil, lo que puede afectar la confiabilidad."
                      )}
                    </span>
                  )}
                </div>
              )}
              {step.label === "Verificación por redes sociales" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified
                    ? "El perfil ha proporcionado sus redes sociales y han sido verificadas como auténticas, coincidiendo con la información de la cuenta."
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