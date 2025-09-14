'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { uploadMultipleImages, uploadMultipleVideos } from '@/utils/tools';
import axios from '@/lib/axios';

const verificationSchema = z.object({
  documentPhotos: z.object({
    documents: z.array(z.string()).max(2, 'Máximo 2 documentos permitidos').optional(),
  }),
  video: z.object({
    videoLink: z.string().optional(),
  }),
  socialMedia: z.object({
    accounts: z.array(z.string()).optional(),
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
  const queryClient = useQueryClient();

  // Estados para archivos temporales
  const [tempDocuments, setTempDocuments] = useState<File[]>([]);
  const [tempVideo, setTempVideo] = useState<File | null>(null);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentPhotos: {
        documents: initialData.documentPhotos?.documents || [],
      },
      video: {
        videoLink: initialData.video?.videoLink || '',
      },
      socialMedia: {
        accounts: initialData.socialMedia?.accounts || [],
      },
    },
  });

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

  const handleFileUpload = async (files: File[], type: string) => {
    setUploadingFiles(prev => ({ ...prev, [type]: true }));

    try {
      let uploadedUrls: string[] = [];

      if (type === 'video' || type === 'videoCall') {
        uploadedUrls = (await uploadMultipleVideos(files)).filter((url): url is string => url !== null);
      } else {
        uploadedUrls = (await uploadMultipleImages(files)).filter((url): url is string => url !== null);
      }

      return uploadedUrls;
    } catch (error) {
      toast.error('Error al subir archivos');
      return [];
    } finally {
      setUploadingFiles(prev => ({ ...prev, [type]: false }));
    }
  };

  const onSubmit = async (data: VerificationFormData) => {
    setIsSubmitting(true);

    try {
      const formData = { ...data };

      // Subir documentos (máximo 2)
      if (tempDocuments.length > 0) {
        if (tempDocuments.length > 2) {
          toast.error('Máximo 2 documentos permitidos');
          setIsSubmitting(false);
          return;
        }
        const uploadedDocs = await handleFileUpload(tempDocuments, 'documents');
        formData.documentPhotos.documents = uploadedDocs;
      }

      // Subir video
      if (tempVideo) {
        const uploadedVideo = await handleFileUpload([tempVideo], 'video');
        if (uploadedVideo.length > 0) {
          formData.video.videoLink = uploadedVideo[0];
        }
      }

      await updateVerificationMutation.mutateAsync(formData);
    } catch (error) {
      toast.error('Error al procesar el formulario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSocialMediaAccount = () => {
    const currentAccounts = form.getValues('socialMedia.accounts') || [];
    form.setValue('socialMedia.accounts', [...currentAccounts, '']);
  };

  const removeSocialMediaAccount = (index: number) => {
    const currentAccounts = form.getValues('socialMedia.accounts') || [];
    const newAccounts = currentAccounts.filter((_, i) => i !== index);
    form.setValue('socialMedia.accounts', newAccounts);
  };

  const updateSocialMediaAccount = (index: number, value: string) => {
    const currentAccounts = form.getValues('socialMedia.accounts') || [];
    const newAccounts = [...currentAccounts];
    newAccounts[index] = value;
    form.setValue('socialMedia.accounts', newAccounts);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Actualizar Información de Verificación</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Fotos de Documentos</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                📄 Sube el documento por ambas caras (sea pasaporte, DNI o cédula de ciudadanía). Máximo 2 imágenes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="documents" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subir nuevos documentos</label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 2) {
                        toast.error('Máximo 2 documentos permitidos');
                        e.target.value = '';
                        return;
                      }
                      setTempDocuments(files);
                    }}
                    disabled={uploadingFiles.documents}
                  />
                  {tempDocuments.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {tempDocuments.length} archivo(s) seleccionado(s)
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="currentDocuments" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Documentos actuales</label>
                  {form.watch('documentPhotos.documents') && form.watch('documentPhotos.documents')!.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {form.watch('documentPhotos.documents')!.map((docUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={docUrl}
                            alt={`Documento ${index + 1}`}
                            className="w-full h-24 object-cover rounded border cursor-pointer"
                            onClick={() => window.open(docUrl, '_blank')}
                          />
                          <button
                            type="button"
                            onClick={() => window.open(docUrl, '_blank')}
                            className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                          >
                            Ver
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Sin documentos</p>
                  )}
                </div>
              </div>
            </div>



            {/* Video */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Video de Verificación</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                🎥 Se necesita un video con letrero que incluya el nombre del perfil y el texto solicitado por PREPAGOSVIP.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="video" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subir nuevo video</label>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTempVideo(file);
                    }}
                    disabled={uploadingFiles.video}
                  />
                  {tempVideo && (
                    <p className="text-sm text-gray-600 mt-1">
                      Archivo seleccionado: {tempVideo.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="currentVideo" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Video actual</label>
                  {form.watch('video.videoLink') ? (
                    <div className="relative">
                      <video
                        src={form.watch('video.videoLink')!}
                        controls
                        className="w-full h-32 rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => window.open(form.watch('video.videoLink')!, '_blank')}
                        className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                      >
                        Ver
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Sin video</p>
                  )}
                </div>
              </div>
            </div>


            {/* Redes Sociales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Redes Sociales</h3>
                <Button type="button" onClick={addSocialMediaAccount} variant="outline" size="sm">
                  Agregar Cuenta
                </Button>
              </div>
              <div className="space-y-2">
                {(form.watch('socialMedia.accounts') || []).map((account, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="URL de la red social"
                      value={account}
                      onChange={(e) => updateSocialMediaAccount(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => removeSocialMediaAccount(index)}
                      variant="outline"
                      size="sm"
                    >
                      <span className="h-4 w-4">×</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || Object.values(uploadingFiles).some(Boolean)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"

              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}