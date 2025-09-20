'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { uploadMultipleImages, uploadMultipleVideos } from '@/utils/tools';
import { CheckCircle, Upload, AlertCircle, FileImage, Video, Camera } from 'lucide-react';
import axios from '@/lib/axios';

const verificationSchema = z.object({
  documentPhotos: z.object({
    frontPhoto: z.string().optional(),
    backPhoto: z.string().optional(),
    selfieWithDocument: z.string().optional(),
  }),
  videoVerification: z.object({
    videoLink: z.string().optional(),
  }),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface VerificationStepsFormProps {
  profileId: string;
  verificationId: string;
  initialData: any;
  onSuccess: () => void;
}

export function VerificationStepsForm({ profileId, verificationId, initialData, onSuccess }: VerificationStepsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [pendingFiles, setPendingFiles] = useState<{ [key: string]: File }>({});
  const queryClient = useQueryClient();

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentPhotos: {
        frontPhoto: initialData.documentPhotos?.frontPhoto || '',
        backPhoto: initialData.documentPhotos?.backPhoto || '',
        selfieWithDocument: initialData.documentPhotos?.selfieWithDocument || '',
      },
      videoVerification: {
        videoLink: initialData.videoVerification?.videoLink || '',
      },
    },
  });

  const watchedValues = form.watch();

  // Determinar el paso actual basado en los datos completados
  useEffect(() => {
    const { frontPhoto, backPhoto, selfieWithDocument } = watchedValues.documentPhotos;
    
    if (!frontPhoto) {
      setCurrentStep(1);
    } else if (!backPhoto) {
      setCurrentStep(2);
    } else if (!selfieWithDocument) {
      setCurrentStep(3);
    } else {
      setCurrentStep(4);
    }
  }, [watchedValues.documentPhotos]);

  const updateVerificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.patch(`/api/profile-verification/${verificationId}/steps`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Verificación actualizada exitosamente. Se ha notificado a la empresa para revisión.');
      queryClient.invalidateQueries({ queryKey: ['profileVerification', profileId] });
      onSuccess();
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
    
    if (fieldName === 'videoVerification') {
      form.setValue('videoVerification.videoLink', tempUrl);
    } else {
      form.setValue(`documentPhotos.${fieldName}` as any, tempUrl);
    }
    
    toast.success('Archivo seleccionado. Se subirá al guardar la verificación.');
  };

  const onSubmit = async (data: VerificationFormData) => {
    // Validar que si se completó el paso 1, también se completen 2 y 3
    const { frontPhoto, backPhoto, selfieWithDocument } = data.documentPhotos;
    
    if (frontPhoto && (!backPhoto || !selfieWithDocument)) {
      toast.error('Si subes la foto frontal del documento, debes completar también el reverso y la selfie con documento');
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

            if (fieldName === 'videoVerification') {
              const videoResults = await uploadMultipleVideos([file]);
              uploadedUrls = videoResults.map(result => result.link);
              if (uploadedUrls.length > 0) {
                uploadedData.videoVerification.videoLink = uploadedUrls[0];
              }
            } else {
              uploadedUrls = (await uploadMultipleImages([file])).filter((url): url is string => url !== null);
              if (uploadedUrls.length > 0) {
                (uploadedData.documentPhotos as any)[fieldName] = uploadedUrls[0];
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
        documentPhotos: uploadedData.documentPhotos,
        videoVerification: uploadedData.videoVerification,
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
          <p className="text-sm text-gray-600">{description}</p>
        </CardHeader>
        <CardContent>
          {hasValue ? (
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 border rounded-lg ${
                isPendingUrl ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Input
                type="file"
                accept={fieldName === 'videoVerification' ? 'video/*' : 'image/*'}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleFileUpload(files, fieldName);
                  }
                }}
                disabled={!isEnabled || isUploading}
                className="hidden"
                id={`${fieldName}-replace`}
              />
                <label
                  htmlFor={`${fieldName}-replace`}
                  className={`cursor-pointer text-sm text-gray-600 ${!isEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  Cambiar archivo
                </label>
              </div>
            </div>
          ) : (
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isEnabled ? 'border-purple-300 hover:border-purple-400' : 'border-gray-300'
            }`}>
              <Input
                type="file"
                accept={fieldName === 'videoVerification' ? 'video/*' : 'image/*'}
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
                className={`cursor-pointer flex flex-col items-center gap-2 ${
                  !isEnabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {isUploading ? 'Subiendo...' : 'Haz clic para seleccionar'}
                </span>
                <span className="text-xs text-gray-500">
                  {fieldName === 'videoVerification' ? 'Formatos: MP4, MOV, AVI' : 'Formatos: JPG, PNG, WEBP'}
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

  const isStep1Complete = !!watchedValues.documentPhotos.frontPhoto;
  const isStep2Complete = !!watchedValues.documentPhotos.backPhoto;
  const isStep3Complete = !!watchedValues.documentPhotos.selfieWithDocument;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress Indicator */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => {
                const status = getStepStatus(step);
                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {status === 'completed' ? <CheckCircle className="h-4 w-4" /> : step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`w-16 h-1 mx-2 ${
                          step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-gray-600">
              Paso {currentStep} de 4: {
                currentStep === 1 ? 'Documento (frontal)' :
                currentStep === 2 ? 'Documento (reverso)' :
                currentStep === 3 ? 'Selfie con documento' :
                'Video de verificación (opcional)'
              }
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Document Front Photo */}
        {renderFileUpload(
          'frontPhoto',
          'Paso 1: Documento (frontal)',
          'Sube una foto clara del frente de tu documento de identidad',
          <FileImage className="h-5 w-5 text-purple-500" />,
          true,
          watchedValues.documentPhotos.frontPhoto
        )}

        {/* Step 2: Document Back Photo */}
        {renderFileUpload(
          'backPhoto',
          'Paso 2: Documento (reverso)',
          'Sube una foto clara del reverso de tu documento de identidad',
          <FileImage className="h-5 w-5 text-purple-500" />,
          isStep1Complete,
          watchedValues.documentPhotos.backPhoto
        )}

        {/* Step 3: Selfie with Document */}
        {renderFileUpload(
          'selfieWithDocument',
          'Paso 3: Selfie con documento',
          'Tómate una selfie sosteniendo tu documento de identidad junto a tu rostro',
          <Camera className="h-5 w-5 text-purple-500" />,
          isStep1Complete && isStep2Complete,
          watchedValues.documentPhotos.selfieWithDocument
        )}

        {/* Step 4: Video Verification (Optional) */}
        {renderFileUpload(
          'videoVerification',
          'Paso 4: Video de verificación (opcional)',
          'Graba un video corto presentándote y mostrando tu documento',
          <Video className="h-5 w-5 text-purple-500" />,
          true,
          watchedValues.videoVerification.videoLink
        )}

        {/* Validation Warning */}
        {isStep1Complete && (!isStep2Complete || !isStep3Complete) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-700">
                  <strong>Importante:</strong> Si subes la foto frontal del documento, debes completar también el reverso y la selfie con documento.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            disabled={isSubmitting || Object.values(uploadingFiles).some(Boolean)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Verificación'}
          </Button>
        </div>
      </form>
    </Form>
  );
}