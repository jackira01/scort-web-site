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

const verificationSchema = z.object({
  documentPhotos: z.object({
    documents: z.array(z.string()).optional(),
  }),
  selfieWithPoster: z.object({
    photo: z.string().optional(),
  }),
  selfieWithDoc: z.object({
    photo: z.string().optional(),
  }),
  fullBodyPhotos: z.object({
    photos: z.array(z.string()).optional(),
  }),
  video: z.object({
    videoLink: z.string().optional(),
  }),
  videoCallRequested: z.object({
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
  const [tempSelfieWithPoster, setTempSelfieWithPoster] = useState<File | null>(null);
  const [tempSelfieWithDoc, setTempSelfieWithDoc] = useState<File | null>(null);
  const [tempFullBodyPhotos, setTempFullBodyPhotos] = useState<File[]>([]);
  const [tempVideo, setTempVideo] = useState<File | null>(null);
  const [tempVideoCall, setTempVideoCall] = useState<File | null>(null);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentPhotos: {
        documents: initialData.documentPhotos?.documents || [],
      },
      selfieWithPoster: {
        photo: initialData.selfieWithPoster?.photo || '',
      },
      selfieWithDoc: {
        photo: initialData.selfieWithDoc?.photo || '',
      },
      fullBodyPhotos: {
        photos: initialData.fullBodyPhotos?.photos || [],
      },
      video: {
        videoLink: initialData.video?.videoLink || '',
      },
      videoCallRequested: {
        videoLink: initialData.videoCallRequested?.videoLink || '',
      },
      socialMedia: {
        accounts: initialData.socialMedia?.accounts || [],
      },
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile-verification/${verificationId}/steps`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la verificación');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Verificación actualizada exitosamente');
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

      // Subir documentos
      if (tempDocuments.length > 0) {
        const uploadedDocs = await handleFileUpload(tempDocuments, 'documents');
        formData.documentPhotos.documents = [...(formData.documentPhotos.documents || []), ...uploadedDocs];
      }

      // Subir selfie con póster
      if (tempSelfieWithPoster) {
        const uploadedSelfie = await handleFileUpload([tempSelfieWithPoster], 'selfieWithPoster');
        if (uploadedSelfie.length > 0) {
          formData.selfieWithPoster.photo = uploadedSelfie[0];
        }
      }

      // Subir selfie con documento
      if (tempSelfieWithDoc) {
        const uploadedSelfie = await handleFileUpload([tempSelfieWithDoc], 'selfieWithDoc');
        if (uploadedSelfie.length > 0) {
          formData.selfieWithDoc.photo = uploadedSelfie[0];
        }
      }

      // Subir fotos de cuerpo completo
      if (tempFullBodyPhotos.length > 0) {
        const uploadedPhotos = await handleFileUpload(tempFullBodyPhotos, 'fullBodyPhotos');
        formData.fullBodyPhotos.photos = [...(formData.fullBodyPhotos.photos || []), ...uploadedPhotos];
      }

      // Subir video
      if (tempVideo) {
        const uploadedVideo = await handleFileUpload([tempVideo], 'video');
        if (uploadedVideo.length > 0) {
          formData.video.videoLink = uploadedVideo[0];
        }
      }

      // Subir video de videollamada
      if (tempVideoCall) {
        const uploadedVideo = await handleFileUpload([tempVideoCall], 'videoCall');
        if (uploadedVideo.length > 0) {
          formData.videoCallRequested.videoLink = uploadedVideo[0];
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

            {/* Selfie con Póster */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Selfie con Póster</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="selfieWithPoster" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subir nueva foto</label>
                  <Input
                    id="selfieWithPoster"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTempSelfieWithPoster(file);
                    }}
                    disabled={uploadingFiles.selfieWithPoster}
                  />
                  {tempSelfieWithPoster && (
                    <p className="text-sm text-gray-600 mt-1">
                      Archivo seleccionado: {tempSelfieWithPoster.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="currentSelfieWithPoster" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Foto actual</label>
                  {form.watch('selfieWithPoster.photo') ? (
                    <div className="relative inline-block">
                      <img 
                        src={form.watch('selfieWithPoster.photo')!} 
                        alt="Selfie con poster" 
                        className="w-full h-32 object-cover rounded border cursor-pointer"
                        onClick={() => window.open(form.watch('selfieWithPoster.photo')!, '_blank')}
                      />
                      <button 
                        type="button"
                        onClick={() => window.open(form.watch('selfieWithPoster.photo')!, '_blank')}
                        className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                      >
                        Ver
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sin foto</p>
                  )}
                </div>
              </div>
            </div>

            {/* Selfie con Documento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Selfie con Documento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="selfieWithDoc" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subir nueva foto</label>
                  <Input
                    id="selfieWithDoc"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTempSelfieWithDoc(file);
                    }}
                    disabled={uploadingFiles.selfieWithDoc}
                  />
                  {tempSelfieWithDoc && (
                    <p className="text-sm text-gray-600 mt-1">
                      Archivo seleccionado: {tempSelfieWithDoc.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="currentSelfieWithDoc" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Foto actual</label>
                  {form.watch('selfieWithDoc.photo') ? (
                    <div className="relative inline-block">
                      <img 
                        src={form.watch('selfieWithDoc.photo')!} 
                        alt="Selfie con documento" 
                        className="w-full h-32 object-cover rounded border cursor-pointer"
                        onClick={() => window.open(form.watch('selfieWithDoc.photo')!, '_blank')}
                      />
                      <button 
                        type="button"
                        onClick={() => window.open(form.watch('selfieWithDoc.photo')!, '_blank')}
                        className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                      >
                        Ver
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sin foto</p>
                  )}
                </div>
              </div>
            </div>

            {/* Fotos de Cuerpo Completo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Fotos de Cuerpo Completo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullBodyPhotos" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subir nuevas fotos</label>
                  <Input
                    id="fullBodyPhotos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setTempFullBodyPhotos(files);
                    }}
                    disabled={uploadingFiles.fullBodyPhotos}
                  />
                  {tempFullBodyPhotos.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {tempFullBodyPhotos.length} archivo(s) seleccionado(s)
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="currentFullBodyPhotos" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Fotos actuales</label>
                  {form.watch('fullBodyPhotos.photos') && form.watch('fullBodyPhotos.photos')!.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {form.watch('fullBodyPhotos.photos')!.map((photoUrl, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={photoUrl} 
                            alt={`Foto cuerpo completo ${index + 1}`} 
                            className="w-full h-32 object-cover rounded border cursor-pointer"
                            onClick={() => window.open(photoUrl, '_blank')}
                          />
                          <button 
                            type="button"
                            onClick={() => window.open(photoUrl, '_blank')}
                            className="absolute top-1 right-1 bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                          >
                            Ver
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Sin fotos</p>
                  )}
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Video de Verificación</h3>
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

            {/* Video de Videollamada */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Video de Videollamada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="videoCall" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subir nuevo video</label>
                  <Input
                    id="videoCall"
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTempVideoCall(file);
                    }}
                    disabled={uploadingFiles.videoCall}
                  />
                  {tempVideoCall && (
                    <p className="text-sm text-gray-600 mt-1">
                      Archivo seleccionado: {tempVideoCall.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="currentVideoCall" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Video actual</label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                      {form.watch('videoCallRequested.videoLink') ? 'Video guardado' : 'Sin video'}
                    </p>
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