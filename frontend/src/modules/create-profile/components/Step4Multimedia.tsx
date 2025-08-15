'use client';

import { Camera, Mic, Video, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { applyWatermarkToFiles, needsWatermark } from '@/utils/watermark';
import { useFormContext } from '../context/FormContext';

type Step4MultimediaProps = {};

export function Step4Multimedia({ }: Step4MultimediaProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const formData = watch();
  const [isProcessingWatermark, setIsProcessingWatermark] = useState(false);

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
    const currentFiles =
      type === 'photos' ? photos : type === 'videos' ? videos : audios;
    const maxFiles = type === 'photos' ? 20 : type === 'videos' ? 8 : 6;

    // Validar límites
    if (currentFiles.length + fileArray.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos para ${type}`);
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

    // Validar tamaño (10MB por archivo)
    const oversizedFiles = fileArray.filter(
      (file) => file.size > 10 * 1024 * 1024,
    );
    if (oversizedFiles.length > 0) {
      toast.error('Archivo muy grande. Máximo 10MB por archivo');
      return;
    }

    // Aplicar marca de agua a imágenes y videos
    let processedFiles = fileArray;
    const filesToWatermark = fileArray.filter(needsWatermark);

    if (filesToWatermark.length > 0) {
      setIsProcessingWatermark(true);
      toast.loading('Aplicando marca de agua...', { id: 'watermark-process' });

      try {
        const watermarkedFiles = await applyWatermarkToFiles(
          filesToWatermark,
          undefined, // Usar texto por defecto
          (current, total) => {
            toast.loading(`Procesando ${current}/${total} archivos...`, {
              id: 'watermark-process',
            });
          },
        );

        // Reemplazar archivos originales con los que tienen marca de agua
        processedFiles = fileArray.map((file) => {
          const watermarkedIndex = filesToWatermark.findIndex(
            (f) => f === file,
          );
          return watermarkedIndex !== -1
            ? watermarkedFiles[watermarkedIndex]
            : file;
        });

        toast.success('Marca de agua aplicada correctamente', {
          id: 'watermark-process',
        });
      } catch (error) {
        // Error aplicando marca de agua
        toast.error(
          'Error aplicando marca de agua. Usando archivos originales.',
          { id: 'watermark-process' },
        );
        // Continuar con archivos originales en caso de error
      } finally {
        setIsProcessingWatermark(false);
      }
    }

    // Agregar archivos procesados al formulario
    const newFiles = [...currentFiles, ...processedFiles];
    setValue(type, newFiles);

    toast.success(`${fileArray.length} archivo(s) agregado(s) a ${type}`);
  };

  // Función para eliminar archivos
  const handleFileRemove = (
    type: 'photos' | 'videos' | 'audios',
    index: number,
  ) => {
    const currentFiles =
      type === 'photos' ? photos : type === 'videos' ? videos : audios;
    const newFiles = currentFiles.filter((_, i) => i !== index);

    setValue(type, newFiles);

    toast.success('Archivo eliminado');
  };

  // Función para renderizar la vista previa de archivos
  const renderFilePreview = (
    file: File,
    type: 'photos' | 'videos' | 'audios',
    index: number,
  ) => {
    const isImage = type === 'photos';
    const isVideo = type === 'videos';
    const isAudio = type === 'audios';

    return (
      <div
        key={index}
        className="relative group border rounded-lg p-2 bg-muted/50"
      >
        <div className="flex items-center space-x-2">
          {isImage && (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {isVideo && (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <Video className="h-6 w-6 text-gray-600" />
            </div>
          )}
          {isAudio && (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <Mic className="h-6 w-6 text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileRemove(type, index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
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
              <Badge variant="outline">{photos.length} / 20</Badge>
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
                    <strong>Protección automática:</strong> Se aplicará una
                    marca de agua a tus imágenes proteger tu
                    contenido.
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
                  } ${isProcessingWatermark ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect('photos', e.target.files)}
                  className="hidden"
                  id="photos-upload"
                  disabled={isProcessingWatermark}
                />
                <label htmlFor="photos-upload" className="cursor-pointer">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Añadir fotos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WEBP hasta 10MB cada una
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
              <Badge variant="outline">{videos.length} / 8</Badge>
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
                className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer ${isProcessingWatermark ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileSelect('videos', e.target.files)}
                  className="hidden"
                  id="videos-upload"
                  disabled={isProcessingWatermark}
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
              <Badge variant="outline">{audios.length} / 6</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer ${isProcessingWatermark ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleFileSelect('audios', e.target.files)}
                  className="hidden"
                  id="audios-upload"
                  disabled={isProcessingWatermark}
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
    </div>
  );
}
