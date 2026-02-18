'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import axios from '@/lib/axios';
import {
  clearWhatsAppRedirectData,
  getWhatsAppRedirectData,
  isWhatsAppRedirectForProfile
} from '@/lib/whatsapp-redirect-storage';
import { uploadMultipleImages, uploadMultipleVideos } from '@/utils/tools';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Camera, CheckCircle, FileImage, MessageCircle, Share2, Upload, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { VerificationSuccessModal } from './VerificationSuccessModal';

const verificationSchema = z.object({
  documentVerification: z.object({
    frontPhoto: z.string().optional(),
    backPhoto: z.string().optional(),
  }),
  selfieVerification: z.object({
    photo: z.string().optional(),
  }),
  cartelVerification: z.object({
    mediaLink: z.string().optional(),
    mediaType: z.enum(['video', 'image']).optional(),
  }),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional(),
    onlyFans: z.string().optional(),
  }).optional(),
  deposito: z.boolean().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface VerificationStepsFormProps {
  profileId: string;
  verificationId: string;
  initialData: any;
  onSuccess: () => void;
  profileName?: string;
  userName?: string;
  initialStep?: number;
}

export function VerificationStepsForm({ profileId, verificationId, initialData, onSuccess, profileName, userName, initialStep }: VerificationStepsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [pendingFiles, setPendingFiles] = useState<{ [key: string]: File }>({});
  const [companyWhatsApp, setCompanyWhatsApp] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppRedirectData, setWhatsAppRedirectData] = useState<{
    companyNumber: string;
    message: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const isVerified = initialData.verificationStatus === 'check';

  // Refs for scrolling
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);
  const step6Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialStep) {
      const refs = [step1Ref, step2Ref, step3Ref, step4Ref, step5Ref, step6Ref];
      const ref = refs[initialStep - 1];
      if (ref && ref.current) {
        setTimeout(() => {
          ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [initialStep]);

  // Obtener número de WhatsApp de la empresa
  useEffect(() => {
    const fetchCompanyWhatsApp = async () => {
      try {
        const { ConfigParameterService } = await import('@/services/config-parameter.service');
        const whatsapp = await ConfigParameterService.getByKey('company.whatsapp.number').then(param => param.value as string).catch(() => '');
        setCompanyWhatsApp(whatsapp);
      } catch (error) {
        console.error('Error al obtener número de WhatsApp:', error);
      }
    };
    fetchCompanyWhatsApp();
  }, []);

  // Verificar si hay datos de redirección a WhatsApp pendientes
  useEffect(() => {
    const redirectData = getWhatsAppRedirectData();
    if (redirectData && isWhatsAppRedirectForProfile(profileId)) {
      setWhatsAppRedirectData({
        companyNumber: redirectData.companyNumber,
        message: redirectData.message,
      });
    }
  }, [profileId]);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentVerification: {
        frontPhoto: initialData.documentVerification?.frontPhoto || initialData.frontPhotoVerification?.photo || '',
        backPhoto: initialData.documentVerification?.backPhoto || initialData.backPhotoVerification?.photo || '',
      },
      selfieVerification: {
        photo: initialData.selfieVerification?.photo || '',
      },
      cartelVerification: {
        mediaLink: initialData.cartelVerification?.mediaLink || initialData.mediaVerification?.mediaLink || '',
        mediaType: initialData.cartelVerification?.mediaType || 'video',
      },
      socialMedia: {
        instagram: initialData.socialMedia?.instagram || '',
        facebook: initialData.socialMedia?.facebook || '',
        tiktok: initialData.socialMedia?.tiktok || '',
        twitter: initialData.socialMedia?.twitter || '',
        onlyFans: initialData.socialMedia?.onlyFans || '',
      },
      deposito: initialData.deposito !== undefined ? initialData.deposito : true, // Default true (asks for deposit)
    },
  });

  const watchedValues = form.watch();

  const handleWhatsAppContinue = () => {
    // Abrir WhatsApp
    if (whatsAppRedirectData) {
      const whatsappUrl = `https://wa.me/${whatsAppRedirectData.companyNumber}?text=${encodeURIComponent(whatsAppRedirectData.message)}`;
      window.open(whatsappUrl, '_blank');
    }

    // Limpiar datos de localStorage
    clearWhatsAppRedirectData();

    // Cerrar modal y redirigir a /cuenta
    setTimeout(() => {
      setShowWhatsAppModal(false);
      router.push('/cuenta');
    }, 300);
  };

  // Determinar el paso actual basado en los datos completados
  useEffect(() => {
    const { frontPhoto, backPhoto } = watchedValues.documentVerification;
    const { photo: selfiePhoto } = watchedValues.selfieVerification;
    const { mediaLink } = watchedValues.cartelVerification;
    const socialMediaFilled = Object.values(watchedValues.socialMedia || {}).some(val => !!val);

    if (!frontPhoto) {
      setCurrentStep(1);
    } else if (!backPhoto) {
      setCurrentStep(2);
    } else if (!mediaLink) {
      setCurrentStep(3);
    } else if (!selfiePhoto) {
      setCurrentStep(4);
    } else if (!socialMediaFilled) {
      setCurrentStep(5);
    } else if (watchedValues.deposito === undefined) {
      setCurrentStep(6);
    } else {
      setCurrentStep(6); // If all previous steps are done, stay on step 6 or indicate completion
    }
  }, [watchedValues.documentVerification, watchedValues.selfieVerification, watchedValues.cartelVerification, watchedValues.socialMedia, watchedValues.deposito]);

  const updateVerificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch(`/api/profile-verification/${verificationId}/steps`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Verificación actualizada exitosamente. Se ha notificado a la empresa para revisión.');
      queryClient.invalidateQueries({ queryKey: ['profileVerification', profileId] });

      // Si hay datos de WhatsApp pendientes, mostrar modal de redirección
      if (whatsAppRedirectData) {
        setShowWhatsAppModal(true);
      } else {
        // Si no hay datos de WhatsApp, continuar con el flujo normal
        onSuccess();
      }
    },
    onError: () => {
      toast.error('Error al actualizar la verificación');
    },
  });

  const handleFileUpload = async (files: File[], fieldName: string) => {
    if (files.length === 0) return;

    // Almacenar el archivo temporalmente sin subirlo a Cloudinary
    setPendingFiles(prev => ({ ...prev, [fieldName]: files[0] }));

    // Crear una URL temporal para mostrar preview
    const tempUrl = URL.createObjectURL(files[0]);

    if (fieldName === 'cartelVerification') {
      form.setValue('cartelVerification.mediaLink', tempUrl);
    } else if (fieldName === 'frontPhoto') {
      form.setValue('documentVerification.frontPhoto', tempUrl);
    } else if (fieldName === 'backPhoto') {
      form.setValue('documentVerification.backPhoto', tempUrl);
    } else if (fieldName === 'selfiePhoto') {
      form.setValue('selfieVerification.photo', tempUrl);
    }

    toast.success('Archivo seleccionado. Se subirá al guardar la verificación.');
  };

  const onSubmit = async (data: VerificationFormData) => {
    const { frontPhoto, backPhoto } = data.documentVerification;
    const isDocumentVerificationComplete = frontPhoto && backPhoto;
    const isCartelVerificationComplete = !!data.cartelVerification?.mediaLink;
    const isSelfieVerificationComplete = !!data.selfieVerification?.photo;

    // Validación: Se debe cumplir al menos uno de los bloques principales
    // Bloque A: Documento (Paso 1 y 2)
    // Bloque B: Cartel (Paso 3)
    // El Paso 4 requiere obligatoriamente el Bloque A

    if (!isDocumentVerificationComplete && !isCartelVerificationComplete) {
      toast.error('Debes completar al menos la verificación de documento (Pasos 1 y 2) o la verificación con cartel (Paso 3)');
      return;
    }

    // Si tiene el paso 1 pero no el 2, o viceversa (Incoherencia en Bloque A)
    if ((frontPhoto && !backPhoto) || (!frontPhoto && backPhoto)) {
      if (frontPhoto && !backPhoto) toast.error('Si subes el documento frontal (Paso 1), debes subir el reverso (Paso 2)');
      if (!frontPhoto && backPhoto) toast.error('Si subes el documento reverso (Paso 2), debes subir el frontal (Paso 1)');
      return;
    }

    // Si sube el paso 4, requiere pasos 1 y 2
    if (isSelfieVerificationComplete && !isDocumentVerificationComplete) {
      toast.error('Para enviar la foto con documento (Paso 4), debes completar primero la verificación de documento (Pasos 1 y 2)');
      return;
    }
    setIsSubmitting(true);

    try {
      // Subir archivos pendientes a Cloudinary
      const uploadedData = { ...data };

      for (const [fieldName, file] of Object.entries(pendingFiles)) {
        if (file) {
          setUploadingFiles(prev => ({ ...prev, [fieldName]: true }));

          try {
            let uploadedUrls: string[] = [];

            if (fieldName === 'cartelVerification') {
              // Detectar si es video o imagen
              const isVideo = file.type.startsWith('video/');

              if (isVideo) {
                const videoResults = await uploadMultipleVideos([file]);
                uploadedUrls = videoResults.map(result => result.link);

                if (uploadedUrls.length > 0) {
                  uploadedData.cartelVerification.mediaLink = uploadedUrls[0];
                  uploadedData.cartelVerification.mediaType = 'video';
                }
              } else {
                // Ya no permitimos imágenes en este paso, pero mantenemos la lógica por si acaso
                toast.error('Solo se permiten videos para este paso');
                return;
              }
            } else if (fieldName === 'frontPhoto') {
              uploadedUrls = (await uploadMultipleImages([file])).filter((url): url is string => url !== null);
              if (uploadedUrls.length > 0) {
                uploadedData.documentVerification.frontPhoto = uploadedUrls[0];
              }
            } else if (fieldName === 'backPhoto') {
              uploadedUrls = (await uploadMultipleImages([file])).filter((url): url is string => url !== null);
              if (uploadedUrls.length > 0) {
                uploadedData.documentVerification.backPhoto = uploadedUrls[0];
              }
            } else if (fieldName === 'selfiePhoto') {
              uploadedUrls = (await uploadMultipleImages([file])).filter((url): url is string => url !== null);
              if (uploadedUrls.length > 0) {
                uploadedData.selfieVerification.photo = uploadedUrls[0];
              }
            }
          } catch (error) {
            toast.error(`Error al subir ${fieldName}`);
            throw error;
          } finally {
            setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
          }
        }
      }

      // Actualizar la verificación con los datos subidos
      await updateVerificationMutation.mutateAsync({
        documentVerification: uploadedData.documentVerification,
        selfieVerification: uploadedData.selfieVerification,
        cartelVerification: uploadedData.cartelVerification,
        socialMedia: uploadedData.socialMedia,
        deposito: uploadedData.deposito,
      });

      // Limpiar archivos pendientes después del éxito
      setPendingFiles({});

    } catch (error) {
      console.error('Error submitting verification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileUpload = (
    fieldName: string,
    label: string,
    description: string,
    icon: React.ReactNode,
    isEnabled: boolean,
    currentValue?: string
  ) => {
    const isUploading = uploadingFiles[fieldName];
    const hasValue = !!currentValue;
    const hasPendingFile = !!pendingFiles[fieldName];
    const isPendingUrl = currentValue?.startsWith('blob:');

    return (
      <Card className={`transition-all duration-300 ${isEnabled ? 'border-purple-200 bg-white' : 'border-gray-200 bg-gray-50'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {label}
            {hasValue && !isPendingUrl && <CheckCircle className="h-5 w-5 text-green-500" />}
            {hasPendingFile && <Upload className="h-5 w-5 text-orange-500" />}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </CardHeader>
        <CardContent>
          {hasValue ? (
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 border rounded-lg ${isPendingUrl ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
                }`}>
                <div className="flex items-center gap-2">
                  {isPendingUrl ? (
                    <>
                      <Upload className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-700">Archivo seleccionado (se subirá al guardar)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">Archivo subido correctamente</span>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isPendingUrl) {
                      // Para archivos pendientes, mostrar en una nueva ventana
                      window.open(currentValue, '_blank');
                    } else {
                      // Para archivos ya subidos, abrir la URL de Cloudinary
                      window.open(currentValue, '_blank');
                    }
                  }}
                >
                  Ver
                </Button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2">
                <label
                  htmlFor={`${fieldName}-replace`}
                  className={`cursor-pointer flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 ${!isEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={(e) => {
                    if (!isEnabled && !isVerified) {
                      e.preventDefault();
                      toast.error(getDisabledToastMessage(fieldName));
                    }
                  }}
                >
                  <Input
                    type="file"
                    accept={(fieldName === 'mediaVerification' || fieldName === 'cartelVerification') ? 'video/*' : 'image/*'}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        handleFileUpload(files, fieldName);
                      }
                      // Reset input value to allow selecting same file
                      e.target.value = '';
                    }}
                    disabled={!isEnabled || isUploading}
                    className="hidden"
                    id={`${fieldName}-replace`}
                  />
                  <Upload className="h-4 w-4" />
                  Cambiar archivo
                </label>
                {!isEnabled && (
                  <p className="text-xs text-red-500 mt-1">
                    {isVerified
                      ? 'Este campo ya ha sido verificado y no se puede editar'
                      : 'Debes completar los pasos anteriores para modificar este archivo.'
                    }
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {(fieldName === 'mediaVerification' || fieldName === 'cartelVerification') ? 'Formatos: MP4, MOV, AVI' : 'Formatos: JPG, PNG, WEBP'}
                </p>
              </div>
            </div>
          ) : (
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isEnabled ? 'border-purple-300 hover:border-purple-400' : 'border-gray-300'
              }`}>
              <Input
                type="file"
                accept={(fieldName === 'mediaVerification' || fieldName === 'cartelVerification') ? 'video/*' : 'image/*'}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleFileUpload(files, fieldName);
                  }
                }}
                disabled={!isEnabled || isUploading}
                className="hidden"
                id={fieldName}
              />
              <label
                htmlFor={fieldName}
                className={`cursor-pointer flex flex-col items-center gap-2 ${!isEnabled ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                onClick={(e) => {
                  if (!isEnabled && !isVerified) {
                    e.preventDefault();
                    toast.error(getDisabledToastMessage(fieldName));
                  }
                }}
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {isUploading ? 'Subiendo...' : 'Haz clic para seleccionar'}
                </span>
                <span className="text-xs text-gray-500">
                  {(fieldName === 'mediaVerification' || fieldName === 'cartelVerification') ? 'Formatos: MP4, MOV, AVI' : 'Formatos: JPG, PNG, WEBP'}
                </span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const getDisabledToastMessage = (fieldName: string): string => {
    switch (fieldName) {
      case 'backPhoto':
        return 'Debes completar el paso 1 para poder completar el paso 2';
      case 'selfiePhoto':
        return 'Debes completar los pasos 1 y 2 para poder completar el paso 4';
      default:
        return 'Debes completar los pasos anteriores para poder completar este paso';
    }
  };

  const isStep1Complete = !!watchedValues.documentVerification.frontPhoto;
  const isStep2Complete = !!watchedValues.documentVerification.backPhoto;
  const isStep3Complete = !!watchedValues.cartelVerification.mediaLink;
  const isStep4Complete = !!watchedValues.selfieVerification.photo;
  const isStep5Complete = Object.values(watchedValues.socialMedia || {}).some(val => !!val);
  const isStep6Complete = watchedValues.deposito !== undefined;


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Indicator */}
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Verificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4 w-full">
                {[1, 2, 3, 4, 5, 6].map((step) => {
                  const status = getStepStatus(step);
                  return (
                    <div key={step} className={`flex items-center ${step < 6 ? 'flex-1' : ''}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                          }`}
                      >
                        {status === 'completed' ? <CheckCircle className="h-4 w-4" /> : step}
                      </div>
                      {step < 6 && (
                        <div
                          className={`h-1 mx-2 flex-1 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Paso {currentStep} de 6: {
                  currentStep === 1 ? 'Documento (frontal)' :
                    currentStep === 2 ? 'Documento (reverso)' :
                      currentStep === 3 ? 'Verificación con Cartel' :
                        currentStep === 4 ? 'Foto con documento' :
                          currentStep === 5 ? 'Redes Sociales' :
                            'Información de Depósito'
                }
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Document Front Photo */}
          <div ref={step1Ref}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-purple-500" />
                  Paso 1: Documento (frontal)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sube una foto clara del frente de tu documento de identidad
                </p>

                {/* Imagen guía */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    📋 Ejemplo de documento frontal:
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src="/images/Documento frontal.png"
                      alt="Ejemplo de documento frontal"
                      className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 text-center">
                    Asegúrate de que todos los datos sean legibles y la imagen esté bien iluminada
                  </p>
                </div>

                {renderFileUpload(
                  'frontPhoto',
                  '',
                  '',
                  <></>,
                  !isVerified,
                  watchedValues.documentVerification.frontPhoto
                )}
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Document Back Photo */}
          <div ref={step2Ref}>
            <Card className={`border-2 transition-all duration-300 ${isStep1Complete
              ? 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'
              : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
              }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-purple-500" />
                  Paso 2: Documento (reverso)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sube una foto clara del reverso de tu documento de identidad
                </p>

                {/* Imagen guía */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    📋 Ejemplo de documento reverso:
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src="/images/Documento reverso.png"
                      alt="Ejemplo de documento reverso"
                      className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 text-center">
                    Asegúrate de que todos los datos sean legibles y la imagen esté bien iluminada
                  </p>
                </div>

                {renderFileUpload(
                  'backPhoto',
                  '',
                  '',
                  <></>,
                  !isVerified && isStep1Complete,
                  watchedValues.documentVerification.backPhoto
                )}
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Video de verificación con cartel */}
          <div ref={step3Ref}>
            <Card className={`border-2 transition-all duration-300 ${!isVerified
              ? 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'
              : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
              }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  Paso 3: Verificación con Cartel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-3 text-gray-600 dark:text-gray-300">
                    Sube un video con un cartel que indique el nombre de tu perfil y la fecha en que subes el video.
                  </p>

                  {/* Imagen de referencia */}
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      📋 Ejemplo de referencia:
                    </p>
                    <div className="flex justify-center">
                      <img
                        src="/images/perfil con cartel.png"
                        alt="Ejemplo de foto con cartel"
                        className="max-w-full h-auto max-h-48 rounded-lg border border-blue-300"
                      />
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 text-center">
                      La persona debe sostener un cartel con el nombre del perfil y la fecha
                    </p>
                  </div>
                </div>

                {renderFileUpload(
                  'cartelVerification',
                  '',
                  '',
                  <></>,
                  !isVerified,
                  watchedValues.cartelVerification.mediaLink
                )}
              </CardContent>
            </Card>
          </div>

          {/* Step 4: Foto con documento al lado del rostro */}
          <div ref={step4Ref}>
            <Card className={`border-2 transition-all duration-300 ${isStep1Complete && isStep2Complete
              ? 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'
              : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
              }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-purple-500" />
                  Paso 4: Foto con documento al lado del rostro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sube una foto sosteniendo el documento de identidad al lado de tu rostro
                </p>

                {/* Imagen guía */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    📋 Ejemplo de rostro con documento:
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src="/images/document guide.png"
                      alt="Ejemplo de rostro con documento"
                      className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 text-center">
                    La persona debe sostener el documento al lado de su rostro (mismo documento del paso 1)
                  </p>
                </div>

                {renderFileUpload(
                  'selfiePhoto',
                  '',
                  '',
                  <></>,
                  !isVerified && isStep1Complete && isStep2Complete,
                  watchedValues.selfieVerification.photo
                )}
              </CardContent>
            </Card>
          </div>

          {/* Step 5: Redes Sociales */}
          <div ref={step5Ref}>
            <Card className={`border-2 transition-all duration-300 ${isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete
              ? 'border-purple-200 bg-purple-50 dark:bg-purple-950/20'
              : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
              }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-purple-500" />
                  Paso 5: Redes Sociales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isVerified && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-800 dark:text-red-900">
                        Este perfil ya ha sido verificado. No puedes editar la información.
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-900">
                      <strong>Importante:</strong> Las redes sociales deben ser públicas mientras se realiza el proceso de validación para poder verificar que te pertenecen. Estas no se mostrarán en tu perfil (a excepción del instagram). Puedes diligenciar una o todas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instagram</label>
                    <Input
                      placeholder="@usuario"
                      {...form.register('socialMedia.instagram')}
                      disabled={isVerified}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Facebook</label>
                    <Input
                      placeholder="usuario o enlace"
                      {...form.register('socialMedia.facebook')}
                      disabled={isVerified}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TikTok</label>
                    <Input
                      placeholder="@usuario"
                      {...form.register('socialMedia.tiktok')}
                      disabled={isVerified}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twitter/X</label>
                    <Input
                      placeholder="@usuario"
                      {...form.register('socialMedia.twitter')}
                      disabled={isVerified}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">OnlyFans</label>
                    <Input
                      placeholder="usuario o enlace"
                      {...form.register('socialMedia.onlyFans')}
                      disabled={isVerified}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Warnings */}
          {isStep1Complete && !isStep2Complete && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Importante:</strong> Completa el Paso 2 (documento reverso) para continuar.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}





          {/* Sección de Verificación por Videollamada */}
          {companyWhatsApp && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <MessageCircle className="h-5 w-5" />
                  Verificación por Videollamada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-green-500 text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                  onClick={() => {
                    const userInfo = userName ? `Usuario: ${userName}` : '';
                    const profileInfo = profileName ? `Perfil: ${profileName}` : '';
                    const profileIdInfo = `ID del perfil: ${profileId}`;
                    const parts = [userInfo, profileInfo, profileIdInfo].filter(Boolean);
                    const message = `Hola, me gustaría solicitar una cita para verificación por videollamada de 1 minuto.\n\n${parts.join('\n')}`;
                    const whatsappUrl = `https://wa.me/${companyWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Solicitar Verificación por Videollamada
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={
                isVerified ||
                isSubmitting ||
                Object.values(uploadingFiles).some(Boolean) ||
                (!isStep1Complete && !isStep3Complete) // Debe tener al menos algo iniciado (Paso 1 o Paso 3)
              }
              className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white ${!isVerified && !isSubmitting && !Object.values(uploadingFiles).some(Boolean) && (isStep1Complete || isStep3Complete)
                ? 'hover:from-purple-700 hover:to-pink-700'
                : 'opacity-50 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? 'Guardando...' : 'Enviar Verificación'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Modal de éxito con redirección a WhatsApp */}
      <VerificationSuccessModal
        isOpen={showWhatsAppModal}
        onContinue={handleWhatsAppContinue}
      />
    </>
  );
}