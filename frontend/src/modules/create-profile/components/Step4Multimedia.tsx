'use client';

import { Camera, Mic, Video, X, Edit3, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageCropModal } from '@/components/ImageCropModal';
import { ProcessedImageResult } from '@/utils/imageProcessor';
import { uploadProcessedImages, uploadMixedImages } from '@/utils/tools';
// Watermark se aplica automáticamente en uploadMultipleImages
import { useFormContext } from '../context/FormContext';
import { usePlans } from '@/hooks/usePlans';
import { useConfigValue } from '@/hooks/use-config-parameters';

interface DefaultPlanConfig {
  enabled: boolean;
  planId: string | null;
  planCode: string | null;
}

type Step4MultimediaProps = {};

export function Step4Multimedia({ }: Step4MultimediaProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const formData = watch();
  // Estados para el procesamiento de imágenes
  const [contentLimits, setContentLimits] = useState({
    maxPhotos: 20, // valores por defecto
    maxVideos: 8,
    maxAudios: 6
  });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<{
    file: File;
    index?: number;
  } | null>(null);
  const [processedImages, setProcessedImages] = useState<Map<number, ProcessedImageResult>>(new Map());
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Obtener planes disponibles
  const { data: plansResponse } = usePlans({
    limit: 50,
    page: 1,
    isActive: true
  });
  const plans = plansResponse?.plans || [];

  // Obtener configuración del plan por defecto
  const { value: defaultConfig } = useConfigValue<DefaultPlanConfig>(
    'system.default_plan',
    {
      enabled: true,
      defaultValue: { enabled: false, planId: null, planCode: null }
    }
  );

  // Cargar límites del plan por defecto
  useEffect(() => {
    if (defaultConfig?.enabled && defaultConfig.planId && plans.length > 0) {
      const defaultPlan = plans.find(plan => plan._id === defaultConfig.planId);

      if (defaultPlan && defaultPlan.contentLimits) {
        setContentLimits({
          maxPhotos: defaultPlan.contentLimits.photos.max || 20,
          maxVideos: defaultPlan.contentLimits.videos.max || 8,
          maxAudios: defaultPlan.contentLimits.audios.max || 6
        });
      }
    }
  }, [defaultConfig, plans]);

  // Usar los valores del formulario como fuente de verdad
  const photos = formData.photos || [];
  const videos = formData.videos || [];
  const audios = formData.audios || [];

  // Función para manejar la selección de archivos
  const handleFileSelect = async (
    type: 'photos' | 'videos' | 'audios',
    files: FileList | null,
  ) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const currentFiles: (File | string)[] =
      type === 'photos' ? photos : type === 'videos' ? videos : audios;

    // Validar límites dinámicos
    const limits = {
      photos: contentLimits.maxPhotos,
      videos: contentLimits.maxVideos,
      audios: contentLimits.maxAudios,
    };

    if (currentFiles.length + fileArray.length > limits[type]) {
      toast.error(
        `Solo puedes subir un máximo de ${limits[type]} ${type === 'photos' ? 'fotos' : type === 'videos' ? 'videos' : 'audios'}`,
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

    const invalidFiles = fileArray.filter(
      (file) => !validTypes[type].includes(file.type),
    );
    if (invalidFiles.length > 0) {
      toast.error(`Tipo de archivo no válido para ${type}`);
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
        toast.error(`Archivo muy grande. Máximo 10MB por archivo de ${type}`);
        return;
      }
    }

    // Para imágenes, abrir modal de crop para cada archivo
    if (type === 'photos') {
      // Agregar archivos temporalmente y abrir crop para el primero
      const newFiles: (File | string)[] = [...currentFiles, ...fileArray];
      setValue(type, newFiles);

      // Abrir crop modal para la primera imagen nueva
      if (fileArray.length > 0) {
        setCurrentImageToCrop({
          file: fileArray[0],
          index: currentFiles.length
        });
        setCropModalOpen(true);
      }

      toast.success(`${fileArray.length} imagen(es) agregada(s). Recorta cada una para optimizar.`);
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
      type === 'photos' ? photos : type === 'videos' ? videos : audios;
    const newFiles = currentFiles.filter((_, i) => i !== index);

    // Liberar URL de objeto si es un archivo File
    const fileToRemove = currentFiles[index];
    if (fileToRemove instanceof File) {
      URL.revokeObjectURL(URL.createObjectURL(fileToRemove));
    }

    // Para fotos, también eliminar de processedImages y actualizar el formulario
    if (type === 'photos') {
      const newProcessedImages = new Map(processedImages);
      newProcessedImages.delete(index);
      setProcessedImages(newProcessedImages);

      // Actualizar las imágenes procesadas en el formulario
      const processedImagesArray = Array.from(newProcessedImages.values());
      setValue('processedImages', processedImagesArray);
    }

    setValue(type, newFiles);
    toast.success('Archivo eliminado');
  };

  // Función para manejar el crop completado
  const handleCropComplete = async (croppedBlob: Blob, croppedUrl: string) => {
    if (!currentImageToCrop) return;

    try {
      setIsProcessingImage(true);

      // Crear el resultado procesado desde el blob ya optimizado
      // El procesamiento centralizado ya aplicó crop, marca de agua y compresión
      const processedFile = new File([croppedBlob], currentImageToCrop.file.name, {
        type: croppedBlob.type,
        lastModified: Date.now(),
      });

      // Obtener dimensiones de la imagen procesada
      const img = new Image();
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Error al cargar imagen'));
        img.src = croppedUrl;
      });

      const processedResult: ProcessedImageResult = {
        file: processedFile,
        url: croppedUrl,
        originalSize: currentImageToCrop.file.size,
        compressedSize: processedFile.size,
        compressionRatio: ((currentImageToCrop.file.size - processedFile.size) / currentImageToCrop.file.size) * 100,
        dimensions,
        originalIndex: currentImageToCrop.index,
        originalFileName: currentImageToCrop.file.name
      };

      // Guardar el resultado procesado
      const newProcessedImages = new Map(processedImages);
      newProcessedImages.set(currentImageToCrop.index || 0, processedResult);
      setProcessedImages(newProcessedImages);

      // Guardar las imágenes procesadas en el formulario
      const processedImagesArray = Array.from(newProcessedImages.values());
      setValue('processedImages', processedImagesArray);

      toast.success(
        `Imagen procesada: ${Math.round(processedResult.compressionRatio)}% de compresión aplicada`
      );
    } catch (error) {
      toast.error('Error al procesar la imagen');
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
        className={`relative group border rounded-lg p-2 transition-all ${isProcessed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-muted/50'
          }`}
      >
        <div className="flex items-center space-x-2">
          {isImage && (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden relative">
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt={fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="h-6 w-6 text-gray-400" />
              )}
              {isProcessed && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          )}
          {isVideo && (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <Video className="h-6 w-6 text-gray-400" />
              )}
            </div>
          )}
          {isAudio && (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <Mic className="h-6 w-6 text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {fileName}
            </p>
            {isValidFile && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                {processedImage && (
                  <>
                    <span className="text-xs text-muted-foreground">→</span>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {(processedImage.compressedSize / 1024 / 1024).toFixed(2)} MB
                      ({Math.round(processedImage.compressionRatio)}% reducido)
                    </p>
                  </>
                )}
              </div>
            )}
            {processedImage && (
              <p className="text-xs text-muted-foreground">
                {processedImage.dimensions.width} × {processedImage.dimensions.height}px
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isImage && isValidFile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditImage(file, index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                title="Editar imagen"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFileRemove(type, index)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
              title="Eliminar archivo"
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
          04
        </div>
        <h2 className="text-2xl font-bold text-foreground">Multimedia</h2>
      </div>

      <div className="space-y-6">
        {/* Photos Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">
                Mis fotos <span className="text-red-500">*</span>
              </CardTitle>
              <Badge variant="outline">{photos.length} / {contentLimits.maxPhotos}</Badge>
            </div>
            <div className="space-y-3 mt-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    <strong>Importante:</strong> La primera imagen que subas
                    será tu foto principal y aparecerá como imagen de portada en
                    tu perfil.
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
                className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer ${errors.photos
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
                />
                <label htmlFor="photos-upload" className="cursor-pointer">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Añadir fotos</p>
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
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Fotos seleccionadas:
                  </h4>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {photos.map((file, index) =>
                      renderFilePreview(file, 'photos', index),
                    )}
                  </div>
                </div>
              )}

              {errors.photos && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.photos.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Videos Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">Mis videos</CardTitle>
              <Badge variant="outline">{videos.length} / {contentLimits.maxVideos}</Badge>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">ℹ</span>
                </div>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  <strong>Nota:</strong> Los videos se subirán sin marca de agua. Asegúrate de que el contenido sea apropiado.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer"
              >
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileSelect('videos', e.target.files)}
                  className="hidden"
                  id="videos-upload"
                />
                <label htmlFor="videos-upload" className="cursor-pointer">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Añadir videos</p>
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
                    {videos.map((file, index) =>
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
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">
                Mis archivos de audio
              </CardTitle>
              <Badge variant="outline">{audios.length} / {contentLimits.maxAudios}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer"
              >
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleFileSelect('audios', e.target.files)}
                  className="hidden"
                  id="audios-upload"
                />
                <label htmlFor="audios-upload" className="cursor-pointer">
                  <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Añadir audios</p>
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
          aspectRatio={4 / 3}
        />
      )}
    </div>
  );
}
