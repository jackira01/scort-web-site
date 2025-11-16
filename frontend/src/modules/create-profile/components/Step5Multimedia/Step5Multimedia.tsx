'use client';

import React, { useEffect } from 'react';
import { Camera, Mic, Video } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageCropModal } from '@/components/ImageCropModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ProcessedImageResult } from '@/utils/imageProcessor';
import { useFormContext } from '../../context/FormContext';
import { useCompanyName } from '@/utils/watermark';

// Imports de módulos locales
import { useContentLimits, useImageProcessing, useFileHandlers } from './hooks';
import type { ImageToCrop, VideoCoverToCrop } from './types';
import { AudioPreviewCard, PhotoPreviewCard, VideoPreviewCard } from './components/ImagePreviewCard';

type Step5MultimediaProps = {};

export function Step5Multimedia({ }: Step5MultimediaProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  // Hook para obtener el nombre de la empresa dinámicamente
  const companyName = useCompanyName();

  // Observar campos del formulario
  const selectedPlan = watch('selectedPlan');
  const photos = watch('photos') || [];
  const videos = watch('videos') || [];
  const audios = watch('audios') || [];
  const coverImageIndex = watch('coverImageIndex');
  const videoCoverImages = watch('videoCoverImages') || {};
  const acceptTerms = watch('acceptTerms');

  // 🎯 USAR HOOKS PERSONALIZADOS
  const { contentLimits } = useContentLimits(selectedPlan);

  // ✅ ORDEN CORRECTO: Primero declarar useImageProcessing
  const {
    isProcessingImage,
    setIsProcessingImage,
    processedImages,
    setProcessedImages,
    originalImages,
    setOriginalImages,
    processNewImages,
    updateTrigger
  } = useImageProcessing(companyName);

  // Estados para modales de recorte
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<ImageToCrop | null>(null);
  const [videoCoverCropModalOpen, setVideoCoverCropModalOpen] = useState(false);
  const [currentVideoCoverToCrop, setCurrentVideoCoverToCrop] = useState<VideoCoverToCrop | null>(null);

  // ✅ NUEVO: Estado para guardar las portadas originales de videos (para permitir re-crop sobre la original)
  const [originalVideoCoverImages, setOriginalVideoCoverImages] = useState<Map<number, File>>(new Map());

  // ✅ NUEVO: Estado para trackear qué imágenes originalmente eran URLs (para NO aplicar marca de agua)
  const [imagesFromUrl, setImagesFromUrl] = useState<Map<number, boolean>>(new Map());

  // ✅ LUEGO los useEffects de sincronización
  // Sincronizar processedImages con el formulario
  useEffect(() => {
    if (processedImages.size > 0) {
      const processedArray = Array.from(processedImages.values());

      setValue('processedImages', processedArray, {
        shouldValidate: false,
        shouldDirty: true
      });
    }
  }, [processedImages, setValue, updateTrigger]);

  // Sincronizar coverImageIndex (sin setValue redundante)
  useEffect(() => {
  }, [coverImageIndex]);

  // ✅ DESPUÉS declarar useFileHandlers
  const { handleFileSelect, handleFileRemove } = useFileHandlers({
    contentLimits,
    selectedPlan,
    photos,
    videos: videos.filter((v): v is File | string => v !== null),
    audios,
    processedImages,
    originalImages,
    videoCoverImages,
    coverImageIndex,
    setValue: setValue as (name: string, value: any, options?: any) => void,
    setOriginalImages,
    processNewImages,
    setProcessedImages
  });

  // Función para manejar el crop completado
  const handleCropComplete = async (croppedBlob: Blob, croppedUrl: string) => {
    if (!currentImageToCrop) return;

    try {
      setIsProcessingImage(true);

      // ✅ Aplicar marca de agua SOLO si la imagen NO es de URL (es File nuevo)
      const shouldApplyWatermark = !currentImageToCrop.isFromUrl;

      // Solo recortar sin aplicar marca de agua
      const processedResult: ProcessedImageResult = await (async () => {
        try {
          const { processImageAfterCrop } = await import('@/utils/imageProcessor');
          return await processImageAfterCrop(
            croppedBlob,
            currentImageToCrop.file.name,
            {
              applyWatermark: shouldApplyWatermark, // ✅ Aplicar marca SOLO si es File nuevo
              watermarkText: shouldApplyWatermark ? companyName : '',
            },
            currentImageToCrop.index
          );
        } catch (e) {
          // Fallback de emergencia
          const fallbackFile = new File([croppedBlob], currentImageToCrop.file.name, {
            type: croppedBlob.type,
            lastModified: Date.now(),
          });
          const url = URL.createObjectURL(fallbackFile);
          return {
            file: fallbackFile,
            url,
            originalSize: currentImageToCrop.file.size,
            compressedSize: fallbackFile.size,
            compressionRatio: ((currentImageToCrop.file.size - fallbackFile.size) / currentImageToCrop.file.size) * 100,
            dimensions: { width: 0, height: 0 },
            originalIndex: currentImageToCrop.index,
            originalFileName: currentImageToCrop.file.name,
          } as ProcessedImageResult;
        }
      })();

      // Revocar la URL anterior si existe para evitar memory leaks
      const previousProcessedImage = processedImages.get(currentImageToCrop.index || 0);
      if (previousProcessedImage && previousProcessedImage.url.startsWith('blob:')) {
        URL.revokeObjectURL(previousProcessedImage.url);
      }

      // Guardar el resultado procesado
      const newProcessedImages = new Map(processedImages);
      newProcessedImages.set(currentImageToCrop.index || 0, processedResult);
      setProcessedImages(newProcessedImages);

      // Actualizar el archivo en el array de fotos con la imagen procesada
      const currentPhotos = [...photos];
      if (currentImageToCrop.index !== undefined && currentImageToCrop.index < currentPhotos.length) {
        currentPhotos[currentImageToCrop.index] = processedResult.file;
        setValue('photos', currentPhotos, {
          shouldValidate: true,
          shouldDirty: true
        });
      }

      // ❌ ELIMINADO: No hacer setValue('processedImages') aquí
      // El useEffect se encargará de sincronizar automáticamente

      toast.success(
        `Imagen procesada: ${Math.round(processedResult.compressionRatio)}% de compresión aplicada`
      );
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      toast.error('Error al procesar la imagen');
      if (croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(croppedUrl);
      }
    } finally {
      setIsProcessingImage(false);
      setCropModalOpen(false);
      setCurrentImageToCrop(null);
    }
  };

  // Función para abrir crop modal para una imagen existente
  const handleEditImage = (file: File | string, index: number) => {

    // ✅ Primero buscar la imagen original guardada
    const originalImage = originalImages.get(index);

    // ✅ Si existe original, usarla y consultar el Map para saber si era URL
    if (originalImage) {
      const wasFromUrl = imagesFromUrl.get(index) ?? false;
      setCurrentImageToCrop({ file: originalImage, index, isFromUrl: wasFromUrl });
      setCropModalOpen(true);
      return;
    }

    // ✅ Si el file es un File, usarlo directamente (aplicar marca de agua)
    if (file instanceof File) {
      setCurrentImageToCrop({ file, index, isFromUrl: false });
      setCropModalOpen(true);
      return;
    }

    // ✅ Si es una URL (string), convertirla a File usando canvas (NO aplicar marca de agua)
    if (typeof file === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // ✅ Importante para evitar problemas de CORS

      img.onload = () => {
        try {
          // Crear canvas para convertir la imagen
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast.error('Error al procesar la imagen');
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Convertir canvas a Blob
          canvas.toBlob((blob) => {
            if (!blob) {
              toast.error('Error al convertir la imagen');
              return;
            }

            const newFile = new File([blob], `photo-${index}.jpg`, { type: 'image/jpeg' });

            // ✅ Guardar como imagen original para futuros re-crops
            const newOriginals = new Map(originalImages);
            newOriginals.set(index, newFile);
            setOriginalImages(newOriginals);

            // ✅ NUEVO: Marcar que esta imagen era originalmente una URL
            const newFromUrlMap = new Map(imagesFromUrl);
            newFromUrlMap.set(index, true);
            setImagesFromUrl(newFromUrlMap);

            setCurrentImageToCrop({ file: newFile, index, isFromUrl: true }); // ✅ Marcar como URL
            setCropModalOpen(true);
          }, 'image/jpeg', 0.95);

        } catch (err) {
          console.error('Error al procesar imagen:', err);
          toast.error('Error al cargar la imagen para editar');
        }
      };

      img.onerror = (err) => {
        console.error('Error cargando imagen desde URL:', err);
        toast.error('No se pudo cargar la imagen. Verifica que la URL sea accesible.');
      };

      img.src = file;
    }
  };

  // Función para seleccionar imagen de portada
  const handleSetCoverImage = (index: number) => {
    const currentPhotos = [...photos];

    const processedImage = processedImages.get(index);

    if (index >= 0 && index < currentPhotos.length) {
      setValue('coverImageIndex', index, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });

      toast.success('Imagen de portada seleccionada');
    } else {
      console.error('❌ Índice fuera de rango:', index, 'Total:', currentPhotos.length);
    }
  };

  // Función para manejar la subida de imagen de portada para video
  const handleVideoCoverImageSelect = async (videoIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validar que sea una imagen
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
      return;
    }

    // ✅ Guardar la imagen original si no existe ya
    if (!originalVideoCoverImages.has(videoIndex)) {
      const newOriginals = new Map(originalVideoCoverImages);
      newOriginals.set(videoIndex, file);
      setOriginalVideoCoverImages(newOriginals);
    }

    // Abrir modal de recorte para la imagen de portada del video
    setCurrentVideoCoverToCrop({ file, videoIndex });
    setVideoCoverCropModalOpen(true);
  };

  // ✅ NUEVA: Función para editar/recortar la portada existente de un video
  const handleEditVideoCover = (videoIndex: number) => {
    // ✅ IGUAL QUE handleEditImage: Primero buscar la imagen original guardada
    const originalCoverImage = originalVideoCoverImages.get(videoIndex);
    const currentCoverImage = videoCoverImages[videoIndex];

    // ✅ Usar la imagen original si existe, de lo contrario usar la actual
    const imageToEdit = originalCoverImage || currentCoverImage;

    if (!imageToEdit) {
      toast.error('No hay portada para editar');
      return;
    }

    // Si es un File, úsalo directamente
    if (imageToEdit instanceof File) {
      setCurrentVideoCoverToCrop({ file: imageToEdit, videoIndex });
      setVideoCoverCropModalOpen(true);
      return;
    }

    // ✅ Si es una string (URL), convertirla a File usando canvas (mejor para CORS)
    if (typeof imageToEdit === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // ✅ Importante para evitar problemas de CORS

      img.onload = () => {
        try {
          // Crear canvas para convertir la imagen
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast.error('Error al procesar la portada');
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Convertir canvas a Blob
          canvas.toBlob((blob) => {
            if (!blob) {
              toast.error('Error al convertir la portada');
              return;
            }

            const file = new File([blob], `video-cover-${videoIndex}.jpg`, { type: 'image/jpeg' });

            // ✅ Guardar como original si no existe
            if (!originalVideoCoverImages.has(videoIndex)) {
              const newOriginals = new Map(originalVideoCoverImages);
              newOriginals.set(videoIndex, file);
              setOriginalVideoCoverImages(newOriginals);
            }

            setCurrentVideoCoverToCrop({ file, videoIndex });
            setVideoCoverCropModalOpen(true);
          }, 'image/jpeg', 0.95);

        } catch (err) {
          console.error('Error al procesar portada:', err);
          toast.error('Error al cargar la portada para editar');
        }
      };

      img.onerror = (err) => {
        console.error('Error cargando portada desde URL:', err);
        toast.error('No se pudo cargar la portada. Verifica que la URL sea accesible.');
      };

      img.src = imageToEdit;
    }
  };

  // Función para manejar el crop completado de la portada de video
  const handleVideoCoverCropComplete = async (croppedBlob: Blob, croppedUrl: string) => {
    if (!currentVideoCoverToCrop) return;

    try {
      setIsProcessingImage(true);
      toast.loading('Procesando imagen de portada...', { id: 'process-video-cover' });

      // Usar processImageAfterCrop con el blob recortado SIN marca de agua
      const { processImageAfterCrop } = await import('@/utils/imageProcessor');
      const processedImage = await processImageAfterCrop(croppedBlob, currentVideoCoverToCrop.file.name, {
        applyWatermark: false, // ❌ NO aplicar marca de agua en portada de video
        watermarkText: '',
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1024,
        initialQuality: 0.9,
        useWebWorker: true
      });

      toast.dismiss('process-video-cover');
      toast.success('Imagen de portada procesada');

      // Actualizar el objeto de imágenes de portada de videos con la imagen procesada
      const updatedVideoCoverImages = {
        ...videoCoverImages,
        [currentVideoCoverToCrop.videoIndex]: processedImage.file
      };

      setValue('videoCoverImages', updatedVideoCoverImages, {
        shouldValidate: true,
        shouldDirty: true
      });

      // Revocar la URL del crop
      if (croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(croppedUrl);
      }
    } catch (error) {
      console.error('Error procesando imagen de portada:', error);
      toast.dismiss('process-video-cover');
      toast.error('Error al procesar la imagen de portada');
      // Revocar la URL en caso de error
      if (croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(croppedUrl);
      }
    } finally {
      setIsProcessingImage(false);
      setVideoCoverCropModalOpen(false);
      setCurrentVideoCoverToCrop(null);
    }
  };

  // Función para renderizar la vista previa de archivos

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          05
        </div>
        <h2 className="text-2xl font-bold text-foreground">Multimedia</h2>
      </div>

      <div className="space-y-6">
        {/* Photos Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <CardTitle className="text-foreground">
                Mis fotos <span className="text-red-500">*</span>
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={photos.length >= contentLimits.maxPhotos ? "destructive" : "outline"}
                  className={photos.length >= contentLimits.maxPhotos ? "animate-pulse" : ""}
                >
                  {photos.length} / {contentLimits.maxPhotos}
                </Badge>
                {selectedPlan && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPlan.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {photos.length >= contentLimits.maxPhotos && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">💎</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-purple-800 dark:text-purple-200 text-sm font-medium mb-2">
                        <strong>¡Has superado el límite!</strong>
                      </p>
                      <p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
                        Has alcanzado el máximo de {contentLimits.maxPhotos} fotos para {selectedPlan?.name || 'tu plan actual'}.
                        Si deseas subir más fotos, mejora tu plan ahora y desbloquea todo el potencial de tu perfil.
                      </p>
                      {selectedPlan?.code === 'FREE' && (
                        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-purple-200/50">
                          <p className="text-purple-800 dark:text-purple-200 text-sm font-medium mb-2">
                            ✨ Con un plan Premium obtienes:
                          </p>
                          <ul className="text-purple-700 dark:text-purple-300 text-xs space-y-1">
                            <li>• Hasta 50+ fotos de alta calidad</li>
                            <li>• Mayor visibilidad en búsquedas</li>
                            <li>• Funciones exclusivas premium</li>
                            <li>• Soporte prioritario</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    <strong>Selección de portada:</strong> Haz clic en el ícono de estrella
                    para seleccionar qué imagen aparecerá como portada en tu perfil.
                    Si no seleccionas ninguna, la primera imagen será la portada por defecto.
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    <strong>Procesamiento automático:</strong> Tus imágenes serán
                    optimizadas, redimensionadas y protegidas con marca de agua
                    automáticamente durante la subida.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg text-center transition-colors duration-200 ${photos.length >= contentLimits.maxPhotos
                  ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60'
                  : 'hover:border-purple-500 cursor-pointer'
                  } ${errors.photos
                    ? 'border-red-500'
                    : 'border-muted-foreground/30'
                  }`}
              >
                {/* Input invisible que cubre todo el div */}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect('photos', e.target.files, e)}
                  id="photos-upload"
                  disabled={photos.length >= contentLimits.maxPhotos}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Contenido visible con padding */}
                <div className="p-8 flex flex-col items-center justify-center pointer-events-none">
                  <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {photos.length >= contentLimits.maxPhotos ? 'Límite alcanzado' : 'Añadir fotos'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    📏 Recomendado: mínimo 500×600px para mejor calidad
                  </p>
                </div>
              </div>


              {/* Vista previa de fotos */}
              {photos && photos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">
                    Fotos seleccionadas:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1 max-h-[32rem] overflow-y-auto auto-rows-max">
                    {photos.map((file, index) => {
                      if (!file) return null;

                      // ✅ SOLUCIÓN: Key estable basada en el contenido del archivo, no el índice
                      const fileKey = file instanceof File
                        ? `${file.name}-${file.size}-${file.lastModified}`
                        : file;

                      return (
                        <PhotoPreviewCard
                          key={fileKey} // ✅ Ahora la key es única y estable
                          file={file}
                          index={index}
                          processedImage={processedImages.get(index)}
                          isProcessingImage={isProcessingImage}
                          coverImageIndex={coverImageIndex}
                          onRemove={handleFileRemove}
                          onEdit={handleEditImage}
                          onSetCover={handleSetCoverImage}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensaje de error prominente si no hay fotos */}
              {errors.photos && (
                <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Fotos requeridas
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {errors.photos.message || 'Debes subir al menos una foto para crear tu perfil'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje informativo si no hay fotos pero no hay error aún */}
              {photos.length === 0 && !errors.photos && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        ¡Agrega tus fotos!
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Necesitas al menos 1 foto para crear tu perfil. Las fotos son la forma principal en que los usuarios verán tu perfil.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Videos Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <CardTitle className="text-foreground">Mis videos</CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={videos.length >= contentLimits.maxVideos ? "destructive" : "outline"}
                  className={videos.length >= contentLimits.maxVideos ? "animate-pulse" : ""}
                >
                  {videos.length} / {contentLimits.maxVideos}
                </Badge>
                {selectedPlan && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPlan.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {videos.length >= contentLimits.maxVideos && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      <strong>Límite alcanzado:</strong> Has alcanzado el máximo de {contentLimits.maxVideos} videos
                      para {selectedPlan?.name || 'tu plan actual'}.
                      {selectedPlan?.code === 'FREE' && (
                        <span className="block mt-1">
                          💎 Considera actualizar a un plan Premium para subir más videos.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">ℹ</span>
                  </div>
                  <div className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                    <p>
                      <strong>Imagen de portada:</strong> Puedes subir una imagen personalizada
                      que aparecerá como portada del video haciendo clic en el ícono de subida.
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg text-center transition-colors duration-200 ${videos.length >= contentLimits.maxVideos
                  ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60'
                  : 'hover:border-purple-500 cursor-pointer'
                  } ${errors.videos
                    ? 'border-red-500'
                    : 'border-muted-foreground/30'
                  }`}
              >
                {/* input invisible que cubre TODO el div */}
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileSelect('videos', e.target.files, e)}
                  id="videos-upload"
                  disabled={videos.length >= contentLimits.maxVideos}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* contenido visible, con padding */}
                <div className="p-8 flex flex-col items-center justify-center pointer-events-none">
                  <Video className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {videos.length >= contentLimits.maxVideos ? 'Límite alcanzado' : 'Añadir videos'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, AVI, MOV hasta 10MB cada uno
                  </p>
                </div>
              </div>


              {/* Vista previa de videos */}
              {videos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Videos seleccionados:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1 max-h-[32rem] overflow-y-auto auto-rows-max">
                    {videos
                      .filter((file: any) => file !== null)
                      .map((file: any, index: number) => {
                        // ✅ Key estable y única que incluye el índice para evitar colisiones
                        let fileKey: string;

                        if (file instanceof File) {
                          fileKey = `video-file-${index}-${file.name}-${file.size}-${file.lastModified}`;
                        } else if (typeof file === 'object' && file !== null && 'link' in file) {
                          // Es un objeto {link, preview}
                          fileKey = `video-obj-${index}-${file.link}`;
                        } else if (typeof file === 'string') {
                          // Es una URL string
                          fileKey = `video-url-${index}-${file}`;
                        } else {
                          // Fallback (no debería llegar aquí)
                          fileKey = `video-unknown-${index}`;
                        }

                        return (
                          <VideoPreviewCard
                            key={fileKey}
                            file={file}
                            index={index}
                            videoCoverImages={videoCoverImages}
                            onRemove={handleFileRemove}
                            onEdit={handleEditImage}
                            onVideoCoverSelect={handleVideoCoverImageSelect}
                            onEditVideoCover={handleEditVideoCover}
                          />
                        );
                      })}
                  </div>
                </div>
              )}

              {errors.videos && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.videos.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audio Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <CardTitle className="text-foreground">
                Mis archivos de audio
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={audios.length >= contentLimits.maxAudios ? "destructive" : "outline"}
                  className={audios.length >= contentLimits.maxAudios ? "animate-pulse" : ""}
                >
                  {audios.length} / {contentLimits.maxAudios}
                </Badge>
                {selectedPlan && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPlan.name}
                  </Badge>
                )}
              </div>
            </div>

            {audios.length >= contentLimits.maxAudios && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    <strong>Límite alcanzado:</strong> Has alcanzado el máximo de {contentLimits.maxAudios} audios
                    para {selectedPlan?.name || 'tu plan actual'}.
                    {selectedPlan?.code === 'FREE' && (
                      <span className="block mt-1">
                        💎 Considera actualizar a un plan Premium para subir más audios.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg text-center transition-colors duration-200 ${audios.length >= contentLimits.maxAudios
                  ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60'
                  : 'hover:border-purple-500 cursor-pointer'
                  } ${errors.audios
                    ? 'border-red-500'
                    : 'border-muted-foreground/30'
                  }`}
              >
                {/* Input invisible que cubre todo el div */}
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleFileSelect('audios', e.target.files, e)}
                  id="audios-upload"
                  disabled={audios.length >= contentLimits.maxAudios}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Contenido visible con padding */}
                <div className="p-8 flex flex-col items-center justify-center pointer-events-none">
                  <Mic className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {audios.length >= contentLimits.maxAudios ? 'Límite alcanzado' : 'Añadir audios'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, OGG hasta 10MB cada uno
                  </p>
                </div>
              </div>


              {/* Vista previa de audios */}
              {audios.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Audios seleccionados:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1 max-h-[32rem] overflow-y-auto auto-rows-max">
                    {audios.map((file, index) => {
                      // ✅ Key estable basada en contenido
                      const fileKey = file instanceof File
                        ? `audio-${file.name}-${file.size}-${file.lastModified}`
                        : `audio-url-${file}`;

                      return (
                        <AudioPreviewCard
                          key={fileKey}
                          file={file}
                          index={index}
                          onRemove={handleFileRemove}

                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {errors.audios && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.audios.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Términos & Condiciones <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setValue('acceptTerms', !!checked)}
                className={errors.acceptTerms ? 'border-red-500' : ''}
              />
              <Label
                htmlFor="terms"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Yo acepto los{' '}
                <Link
                  href="/terminos"
                  className="text-blue-600 hover:underline"
                >
                  términos y condiciones
                </Link>{' '}

              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-500 text-sm mt-1">
                {errors.acceptTerms.message}
              </p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modal de recorte de imagen para fotos */}
      {currentImageToCrop && (
        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setCurrentImageToCrop(null);
          }}
          imageSrc={URL.createObjectURL(currentImageToCrop.file)}
          onCropComplete={handleCropComplete}
          fileName={currentImageToCrop.file.name}
          aspectRatio={3 / 4}
        />
      )}

      {/* Modal de recorte de imagen para portadas de video */}
      {currentVideoCoverToCrop && (
        <ImageCropModal
          isOpen={videoCoverCropModalOpen}
          onClose={() => {
            setVideoCoverCropModalOpen(false);
            setCurrentVideoCoverToCrop(null);
          }}
          imageSrc={URL.createObjectURL(currentVideoCoverToCrop.file)}
          onCropComplete={handleVideoCoverCropComplete}
          fileName={currentVideoCoverToCrop.file.name}
          aspectRatio={16 / 9}  // Aspect ratio 16:9 para portadas de video (horizontal)
        />
      )}
    </div>
  );
}
