'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Phone,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useProfileVerification } from '@/hooks/use-profile-verification';
import CloudinaryImage from '@/components/CloudinaryImage';

// Types matching backend schema
interface ProfileVerificationData {
  _id: string;
  profile: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationProgress: number;
  steps: {
    documentPhotos: {
      documents: string[];
      isVerified: boolean;
    };
    selfieWithPoster: {
      photo?: string;
      isVerified: boolean;
    };
    selfieWithDoc: {
      photo?: string;
      isVerified: boolean;
    };
    fullBodyPhotos: {
      photos: string[];
      isVerified: boolean;
    };
    video: {
      videoLink?: string;
      isVerified: boolean;
    };
    videoCallRequested: {
      videoLink?: string;
      isVerified: boolean;
    };
    socialMedia: {
      accounts: string[];
      isVerified: boolean;
    };
  };
}

interface VerificationStep {
  key: keyof ProfileVerificationData['steps'];
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface AdminProfileVerificationCarouselProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  profileId: string;
}

const AdminProfileVerificationCarousel: React.FC<
  AdminProfileVerificationCarouselProps
> = ({ isOpen, onOpenChange, profileName, profileId }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [pendingVideoLinks, setPendingVideoLinks] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

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

  // Static verification steps configuration
  const verificationSteps: VerificationStep[] = [
    {
      key: 'documentPhotos',
      label: 'Fotos de Documento',
      icon: <FileText className="h-5 w-5" />,
      description: 'Verificación de documentos de identidad',
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

  // Mutation to update verification steps
  const updateVerificationMutation = useMutation({
    mutationFn: async (stepsData: Record<string, any>) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile-verification/${verificationData?.data?._id}/steps`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stepsData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la verificación');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Cambios guardados exitosamente');
      setHasChanges(false);
      setPendingChanges({});
      setPendingVideoLinks({});
      queryClient.invalidateQueries({
        queryKey: ['profileVerification', profileId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar los cambios');
    },
  });

  const currentStep = verificationSteps[currentStepIndex];

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

  const handleToggleVerification = (
    stepKey: keyof ProfileVerificationData['steps'],
    isVerified: boolean,
  ) => {
    if (!verificationData?.data) return;

    // Actualizar cambios pendientes
    setPendingChanges(prev => ({
      ...prev,
      [stepKey]: isVerified
    }));
    
    setHasChanges(true);
  };

  const handleVideoLinkChange = (
    stepKey: 'video' | 'videoCallRequested',
    videoLink: string,
  ) => {
    setPendingVideoLinks(prev => ({
      ...prev,
      [stepKey]: videoLink
    }));
    
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    if (!verificationData?.data || (Object.keys(pendingChanges).length === 0 && Object.keys(pendingVideoLinks).length === 0)) return;

    // Construir el objeto de pasos con el formato correcto
    const currentSteps = verificationData.data.steps;
    const updatedSteps = { ...currentSteps };

    // Aplicar los cambios pendientes de verificación
    Object.entries(pendingChanges).forEach(([stepKey, isVerified]) => {
      if (updatedSteps[stepKey as keyof typeof updatedSteps]) {
        updatedSteps[stepKey as keyof typeof updatedSteps] = {
          ...updatedSteps[stepKey as keyof typeof updatedSteps],
          isVerified
        };
      }
    });

    // Aplicar los cambios pendientes de videoLink
    Object.entries(pendingVideoLinks).forEach(([stepKey, videoLink]) => {
      if (updatedSteps[stepKey as keyof typeof updatedSteps]) {
        updatedSteps[stepKey as keyof typeof updatedSteps] = {
          ...updatedSteps[stepKey as keyof typeof updatedSteps],
          videoLink
        };
      }
    });

    updateVerificationMutation.mutate(updatedSteps);
  };

  const handleCancelChanges = () => {
    setPendingChanges({});
    setPendingVideoLinks({});
    setHasChanges(false);
  };

  // Función para obtener el estado actual de verificación (considerando cambios pendientes)
  const getCurrentVerificationStatus = (stepKey: keyof ProfileVerificationData['steps']) => {
    if (stepKey in pendingChanges) {
      return pendingChanges[stepKey];
    }
    return verificationData?.data?.steps?.[stepKey]?.isVerified || false;
  };

  // Función para obtener el valor actual del videoLink (considerando cambios pendientes)
  const getCurrentVideoLink = (stepKey: 'video' | 'videoCallRequested') => {
    if (stepKey in pendingVideoLinks) {
      return pendingVideoLinks[stepKey];
    }
    return verificationData?.data?.steps?.[stepKey]?.videoLink || '';
  };

  const getVerifiedCount = () => {
    if (!verificationData?.data?.steps) return 0;
    
    return Object.values(verificationData.data.steps).filter(step => 
      step && step.status === 'verified'
    ).length;
  };

  const renderDocumentPreview = (
    stepKey: keyof ProfileVerificationData['steps'],
  ) => {
    if (!verificationData || !verificationData.data || !verificationData.data.steps) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">No hay datos de verificación disponibles</p>
        </div>
      );
    }

    const stepData = verificationData.data.steps[stepKey];

    // Render based on step type
    switch (stepKey) {
      case 'documentPhotos': {
        const documents = (stepData as ProfileVerificationData['steps']['documentPhotos']).documents || [];
        
        if (documents.length === 0) {
          return (
            <div className="mt-4 text-gray-500 text-center">
              No hay documentos disponibles.
            </div>
          );
        }
        
        return (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {documents.map((doc, index) => {
                return (
                  <div key={`document-${doc}`} className="relative group">
                    <div className="relative">
                      <CloudinaryImage
                        src={doc}
                        alt={`Documento ${index + 1}`}
                        width={150}
                        height={100}
                        className="rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImage(doc)}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'selfieWithDoc':
      case 'selfieWithPoster': {
        const photo = (stepData as ProfileVerificationData['steps']['selfieWithDoc'] | ProfileVerificationData['steps']['selfieWithPoster']).photo;
        
        if (!photo) {
          return (
            <div className="mt-4 text-gray-500 text-center">
              No hay foto disponible.
            </div>
          );
        }
        
        return (
          <div className="mt-4">
            <div className="relative group inline-block">
              <div className="relative">
                <CloudinaryImage
                  src={photo}
                  alt="Selfie"
                  width={200}
                  height={150}
                  className="rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewImage(photo)}
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        );
      }

      case 'fullBodyPhotos': {
        const photos = (stepData as ProfileVerificationData['steps']['fullBodyPhotos']).photos || [];
        
        if (photos.length === 0) {
          return (
            <div className="mt-4 text-gray-500 text-center">
              No hay fotos disponibles.
            </div>
          );
        }
        
        return (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, index) => {
                return (
                  <div key={index} className="relative group">
                    <div className="relative">
                      <CloudinaryImage
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        width={150}
                        height={100}
                        className="rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImage(photo)}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'video':
      case 'videoCallRequested': {
        const currentVideoLink = getCurrentVideoLink(stepKey as 'video' | 'videoCallRequested');
        
        return (
          <div className="mt-4 space-y-4">
            {/* Input para editar el videoLink */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {stepKey === 'videoCallRequested' ? 'Link de Videollamada' : 'Link de Video'}
              </label>
              <Input
                type="url"
                placeholder={stepKey === 'videoCallRequested' ? 'https://meet.google.com/...' : 'https://...'}
                value={currentVideoLink}
                onChange={(e) => handleVideoLinkChange(stepKey as 'video' | 'videoCallRequested', e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Mostrar el video/link actual si existe */}
            {currentVideoLink && (
              <div>
                {/* Check if it's a video file or external link */}
                {(
                  currentVideoLink.includes('.mp4') ||
                  currentVideoLink.includes('.webm') ||
                  currentVideoLink.includes('.ogg')
                ) ? (
                  <video
                    src={currentVideoLink}
                    controls
                    className="w-full max-w-md rounded-lg"
                  >
                    Tu navegador no soporta el elemento de video.
                  </video>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(currentVideoLink, '_blank');
                    }}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {stepKey === 'videoCallRequested'
                      ? 'Abrir videollamada'
                      : 'Ver video'}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'socialMedia': {
        const accounts = (stepData as ProfileVerificationData['steps']['socialMedia']).accounts || [];
        
        if (accounts.length === 0) {
          return (
            <div className="mt-4 text-gray-500 text-center">
              No hay cuentas de redes sociales.
            </div>
          );
        }
        
        return (
          <div className="mt-4">
            <div className="space-y-2">
              {accounts.map((account, index) => {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      window.open(account, '_blank');
                    }}
                    className="flex items-center gap-2 w-full justify-start"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {account}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="mt-4 text-gray-500 text-center">
            No hay contenido disponible.
          </div>
        );
    }
  };

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

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error de Verificación</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <X className="h-8 w-8 text-destructive mx-auto mb-4" />
              <p>Error al cargar los datos de verificación</p>
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
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Paso {currentStepIndex + 1} de {verificationSteps.length}
            </div>
            <Badge
              variant={
                getVerifiedCount() === verificationSteps.length
                  ? 'default'
                  : 'secondary'
              }
            >
              {getVerifiedCount()}/{verificationSteps.length} Verificados
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
                  : verificationData?.steps?.[verificationSteps[index].key]
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
                    verificationData?.steps?.[currentStep.key]?.isVerified
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
                  checked={getCurrentVerificationStatus(currentStep.key)}
                  onCheckedChange={(checked) =>
                    handleToggleVerification(currentStep.key, checked)
                  }
                  disabled={updateVerificationMutation.isPending}
                />
              </div>

              {/* Document preview section */}
              <div className="border rounded-lg p-4">
                {renderDocumentPreview(currentStep.key)}
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
            {hasChanges ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelChanges}
                  className="flex-1"
                  disabled={updateVerificationMutation.isPending}
                >
                  Cancelar cambios
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  className="flex-1"
                  disabled={updateVerificationMutation.isPending}
                >
                  {updateVerificationMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
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
