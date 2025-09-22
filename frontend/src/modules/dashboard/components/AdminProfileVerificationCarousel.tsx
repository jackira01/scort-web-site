'use client';

import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Instagram,
  Facebook,
  Twitter,
  ExternalLink,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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

  // Debug log para verificar los datos de verificación
  useEffect(() => {
    console.log('🔍 AdminProfileVerificationCarousel - verificationData changed:');
    console.log('📊 Full verificationData object:', verificationData);
    console.log('📋 verificationData type:', typeof verificationData);
    console.log('🔑 verificationData keys:', verificationData ? Object.keys(verificationData) : 'No data');
    
    if (verificationData) {
      console.log('🔍 Detailed structure analysis:');
      console.log('- _id (direct):', verificationData._id);
      console.log('- success:', verificationData.success);
      console.log('- data:', verificationData.data);
      
      // Si tiene la estructura { success: true, data: { _id, steps, ... } }
      if (verificationData.success && verificationData.data) {
        console.log('📋 Backend response structure detected:');
        console.log('- verificationData.data._id:', verificationData.data._id);
        console.log('- verificationData.data.steps:', verificationData.data.steps);
        console.log('- verificationData.data.verificationStatus:', verificationData.data.verificationStatus);
        console.log('- verificationData.data.verificationProgress:', verificationData.data.verificationProgress);
        
        if (verificationData.data.steps) {
          console.log('🔍 Steps structure:');
          Object.entries(verificationData.data.steps).forEach(([stepKey, stepValue]) => {
            console.log(`- ${stepKey}:`, stepValue);
          });
        }
      }
      // Si tiene la estructura directa { _id, data: { steps: ... } }
      else if (verificationData._id && verificationData.data) {
        console.log('📋 Direct structure detected:');
        console.log('- Direct _id:', verificationData._id);
        console.log('- Direct data.steps:', verificationData.data.steps);
      }
    }
    
    console.log('✅ hasData:', !!verificationData);
  }, [verificationData]);

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

  // Debug log para entender por qué el botón permanece deshabilitado
  useEffect(() => {
    console.log('🔍 Changes detection:', {
      hasChanges,
      hasIsActiveChanged,
      hasAnyChanges,
      verificationDataExists: !!verificationData,
      verificationId: verificationData?.data?._id
    });
  }, [hasChanges, hasIsActiveChanged, hasAnyChanges, verificationData]);

  // Función personalizada para guardar todos los cambios
  const handleSaveAllChanges = async () => {
    console.log('🔍 DEBUG handleSaveAllChanges:');
    console.log('📊 hasIsActiveChanged:', hasIsActiveChanged);
    console.log('📊 hasChanges:', hasChanges);
    console.log('📊 verificationData:', verificationData);

    try {
      // Guardar cambios de isActive si han cambiado
      if (hasIsActiveChanged) {
        console.log('💾 Guardando cambios de isActive...');
        const profileResult = await updateProfileMutation.mutateAsync({ isActive: isActiveLocal });
        console.log('✅ Cambios de isActive guardados:', profileResult);
      }

      // Guardar cambios de verificación si los hay
      if (hasChanges) {
        console.log('💾 Guardando cambios de verificación...');
        await handleSaveChanges();
      }

      toast.success('Todos los cambios han sido guardados exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar los cambios:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  // Función personalizada para cancelar todos los cambios
  const handleCancelAllChanges = () => {
    console.log('🔄 Canceling all changes');
    // Restaurar isActive al valor original
    if (profileData.data?.isActive !== undefined) {
      setIsActiveLocal(profileData.data.isActive);
    }

    // Cancelar cambios de verificación
    resetChanges();
    console.log('✅ All changes canceled');
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
    // Debug: Verificar datos antes de guardar
    console.log('🔍 DEBUG handleSaveChanges:');
    console.log('📊 verificationData:', verificationData);
    
    // Verificar si tenemos datos de verificación válidos
    if (!verificationData) {
      console.log('❌ No verificationData available');
      toast.error('No se puede guardar: datos de verificación no disponibles');
      return;
    }

    // Extraer datos correctamente según la estructura del backend
    let actualVerificationData;
    let verificationId;

    // La estructura del backend siempre es { success: true, data: { _id, ... } }
    if (verificationData.success && verificationData.data?._id) {
      console.log('📋 Backend structure detected');
      actualVerificationData = verificationData.data;
      verificationId = verificationData.data._id;
      console.log('- Using verificationData.data._id:', verificationId);
      console.log('- Using verificationData.data for processing:', actualVerificationData);
    }
    // Fallback para estructura directa (no debería ocurrir con el backend actual)
    else if (verificationData._id && verificationData.steps) {
      console.log('📋 Direct structure detected (fallback)');
      actualVerificationData = verificationData;
      verificationId = verificationData._id;
      console.log('- Using direct _id:', verificationId);
      console.log('- Using direct data for processing:', actualVerificationData);
    }
    else {
      console.log('❌ Invalid verificationData structure:', verificationData);
      console.log('Available keys:', verificationData ? Object.keys(verificationData) : 'No data');
      if (verificationData?.data) {
        console.log('Data keys:', Object.keys(verificationData.data));
      }
      toast.error('Estructura de datos de verificación inválida');
      return;
    }

    // Verificar si tenemos el ID de verificación
    if (!verificationId) {
      console.log('❌ No verification ID available');
      toast.error('No se puede guardar: ID de verificación no disponible');
      return;
    }

    // Verificar si tenemos steps válidos (considerando estructura anidada)
    const stepsData = actualVerificationData?.data?.steps || actualVerificationData?.steps;
    if (!stepsData) {
      console.log('❌ No steps data available');
      console.log('- actualVerificationData.data:', actualVerificationData?.data);
      console.log('- actualVerificationData.steps:', actualVerificationData?.steps);
      toast.error('No se puede guardar: datos de steps no disponibles');
      return;
    }

    try {
      console.log('🚀 Proceeding with save operation...');
      console.log('📤 Data to send to buildUpdatedSteps:', verificationData);
      
      const updatedSteps = buildUpdatedSteps(verificationData);
      console.log('📤 Sending updated steps:', updatedSteps);
      
      const result = await updateVerificationMutation.mutateAsync(updatedSteps);
      console.log('✅ Save result:', result);
      resetChanges();
    } catch (error) {
      console.error('❌ Error al guardar cambios de verificación:', error);
      toast.error('Error al guardar los cambios de verificación');
    }
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

  if (error || !verificationData) {
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

  // Validación adicional para asegurar que verificationData esté completamente cargado
  if (!verificationData?.data?.steps) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verificación de Perfil</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando estructura de verificación...</p>
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
                  verificationData?.verificationStatus === 'verified'
                    ? 'default'
                    : verificationData?.verificationStatus === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {verificationData?.verificationStatus === 'verified'
                  ? 'Verificado'
                  : verificationData?.verificationStatus === 'rejected'
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
            {/* Social Media Section */}

            {/* Progress indicator */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Paso {currentStepIndex + 1} de {verificationSteps.length}
              </div>
              <Badge
                variant={
                  getVerifiedCount(verificationData) === verificationSteps.length
                    ? 'default'
                    : 'secondary'
                }
              >
                {getVerifiedCount(verificationData)}/{verificationSteps.length} Verificados
              </Badge>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center gap-2">
              {verificationSteps.map((step, index) => (
                <button
                  type="button"
                  key={`verification-step-${step.key}`}
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
                  <Switch
                    checked={getCurrentVerificationStatus(currentStep.key, verificationData)}
                    onCheckedChange={(checked) =>
                      handleToggleVerification(currentStep.key, checked)
                    }
                    disabled={updateVerificationMutation.isPending}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentStep.description}
                  </p>
                )}

                {/* <div className="flex items-center justify-between p-4 border rounded-lg">
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
                    checked={getCurrentVerificationStatus(currentStep.key, verificationData?.data)}
                    onCheckedChange={(checked) =>
                      handleToggleVerification(currentStep.key, checked)
                    }
                    disabled={updateVerificationMutation.isPending}
                  />
                </div> */}

                {/* Document preview section */}
                {currentStep.label === 'Redes Sociales' ?
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Redes Sociales</h3>

                    {(() => {
                      // Obtener los datos de socialMedia del perfil
                      const socialMedia = profileData.data?.socialMedia;

                      return socialMedia && (
                        socialMedia.instagram ||
                        socialMedia.facebook ||
                        socialMedia.tiktok ||
                        socialMedia.twitter ||
                        socialMedia.onlyFans
                      ) ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {socialMedia.instagram && (
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                                    <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">Instagram</h4>
                                    <p className="text-sm text-muted-foreground break-all">
                                      {socialMedia.instagram}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(`https://www.instagram.com/${socialMedia.instagram}`, "_blank")
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {socialMedia.facebook && (
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">Facebook</h4>
                                    <p className="text-sm text-muted-foreground break-all">
                                      {socialMedia.facebook}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(`https://www.facebook.com/${socialMedia.facebook}`, "_blank")
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {socialMedia.tiktok && (
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <ExternalLink className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">TikTok</h4>
                                    <p className="text-sm text-muted-foreground break-all">
                                      {socialMedia.tiktok}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(`https://www.tiktok.com/@${socialMedia.tiktok}`, "_blank")
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {socialMedia.twitter && (
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
                                    <Twitter className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">Twitter</h4>
                                    <p className="text-sm text-muted-foreground break-all">
                                      {socialMedia.twitter}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(`https://twitter.com/${socialMedia.twitter}`, "_blank")
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {socialMedia.onlyFans && (
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <ExternalLink className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">OnlyFans</h4>
                                    <p className="text-sm text-muted-foreground break-all">
                                      {socialMedia.onlyFans}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(`https://onlyfans.com/${socialMedia.onlyFans}`, "_blank")
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <div className="space-y-3">
                              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
                                <ExternalLink className="h-8 w-8 text-gray-400" />
                              </div>
                              <h4 className="font-medium text-gray-600 dark:text-gray-400">
                                No hay redes sociales configuradas
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Este perfil no ha configurado ninguna red social
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div> :
                  (<div className="border rounded-lg p-4">
                    {(() => {
                      // Obtener los datos del paso actual desde el objeto steps
                      const stepData = verificationData?.data?.steps?.[currentStep.key as keyof typeof verificationData.data.steps];

                      return (
                        <VerificationStepRenderer
                          step={currentStep}
                          stepData={stepData}
                          onPreviewImage={setPreviewImage}
                          getCurrentVideoLink={(stepKey) => getCurrentVideoLink(stepKey, verificationData)}
                          handleVideoLinkChange={handleVideoLinkChange}
                        />
                      );
                    })()}
                  </div>)}
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
                    disabled={
                      updateVerificationMutation.isPending || 
                      updateProfileMutation.isPending
                    }
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
