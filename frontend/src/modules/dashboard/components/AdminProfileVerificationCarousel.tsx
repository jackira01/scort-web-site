'use client';

import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useProfileVerification } from '@/hooks/use-profile-verification';
import { useProfile } from '@/hooks/use-profile';
import CloudinaryImage from '@/components/CloudinaryImage';
import { useProfileVerificationMutation } from '../hooks/useProfileVerificationMutation';
import { useUpdateProfileMutation } from '../hooks/useUpdateProfileMutation';
import { useVerificationChanges } from '../hooks/useVerificationChanges';
import { verificationSteps, getVerifiedCount } from '../config/verificationSteps.config';
import VerificationStepRenderer from './VerificationStepRenderer';
import type { AdminProfileVerificationCarouselProps, ProfileVerificationData } from '../types/verification.types';

// Component implementation

const AdminProfileVerificationCarousel: React.FC<
  AdminProfileVerificationCarouselProps
> = ({ isOpen, onOpenChange, profileName, profileId }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isActiveLocal, setIsActiveLocal] = useState<boolean>(true);

  // Fetch verification data using the hook
  const {
    data: verificationData,
    isLoading,
    error,
  } = useProfileVerification(profileId) as {
    data: ProfileVerificationData | undefined;
    isLoading: boolean;
    error: any;
  };

  // Fetch profile data using the hook
  const profileData = useProfile(profileId);

  // Custom hooks for managing verification changes
  const {
    hasChanges,
    handleToggleVerification,
    handleVideoLinkChange,
    getCurrentVerificationStatus,
    getCurrentVideoLink,
    resetChanges,
    buildUpdatedSteps,
  } = useVerificationChanges();

  // Mutation hook for updating verification
  const updateVerificationMutation = useProfileVerificationMutation({
    profileId,
    verificationId: verificationData?.data?._id,
    onSuccess: () => {
      // Callback adicional si es necesario
    }
  });

  // Mutation hook for updating profile
  const updateProfileMutation = useUpdateProfileMutation({
    profileId,
    onSuccess: () => {
      // Callback adicional si es necesario
    }
  });

  // Sincronizar isActiveLocal con los datos del perfil
  useEffect(() => {
    if (profileData.data?.isActive !== undefined) {
      setIsActiveLocal(profileData.data.isActive);
    }
  }, [profileData.data?.isActive]);

  // Detectar si isActive ha cambiado
  const hasIsActiveChanged = profileData.data?.isActive !== undefined && profileData.data.isActive !== isActiveLocal;

  // Detectar si hay cambios en general (verificación + isActive)
  const hasAnyChanges = hasChanges || hasIsActiveChanged;

  // Función personalizada para guardar todos los cambios
  const handleSaveAllChanges = async () => {
    try {
      // Guardar cambios de isActive si han cambiado
      if (hasIsActiveChanged) {
        await updateProfileMutation.mutateAsync({ isActive: isActiveLocal });
      }

      // Guardar cambios de verificación si los hay
      if (hasChanges) {
        await handleSaveChanges();
      }
    } catch (error) {
      // Los errores se manejan en los hooks de mutación
    }
  };

  // Función personalizada para cancelar todos los cambios
  const handleCancelAllChanges = () => {
    // Restaurar isActive al valor original
    if (profileData.data?.isActive !== undefined) {
      setIsActiveLocal(profileData.data.isActive);
    }

    // Cancelar cambios de verificación
    handleCancelChanges();
  };

  // Current step and navigation
  const currentStep = verificationSteps[currentStepIndex];

  // Navigation functions
  const handlePrevious = () => {
    setCurrentStepIndex((prev) =>
      prev > 0 ? prev - 1 : verificationSteps.length - 1,
    );
  };

  const handleNext = () => {
    setCurrentStepIndex((prev) =>
      prev < verificationSteps.length - 1 ? prev + 1 : 0,
    );
  };

  // Save and cancel functions
  const handleSaveChanges = async () => {
    if (!verificationData?.data) return;
    const updatedSteps = buildUpdatedSteps(verificationData.data);
    await updateVerificationMutation.mutateAsync(updatedSteps);
    resetChanges();
  };

  const handleCancelChanges = () => {
    resetChanges();
  };

  // Loading and error states
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verificación de Perfil</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando datos de verificación...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !verificationData?.data) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error de Verificación</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-red-600">
              <p>Error al cargar los datos de verificación</p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-4"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Verificación de Perfil - {profileName}</span>
              <Badge
                variant={
                  verificationData?.data?.verificationStatus === 'verified'
                    ? 'default'
                    : verificationData?.data?.verificationStatus === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {verificationData?.data?.verificationStatus === 'verified'
                  ? 'Verificado'
                  : verificationData?.data?.verificationStatus === 'rejected'
                    ? 'Rechazado'
                    : 'Pendiente'}
              </Badge>
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Cambios sin guardar
                </Badge>
              )}
            </DialogTitle>

            {/* Toggle para isActive */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Estado del perfil
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isActiveLocal ? 'Perfil activo y visible' : 'Perfil inactivo y oculto'}
                </span>
              </div>
              <Switch
                checked={isActiveLocal}
                onCheckedChange={setIsActiveLocal}
                disabled={profileData.isLoading}
              />
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Paso {currentStepIndex + 1} de {verificationSteps.length}
              </div>
              <Badge
                variant={
                  getVerifiedCount(verificationData.data) === verificationSteps.length
                    ? 'default'
                    : 'secondary'
                }
              >
                {getVerifiedCount(verificationData.data)}/{verificationSteps.length} Verificados
              </Badge>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center gap-2">
              {verificationSteps.map((_, index) => (
                <button
                  type="button"
                  key={`verification-step-${_.key}`}
                  onClick={() => setCurrentStepIndex(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${index === currentStepIndex
                    ? 'bg-primary'
                    : verificationData?.data?.steps?.[verificationSteps[index].key]
                      ?.isVerified
                      ? 'bg-green-500'
                      : 'bg-muted'
                    }`}
                />
              ))}
            </div>

            {/* Current step card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentStep.icon}
                    {currentStep.label}
                  </div>
                  <Badge
                    variant={
                      verificationData?.data?.steps?.[currentStep.key]?.isVerified
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {verificationData?.data?.steps?.[currentStep.key]?.isVerified ? (
                      <>
                        <Check className="h-3 w-3 mr-1" /> Verificado
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" /> No Verificado
                      </>
                    )}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentStep.description}
                  </p>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {currentStep.icon}
                    <div>
                      <div className="font-medium">{currentStep.label}</div>
                      <div className="text-sm text-muted-foreground">
                        Estado de verificación
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={getCurrentVerificationStatus(currentStep.key, verificationData.data)}
                    onCheckedChange={(checked) =>
                      handleToggleVerification(currentStep.key, checked)
                    }
                    disabled={updateVerificationMutation.isPending}
                  />
                </div>

                {/* Document preview section */}
                <div className="border rounded-lg p-4">
                  <VerificationStepRenderer
                    step={currentStep}
                    stepData={verificationData?.data?.steps?.[currentStep.key]}
                    onPreviewImage={setPreviewImage}
                    getCurrentVideoLink={(stepKey) => getCurrentVideoLink(stepKey, verificationData.data)}
                    handleVideoLinkChange={handleVideoLinkChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <Button
                variant="outline"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t">
              {hasAnyChanges ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelAllChanges}
                    className="flex-1"
                    disabled={updateVerificationMutation.isPending || updateProfileMutation.isPending}
                  >
                    Cancelar cambios
                  </Button>
                  <Button
                    onClick={handleSaveAllChanges}
                    className="flex-1"
                    disabled={updateVerificationMutation.isPending || updateProfileMutation.isPending}
                  >
                    {(updateVerificationMutation.isPending || updateProfileMutation.isPending) ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview modal - Moved outside main dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista previa de imagen</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <div className="relative">
                <CloudinaryImage
                  src={previewImage}
                  alt="Vista previa"
                  width={800}
                  height={600}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProfileVerificationCarousel;
