'use client';

import { Camera, Mic, Video, X, Edit3, CheckCircle, Star, Upload } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageCropModal } from '@/components/ImageCropModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ProcessedImageResult, processImageComplete } from '@/utils/imageProcessor';
import { useFormContext } from '../context/FormContext';
import { usePlans } from '@/hooks/usePlans';
import { useConfigValue } from '@/hooks/use-config-parameters';
import { useCompanyName } from '@/utils/watermark';

interface DefaultPlanConfig {
  enabled: boolean;
  planId: string | null;
  planCode: string | null;
}

type Step5MultimediaProps = {};

export function Step5Multimedia({ }: Step5MultimediaProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  // Hook para obtener el nombre de la empresa dinámicamente
  const companyName = useCompanyName();

  // Optimización: observar solo los campos específicos necesarios
  const selectedPlan = watch('selectedPlan');
  const photos = watch('photos') || [];
  const videos = watch('videos') || [];
  const audios = watch('audios') || [];
  const coverImageIndex = watch('coverImageIndex');
  const videoCoverImages = watch('videoCoverImages') || {};
  const acceptTerms = watch('acceptTerms');

  // Estados para el procesamiento de imágenes
  const [contentLimits, setContentLimits] = useState({
    maxPhotos: 20, // valores por defecto
    maxVideos: 8,
    maxAudios: 6
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Estado para almacenar imágenes procesadas
  const [processedImages, setProcessedImages] = useState<Map<number, ProcessedImageResult>>(new Map());

  // Estados para el modal de crop
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<{
    file: File;
    index: number;
  } | null>(null);

  // Cleanup effect para revocar URLs cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Limpiar todas las URLs de blob al desmontar el componente
      processedImages.forEach((processedImage) => {
        if (processedImage.url.startsWith('blob:')) {
          URL.revokeObjectURL(processedImage.url);
        }
      });
    };
  }, [processedImages]);

  // Obtener planes disponibles
  const { data: plansResponse } = usePlans({
    limit: 50,
    page: 1,
    isActive: true
  });

  // Memoizar plans para evitar re-renders innecesarios
  const plans = useMemo(() => {
    return plansResponse?.plans || [];
  }, [plansResponse?.plans]);

  // Obtener configuración del plan por defecto
  const { value: defaultConfigRaw } = useConfigValue<DefaultPlanConfig>(
    'system.default_plan',
    {
      enabled: true,
      defaultValue: { enabled: false, planId: null, planCode: null }
    }
  );

  // Memoizar defaultConfig para evitar re-renders innecesarios
  const defaultConfig = useMemo(() => {
    return defaultConfigRaw;
  }, [defaultConfigRaw?.enabled, defaultConfigRaw?.planId, defaultConfigRaw?.planCode]);

  // Cargar límites del plan por defecto o seleccionado
  useEffect(() => {
    if (selectedPlan && selectedPlan.contentLimits) {
      // Usar límites del plan seleccionado
      setContentLimits({
        maxPhotos: selectedPlan.contentLimits.photos?.max || 20,
        maxVideos: selectedPlan.contentLimits.videos?.max || 8,
        maxAudios: selectedPlan.contentLimits.audios?.max || 6
      });
    } else if (defaultConfig?.enabled && defaultConfig.planId && plans.length > 0) {
      // Usar límites del plan por defecto si no hay plan seleccionado
      const defaultPlan = plans.find(plan => plan._id === defaultConfig.planId);

      if (defaultPlan && defaultPlan.contentLimits) {
        setContentLimits({
          maxPhotos: defaultPlan.contentLimits.photos?.max || 20,
          maxVideos: defaultPlan.contentLimits.videos?.max || 8,
          maxAudios: defaultPlan.contentLimits.audios?.max || 6
        });
      }
    } else {
      // Usar límites básicos por defecto
      setContentLimits({
        maxPhotos: 5, // Plan básico
        maxVideos: 2,
        maxAudios: 2
      });
    }
  }, [defaultConfig, plans, selectedPlan?._id, selectedPlan?.contentLimits]);

  // Usar los valores del formulario como fuente de verdad (ya optimizados arriba)
  // const photos = formData.photos || [];
  // const videos = formData.videos || [];
  // const audios = formData.audios || [];
  // const coverImageIndex = formData.coverImageIndex;
  // const videoCoverImages = formData.videoCoverImages || {};

  // Función para manejar la selección de archivos
  const handleFileSelect = async (
    type: 'photos' | 'videos' | 'audios',
    files: FileList | null,
  ) => {
    if (!files) return;

    let fileArray = Array.from(files);
    const currentFiles: (File | string)[] =
      type === 'photos' ? photos : type === 'videos' ? videos.filter(v => v !== null) : audios;

    // Validar límites dinámicos
    const limits = {
      photos: contentLimits.maxPhotos,
      videos: contentLimits.maxVideos,
      audios: contentLimits.maxAudios,
    };

    if (currentFiles.length + fileArray.length > limits[type]) {
      const planName = selectedPlan?.name || 'tu plan actual';
      const typeLabel = type === 'photos' ? 'fotos' : type === 'videos' ? 'videos' : 'audios';

      toast(
        `Límite alcanzado: ${planName} permite máximo ${limits[type]} ${typeLabel}. Actualmente tienes ${currentFiles.length}.`,
        { duration: 5000 }
      );
      return;
    }

    // Validar tipos de archivo
    const validTypes = {
      photos: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
      audios: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/m4a',
        'audio/x-m4a',
      ],
    };

    const invalidFiles = fileArray.filter((file) => !validTypes[type].includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error(`Tipo de archivo no válido para ${type}. Solo se permiten: ${validTypes[type].join(', ')}`);
      return;
    }

    // Para imágenes, no hay restricciones de tamaño inicial - se procesarán después
    // Para videos y audios, mantener límite de 10MB
    if (type !== 'photos') {
      const maxSize = 10 * 1024 * 1024; // 10MB para videos y audios
      const oversizedFiles = fileArray.filter(
        (file) => file.size > maxSize,
      );
      if (oversizedFiles.length > 0) {
        toast(`Archivo muy grande. Máximo 10MB por archivo de ${type}`);
        return;
      }
    }

    // Para imágenes, procesar automáticamente todas las nuevas imágenes
    if (type === 'photos') {
      // Agregar archivos directamente
      const newFiles: (File | string)[] = [...currentFiles, ...fileArray];
      setValue(type, newFiles);

      // Procesar automáticamente todas las nuevas imágenes
      const processedCount = await processNewImages(fileArray, currentFiles.length);

      // Mostrar toast con el número real de imágenes procesadas
      if (processedCount > 0) {
        toast.success(`${processedCount} imagen(es) agregada(s) y procesada(s) exitosamente.`);
      } else if (fileArray.length > 0) {
        toast('No se pudieron procesar las imágenes seleccionadas.');
      }
    } else {
      // Para videos y audios, agregar directamente
      const newFiles: (File | string)[] = [...currentFiles, ...fileArray];
      setValue(type, newFiles);
      toast.success(`${fileArray.length} archivo(s) agregado(s) a ${type}`);
    }
  };

  // Función para eliminar archivos
  const handleFileRemove = (
    type: 'photos' | 'videos' | 'audios',
    index: number,
  ) => {
    const currentFiles: (File | string)[] =
      type === 'photos' ? photos : type === 'videos' ? videos.filter(v => v !== null) : audios;
    const newFiles = currentFiles.filter((_, i) => i !== index);

    // Liberar URL de objeto si es un archivo File
    const fileToRemove = currentFiles[index];
    if (fileToRemove instanceof File) {
      URL.revokeObjectURL(URL.createObjectURL(fileToRemove));
    }

    setValue(type, newFiles);
    toast.success('Archivo eliminado');

    // Para fotos, también eliminar de processedImages y actualizar el formulario
    if (type === 'photos') {
      const newProcessedImages = new Map(processedImages);

      // Revocar la URL del blob antes de eliminar para evitar memory leaks
      const processedImage = newProcessedImages.get(index);
      if (processedImage && processedImage.url.startsWith('blob:')) {
        URL.revokeObjectURL(processedImage.url);
      }

      newProcessedImages.delete(index);

      // Reindexar las imágenes procesadas restantes
      const reindexedProcessedImages = new Map<number, ProcessedImageResult>();
      Array.from(newProcessedImages.entries()).forEach(([key, value]) => {
        const newIndex = key > index ? key - 1 : key;
        reindexedProcessedImages.set(newIndex, value);
      });

      setProcessedImages(reindexedProcessedImages);

      // Actualizar las imágenes procesadas en el formulario
      const processedImagesArray = Array.from(reindexedProcessedImages.values());
      setValue('processedImages', processedImagesArray);

      // Actualizar coverImageIndex si es necesario
      const currentCoverIndex = coverImageIndex;
      if (currentCoverIndex !== undefined) {
        if (currentCoverIndex === index) {
          // Si se eliminó la imagen de portada, establecer la primera imagen como nueva portada
          setValue('coverImageIndex', 0);
        } else if (currentCoverIndex > index) {
          // Si se eliminó una imagen antes de la portada, ajustar el índice
          setValue('coverImageIndex', currentCoverIndex - 1);
        }
      }
    }
  };

  // Función para procesar automáticamente múltiples imágenes nuevas
  // Función para procesar automáticamente múltiples imágenes nuevas
  const processNewImages = async (newFiles: File[], startIndex: number) => {
    let processedCount = 0;
    const newProcessedImages = new Map(processedImages); // Clonar el Map existente

    try {
      setIsProcessingImage(true);

      // Procesar todas las imágenes de forma secuencial
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const imageIndex = startIndex + i;

        try {
          // Crear un blob desde el archivo original (sin crop)
          const originalBlob = new Blob([file], { type: file.type });

          // Procesar la imagen usando el flujo completo
          const processedResult = await processImageComplete(
            file,
            originalBlob,
            {
              maxWidthOrHeight: 1200,
              initialQuality: 0.8,
              applyWatermark: true,
              watermarkText: companyName
            },
            imageIndex
          );

          // Guardar el resultado procesado en el Map clonado
          newProcessedImages.set(imageIndex, processedResult);
          processedCount++;

        } catch (error) {
          console.error(`❌ Error procesando imagen ${i + 1}:`, error);
          toast.error(`Error procesando imagen ${file.name}`);
        }
      }

      // Actualizar el estado con todas las imágenes procesadas de una sola vez
      setProcessedImages(newProcessedImages);

      // Actualizar las imágenes procesadas en el formulario
      const processedImagesArray = Array.from(newProcessedImages.values());
      setValue('processedImages', processedImagesArray);

    } catch (error) {
      console.error('❌ Error en processNewImages:', error);
      toast.error('Error procesando las imágenes');
    } finally {
      setIsProcessingImage(false);
    }

    return processedCount;
  };

  // Función para manejar el crop completado
  const handleCropComplete = async (croppedBlob: Blob, croppedUrl: string) => {
    if (!currentImageToCrop) return;

    try {
      setIsProcessingImage(true);

      // Asegurar marca de agua después del recorte, incluso en fallbacks
      const processedResult: ProcessedImageResult = await (async () => {
        try {
          const { processImageAfterCrop } = await import('@/utils/imageProcessor');
          return await processImageAfterCrop(
            croppedBlob,
            currentImageToCrop.file.name,
            {
              applyWatermark: true,
              watermarkText: companyName,
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
        setValue('photos', currentPhotos);
      }

      // Guardar las imágenes procesadas en el formulario
      const processedImagesArray = Array.from(newProcessedImages.values());
      setValue('processedImages', processedImagesArray);

      toast.success(
        `Imagen procesada: ${Math.round(processedResult.compressionRatio)}% de compresión aplicada`
      );
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      toast.error('Error al procesar la imagen');
      // Revocar la URL en caso de error
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
    if (file instanceof File) {
      setCurrentImageToCrop({ file, index });
      setCropModalOpen(true);
    }
  };

  // Función para seleccionar imagen de portada
  const handleSetCoverImage = (index: number) => {
    const currentPhotos = [...photos];

    if (index >= 0 && index < currentPhotos.length) {
      // No reordenar el array para evitar inconsistencias con previews procesadas
      // Solo establecer el índice de portada
      setValue('coverImageIndex', index);
      toast.success('Imagen de portada seleccionada');
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

    // Procesar imagen con marca de agua usando el flujo correcto
    try {
      setIsProcessingImage(true);
      toast.loading('Procesando imagen de portada...', { id: 'process-video-cover' });

      // Usar processImageAfterCrop directamente con el archivo como blob
      const { processImageAfterCrop } = await import('@/utils/imageProcessor');
      const processedImage = await processImageAfterCrop(file, file.name, {
        applyWatermark: true,
        watermarkText: companyName,
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1024,
        initialQuality: 0.9,
        useWebWorker: true
      });

      toast.dismiss('process-video-cover');
      toast.success('Imagen de portada procesada con marca de agua');

      // Actualizar el objeto de imágenes de portada de videos con la imagen procesada
      const updatedVideoCoverImages = {
        ...videoCoverImages,
        [videoIndex]: processedImage.file
      };

      setValue('videoCoverImages', updatedVideoCoverImages);
    } catch (error) {
      console.error('Error procesando imagen de portada:', error);
      toast.dismiss('process-video-cover');
      toast.error('Error al procesar la imagen de portada');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Función para renderizar las cards de imágenes con diseño mejorado
  const renderImageCard = (
    file: File | string,
    type: 'photos' | 'videos' | 'audios',
    index: number,
  ) => {
    const isImage = type === 'photos';
    const isVideo = type === 'videos';
    const isAudio = type === 'audios';

    // Validar que el file sea un objeto File válido
    const isValidFile = file instanceof File && file.size > 0;
    const isStringUrl = typeof file === 'string';
    const previewUrl = isValidFile ? URL.createObjectURL(file) : isStringUrl ? file : null;
    const fileName = isValidFile ? file.name : isStringUrl ? file.split('/').pop() || 'Archivo' : 'Archivo';
    const fileSize = isValidFile ? file.size : 0;

    // Verificar si existe una imagen procesada (recortada) para este índice
    const processedImage = isImage ? processedImages.get(index) : null;
    const displayUrl = processedImage ? processedImage.url : previewUrl;
    const isPreviewImage = coverImageIndex === index || (coverImageIndex === undefined && index === 0);

    return (
      <div
        key={index}
        className={`relative group border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${isImage && isPreviewImage
          ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg'
          : 'bg-card border-border hover:border-primary/50'
          }`}
      >
        {/* Imagen principal */}
        <div className="aspect-square relative overflow-hidden bg-muted">
          {isImage && displayUrl ? (
            <img
              src={displayUrl}
              alt={fileName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : isVideo && videoCoverImages[index] ? (
            <img
              src={(() => {
                const coverImage = videoCoverImages[index];
                if (coverImage instanceof File || coverImage instanceof Blob) {
                  try {
                    return URL.createObjectURL(coverImage);
                  } catch (error) {
                    console.error('Error creating object URL:', error);
                    return '';
                  }
                }
                return typeof coverImage === 'string' ? coverImage : '';
              })()}
              alt={`Portada de ${fileName}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : isVideo && previewUrl ? (
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
            />
          ) : isAudio ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
              <Mic className="h-16 w-16 text-purple-500" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Camera className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Indicador de imagen de portada */}
          {isImage && isPreviewImage && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
              <Star className="h-3 w-3 fill-white" />
              Portada
            </div>
          )}

          {/* Indicador de imagen de portada personalizada para video */}
          {isVideo && videoCoverImages[index] && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
              <CheckCircle className="h-3 w-3" />
              Portada
            </div>
          )}

          {/* Botón eliminar en esquina superior derecha */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleFileRemove(type, index)}
            className="absolute top-2 right-2 h-8 w-8 p-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            title="Eliminar archivo"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Input oculto para subir imagen de portada para video */}
          {isVideo && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleVideoCoverImageSelect(index, e.target.files)}
              className="hidden"
              id={`video-cover-${index}`}
            />
          )}
        </div>

        {/* Información del archivo */}
        <div className="p-3 bg-card">
          <p className="text-sm font-medium text-foreground truncate mb-1">
            {fileName}
          </p>
          {isValidFile && (
            <p className="text-xs text-muted-foreground mb-3">
              {(fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          )}

          {/* Botones de acción (misma fila) */}
          <div className="flex gap-2 mt-2">
            {/* Botón para seleccionar como preview */}
            {isImage && (
              <Button
                variant={isPreviewImage ? "default" : "outline"}
                size="sm"
                onClick={() => handleSetCoverImage(index)}
                className={`flex-1 ${isPreviewImage
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                  : 'hover:bg-yellow-50 hover:border-yellow-300 dark:hover:bg-yellow-950/20'
                  }`}
                title={isPreviewImage ? "Imagen de portada actual" : "Seleccionar como imagen de portada"}
              >
                <Star className={`h-4 w-4 mr-1 ${isPreviewImage ? 'fill-white' : ''}`} />
                {isPreviewImage && 'Portada'}
              </Button>
            )}

            {/* Botón para subir imagen de portada para video */}
            {isVideo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`video-cover-${index}`)?.click()}
                className="flex-1 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/20"
                title={videoCoverImages[index] ? "Cambiar imagen de portada del video" : "Seleccionar imagen de portada para video"}
              >
                <Upload className="h-4 w-4 mr-1" />
                {videoCoverImages[index] ? 'Cambiar' : 'Portada'}
              </Button>
            )}
          </div>

          {/* Botón Ajustar debajo - solo para imagen de preview */}
          {isImage && isValidFile && isPreviewImage && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditImage(file, index)}
                className="w-full hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20"
                title="Ajustar y recortar imagen"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Ajustar
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };


  // Función para renderizar la vista previa de archivos
  const renderFilePreview = (
    file: File | string,
    type: 'photos' | 'videos' | 'audios',
    index: number,
  ) => {
    const isImage = type === 'photos';
    const isVideo = type === 'videos';
    const isAudio = type === 'audios';

    // Validar que el file sea un objeto File válido
    const isValidFile = file instanceof File && file.size > 0;
    const isStringUrl = typeof file === 'string';
    const previewUrl = isValidFile ? URL.createObjectURL(file) : isStringUrl ? file : null;
    const fileName = isValidFile ? file.name : isStringUrl ? file.split('/').pop() || 'Archivo' : 'Archivo';
    const fileSize = isValidFile ? file.size : 0;

    // Para imágenes, verificar si está procesada
    const processedImage = isImage ? processedImages.get(index) : null;
    const isProcessed = !!processedImage;
    const displayUrl = processedImage ? processedImage.url : previewUrl;

    return (
      <div
        key={index}
        className={`relative group border rounded-lg overflow-hidden transition-all w-48 h-64 flex flex-col ${isImage && coverImageIndex === index
          ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-400 dark:ring-yellow-600'
          : 'bg-muted/50'
          }`}
      >
        {/* Preview de archivo */}
        <div className="flex-1 flex items-center justify-center bg-gray-200 relative overflow-hidden">
          {isImage && displayUrl && (
            <img
              src={displayUrl}
              alt={fileName}
              className="w-full h-full object-cover"
            />
          )}
          {isVideo && (
            // Si es un video nuevo (File) y tiene cover image, mostrar el cover
            (isValidFile && videoCoverImages[index]) ? (
              <img
                src={(() => {
                  const coverImage = videoCoverImages[index];
                  if (coverImage instanceof File || coverImage instanceof Blob) {
                    try {
                      return URL.createObjectURL(coverImage);
                    } catch (error) {
                      console.error('Error creating object URL:', error);
                      return '';
                    }
                  }
                  return typeof coverImage === 'string' ? coverImage : '';
                })()}
                alt={`Portada de ${fileName}`}
                className="w-full h-full object-cover"
              />
            ) : previewUrl ? (
              // Mostrar el video (tanto nuevos como existentes)
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <Video className="h-10 w-10 text-gray-400" />
            )
          )}
          {isAudio && <Mic className="h-10 w-10 text-gray-600" />}

          {/* Badge de portada */}
          {isImage && coverImageIndex === index && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <Star className="h-4 w-4 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Info + botones */}
        <div className="p-2 flex flex-col gap-1">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {isValidFile && (
            <p className="text-xs text-muted-foreground">
              {(fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          <div className="flex gap-1 mt-1">
            {isImage && (
              <Button
                variant={coverImageIndex === index ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSetCoverImage(index)}
                className={`flex-1 h-8 px-2 ${coverImageIndex === index
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'hover:bg-yellow-100 hover:text-yellow-600'
                  }`}
              >
                <Star className={`h-4 w-4 mr-1 ${coverImageIndex === index ? 'fill-white' : ''}`} />
                <span className="text-xs">
                  {coverImageIndex === index ? 'Portada' : 'Seleccionar'}
                </span>
              </Button>
            )}

            {isVideo && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleVideoCoverImageSelect(index, e.target.files)}
                  className="hidden"
                  id={`video-cover-${index}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById(`video-cover-${index}`)?.click()}
                  className="flex-1 h-8 px-2"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  <span className="text-xs">
                    {videoCoverImages[index] ? 'Cambiar' : 'Portada'}
                  </span>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFileRemove(type, index)}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );

  };

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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${photos.length >= contentLimits.maxPhotos
                  ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60'
                  : 'hover:border-purple-500 cursor-pointer'
                  } ${errors.photos
                    ? 'border-red-500'
                    : 'border-muted-foreground/30'
                  }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect('photos', e.target.files)}
                  className="hidden"
                  id="photos-upload"
                  disabled={photos.length >= contentLimits.maxPhotos}
                />
                <label
                  htmlFor="photos-upload"
                  className={`${photos.length >= contentLimits.maxPhotos ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {photos.length >= contentLimits.maxPhotos ? 'Límite alcanzado' : 'Añadir fotos'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WEBP - Sin límite de tamaño
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    📏 Recomendado: mínimo 500×600px para mejor calidad
                  </p>
                </label>
              </div>

              {/* Vista previa de fotos */}
              {photos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">
                    Fotos seleccionadas:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {photos.map((file, index) =>
                      renderImageCard(file, 'photos', index),
                    )}
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
                    <p>
                      <strong>Nota:</strong> Los videos se subirán sin marca de agua. Asegúrate de que el contenido sea apropiado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${videos.length >= contentLimits.maxVideos
                  ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60'
                  : 'hover:border-purple-500 cursor-pointer'
                  } ${errors.videos
                    ? 'border-red-500'
                    : 'border-muted-foreground/30'
                  }`}
              >
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileSelect('videos', e.target.files)}
                  className="hidden"
                  id="videos-upload"
                  disabled={videos.length >= contentLimits.maxVideos}
                />
                <label
                  htmlFor="videos-upload"
                  className={`${videos.length >= contentLimits.maxVideos ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {videos.length >= contentLimits.maxVideos ? 'Límite alcanzado' : 'Añadir videos'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, AVI, MOV hasta 10MB cada uno
                  </p>
                </label>
              </div>

              {/* Vista previa de videos */}
              {videos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Videos seleccionados:
                  </h4>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {videos.filter(file => file !== null).map((file, index) =>
                      renderFilePreview(file, 'videos', index),
                    )}
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${audios.length >= contentLimits.maxAudios
                  ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60'
                  : 'hover:border-purple-500 cursor-pointer'
                  } ${errors.audios
                    ? 'border-red-500'
                    : 'border-muted-foreground/30'
                  }`}
              >
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleFileSelect('audios', e.target.files)}
                  className="hidden"
                  id="audios-upload"
                  disabled={audios.length >= contentLimits.maxAudios}
                />
                <label
                  htmlFor="audios-upload"
                  className={`${audios.length >= contentLimits.maxAudios ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {audios.length >= contentLimits.maxAudios ? 'Límite alcanzado' : 'Añadir audios'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, OGG hasta 10MB cada uno
                  </p>
                </label>
              </div>

              {/* Vista previa de audios */}
              {audios.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Audios seleccionados:
                  </h4>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {audios.map((file, index) =>
                      renderFilePreview(file, 'audios', index),
                    )}
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

      {/* Modal de recorte de imagen */}
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
          aspectRatio={4 / 6}
        />
      )}
    </div>
  );
}
