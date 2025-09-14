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
}

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

  if (error || !verificationData?.data) {
    return (
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Estado de Verificación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No se pudo cargar la información de verificación
          </p>
        </CardContent>
      </Card>
    );
  }

  const verification = verificationData.data;
  const steps = verification.steps;
  
  // Obtener el tipo de cuenta del usuario
  const userAccountType = verification.profile?.user?.accountType || 'common';
  const isAgencyUser = userAccountType === 'agency';

  // Calcular si el perfil tiene más de un año de antigüedad
  const profileCreatedAt = verification.profile?.createdAt || verification.createdAt;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const hasOneYearMembership = profileCreatedAt ? new Date(profileCreatedAt) <= oneYearAgo : false;

  // Definir los pasos de verificación con sus etiquetas
  const verificationSteps: VerificationStep[] = [
    {
      label: "Documentación de edad validada",
      isVerified: steps?.documentPhotos?.isVerified || false,
      hasData: (steps?.documentPhotos?.documents?.length || 0) > 0
    },
    {
      label: "Autenticidad de identidad confirmada",
      isVerified: steps?.selfieWithDoc?.isVerified || false,
      hasData: !!steps?.selfieWithDoc?.photo
    },
    {
      label: "Validación por videollamada completada",
      isVerified: steps?.video?.isVerified || false,
      hasData: !!steps?.video?.videoLink
    },
    {
      label: "Verificación por redes sociales",
      isVerified: steps?.socialMedia?.isVerified || false,
      hasData: !!steps?.socialMedia?.accounts && steps.socialMedia.accounts.length > 0
    },
    {
      label: "Miembro establecido con antigüedad",
      isVerified: hasOneYearMembership,
      hasData: true
    },
    {
      label: "Consistencia en datos de contacto",
      isVerified: !steps?.phoneChangeDetected,
      hasData: true
    }
  ];

  // Agregar el paso de depósito anticipado si aplica
  const hasAdvanceDeposit = false; // Esto requeriría información adicional del perfil
  if (hasAdvanceDeposit) {
    verificationSteps.push({
      label: "Pide depósito anticipado",
      isVerified: false,
      hasData: true
    });
  }

  const getStatusIcon = (step: VerificationStep) => {
    if (!step.hasData) {
      return <Clock className="h-4 w-4 text-gray-400" />;
    }
    if (step.isVerified) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (step: VerificationStep) => {
    if (!step.hasData) {
      return (
        <Badge variant="secondary" className="text-xs">
          Pendiente
        </Badge>
      );
    }
    if (step.isVerified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
          Verificado
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs">
        No verificado
      </Badge>
    );
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Factores que garantizan la confiabilidad de este perfil:
        </CardTitle>
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
              {step.label === "Documentación de edad validada" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified 
                    ? "El documento de identidad del usuario ha sido verificado correctamente y confirma que es mayor de edad."
                    : step.hasData 
                      ? "El documento de identidad está en proceso de revisión por nuestro equipo de verificación."
                      : "Este usuario aún no ha enviado su documento de identidad para verificación de edad."}
                </p>
              )}
              {step.label === "Autenticidad de identidad confirmada" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified 
                    ? "La identidad ha sido autenticada exitosamente mediante documentos oficiales que coinciden con las fotografías de verificación."
                    : step.hasData 
                      ? "La fotografía con documento está siendo revisada para confirmar la autenticidad de la identidad."
                      : "Este usuario aún no ha enviado una fotografía sosteniendo su documento de identidad."}
                </p>
              )}
              {step.label === "Validación por videollamada completada" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified 
                    ? "Se ha completado exitosamente la verificación en tiempo real mediante videollamada con identificación visual y cartel de validación."
                    : step.hasData 
                      ? "El video de verificación está siendo revisado por nuestro equipo especializado."
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
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified 
                    ? "El usuario mantiene estabilidad en su información de contacto sin cambios frecuentes, lo que indica confiabilidad."
                    : "Se han detectado cambios recientes en los datos de contacto del usuario, lo que puede afectar la confiabilidad."}
                </p>
              )}
              {step.label === "Verificación por redes sociales" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {step.isVerified 
                    ? "El perfil ha proporcionado sus redes sociales y han sido verificadas como auténticas, coincidiendo con la información de la cuenta."
                    : step.hasData 
                      ? "Las redes sociales proporcionadas están siendo verificadas por nuestro equipo."
                      : "Este perfil aún no ha proporcionado información de redes sociales para verificación."}
                </p>
              )}
              {step.label === "Pide depósito anticipado" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Pide depósito anticipado, hay usuarios que piden depósitos para confirmar su cita, esto no quiere decir que sea un mal usuario, valore usted el resto de factores de confiabilidad antes de quedar con él
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}