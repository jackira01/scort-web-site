'use client';

import { Camera, Edit3, Mic, Play, Star, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { ProcessedImageResult } from '@/utils/imageProcessor';
import { useEffect, useRef, useState } from 'react';

interface ImagePreviewCardProps {
    file: File | string;
    type: 'photos' | 'videos' | 'audios';
    index: number;
    processedImage?: ProcessedImageResult | null;
    isProcessingImage: boolean;
    videoCoverImages?: Record<number, File | string>;
    coverImageIndex?: number;
    onRemove: (type: 'photos' | 'videos' | 'audios', index: number) => void;
    onEdit: (file: File | string, index: number) => void;
    onSetCover: (index: number) => void;
    onVideoCoverSelect: (index: number, files: FileList | null) => void;
    onEditVideoCover?: (videoIndex: number) => void;
}

export const ImagePreviewCard = ({
    file,
    type,
    index,
    processedImage,
    isProcessingImage,
    videoCoverImages,
    coverImageIndex,
    onRemove,
    onEdit,
    onSetCover,
    onVideoCoverSelect,
    onEditVideoCover
}: ImagePreviewCardProps) => {
    const isImage = type === 'photos';
    const isVideo = type === 'videos';
    const isAudio = type === 'audios';

    // 🎬 Estado para modal de reproducción de video
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const modalVideoRef = useRef<HTMLVideoElement>(null);

    // ✅ Manejar file que puede ser File, string, o {link, preview}
    let isValidFile = false;
    let isStringUrl = false;
    let isVideoObject = false;
    let fileName = 'Archivo';
    let fileSize = 0;
    let videoUrl = '';
    let videoPreview = '';

    if (file instanceof File && file.size > 0) {
        isValidFile = true;
        fileName = file.name;
        fileSize = file.size;
    } else if (typeof file === 'string') {
        isStringUrl = true;
        fileName = file.split('/').pop()?.split('?')[0] || 'Archivo';
        videoUrl = file;
    } else if (typeof file === 'object' && file !== null && 'link' in file) {
        // Es un objeto {link, preview}
        isVideoObject = true;
        videoUrl = (file as any).link;
        videoPreview = (file as any).preview || '';
        fileName = videoUrl.split('/').pop()?.split('?')[0] || 'Video';
    }

    // VALIDACIÓN: Verificar que la imagen procesada corresponde al archivo
    let displayUrl: string | null = null;
    let isProcessedValid = false;
    let isThisImageProcessing = false;
    let shouldCreateBlob = false;

    if (isImage) {
        if (processedImage) {
            const namesMatch = isValidFile && processedImage.originalFileName === (file as File).name;

            if (namesMatch) {
                displayUrl = processedImage.url;
                isProcessedValid = true;
            } else {
                shouldCreateBlob = isValidFile;
            }
        } else {
            shouldCreateBlob = isValidFile;
            isThisImageProcessing = isProcessingImage;
        }

        if (shouldCreateBlob && isValidFile && file instanceof File) {
            try {
                displayUrl = URL.createObjectURL(file);
            } catch (err) {
                console.error('Error creando blob URL:', err);
                displayUrl = null;
            }
        } else if (isStringUrl && !displayUrl) {
            displayUrl = file as string;
        }
    } else if (isVideo) {
        // ✅ PARA VIDEOS: Priorizar en este orden
        if (isValidFile && file instanceof File) {
            // Nuevo video (File)
            try {
                displayUrl = URL.createObjectURL(file);
            } catch (err) {
                console.error('Error creando blob URL para video:', err);
                displayUrl = null;
            }
        } else if (isVideoObject) {
            // Video existente (objeto con link)
            displayUrl = videoUrl;
        } else if (isStringUrl) {
            // Video como string
            displayUrl = file as string;
        }

    } else if (isAudio) {
        // Para audios
        if (isValidFile && file instanceof File) {
            try {
                displayUrl = URL.createObjectURL(file);
            } catch (err) {
                console.error('Error creando blob URL para audio:', err);
                displayUrl = null;
            }
        } else if (isStringUrl) {
            displayUrl = file as string;
        }
    }

    const currentCoverIndex = coverImageIndex ?? 0;
    const isPreviewImage = isImage && currentCoverIndex === index;

    // ✅ FUNCIÓN MEJORADA para obtener preview de video
    const getVideoCoverUrl = () => {
        // 1. Primero: cover customizado subido por el usuario
        const coverImage = videoCoverImages?.[index];
        if (coverImage) {
            try {
                if (typeof coverImage === 'object' && coverImage !== null) {
                    return URL.createObjectURL(coverImage as Blob);
                }
                return typeof coverImage === 'string' ? coverImage : '';
            } catch (error) {
                console.error('Error creating object URL:', error);
            }
        }

        // 2. Segundo: preview del objeto video (si existe)
        if (isVideoObject && videoPreview) {
            return videoPreview;
        }
        // 3. Sin preview
        return '';
    };

    const videoCoverUrl = isVideo ? getVideoCoverUrl() : '';
    const hasVideoPreview = isVideo && (!!videoCoverUrl);

    // 🎬 Funciones para el modal de video
    const openVideoModal = () => {
        if (isVideo && displayUrl) {
            setIsVideoModalOpen(true);
            setVideoError(false);
        }
    };

    const closeVideoModal = () => {
        setIsVideoModalOpen(false);
        if (modalVideoRef.current) {
            modalVideoRef.current.pause();
            modalVideoRef.current.currentTime = 0;
        }
    };

    const handleVideoError = () => {
        setVideoError(true);
    };

    return (
        <div
            className={`relative group border-2 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg w-full sm:w-60 md:w-60 lg:w-64 ${isImage && isPreviewImage
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg'
                : 'bg-card border-border hover:border-primary/50'
                }`}
        >
            <div className="flex flex-row sm:flex-col h-full">
                {/* Imagen/Video principal */}
                <div className="relative overflow-hidden w-2/5 sm:w-full aspect-[4/5] bg-muted flex-shrink-0">
                    {isImage && displayUrl ? (
                        <div className="relative w-full h-full">
                            <img
                                src={displayUrl}
                                alt={fileName}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                    console.error(`❌ Error cargando imagen [${index}]: ${fileName}`);
                                    e.currentTarget.onerror = null;
                                }}
                            />
                            {isThisImageProcessing && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                                    <div className="text-white text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
                                        <span className="text-sm font-medium">Procesando...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : isVideo && hasVideoPreview ? (
                        // ✅ Mostrar preview del video si existe
                        <img
                            src={videoCoverUrl}
                            alt={`Portada de ${fileName}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                                console.error(`❌ Error cargando preview de video [${index}]:`, videoCoverUrl);
                                e.currentTarget.onerror = null;
                            }}
                        />
                    ) : isVideo && displayUrl ? (
                        // ✅ Mostrar video (muted) si no hay preview
                        <video
                            src={displayUrl}
                            className="w-full h-full object-cover"
                            muted
                            onError={(e) => {
                                console.error(`❌ Error cargando video [${index}]:`, displayUrl);
                            }}
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

                    {/* Botón eliminar */}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove(type, index)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 shadow-lg transition-opacity duration-300"
                        title="Eliminar archivo"
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {/* 🎬 Botón Play para videos */}
                    {isVideo && displayUrl && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={openVideoModal}
                            className="absolute bottom-2 right-2 h-10 w-10 p-0 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg transition-all duration-300 hover:scale-110"
                            title="Reproducir video"
                        >
                            <Play className="h-5 w-5 text-white fill-white" />
                        </Button>
                    )}

                    {isVideo && (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onVideoCoverSelect(index, e.target.files)}
                            className="hidden"
                            id={`video-cover-${index}`}
                        />
                    )}
                </div>

                {/* Contenido */}
                <div className="p-3 sm:p-4 bg-card flex-1 flex flex-col justify-between min-w-[140px]">
                    <div className="space-y-1 sm:space-y-2">
                        <p className="text-sm sm:text-base font-medium text-foreground truncate" title={fileName}>
                            {fileName}
                        </p>
                        {isValidFile && fileSize > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {(fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                        )}
                        {isVideoObject && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Video existente
                            </p>
                        )}
                        {isStringUrl && !isVideoObject && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Archivo existente
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 mt-2 sm:mt-3">
                        <div className="flex gap-2">
                            {isImage && (
                                <Button
                                    variant={isPreviewImage ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onSetCover(index)}
                                    className={`flex-1 text-xs sm:text-sm ${isPreviewImage
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                                        : 'hover:bg-yellow-50 hover:border-yellow-300 dark:hover:bg-yellow-950/20'
                                        }`}
                                    title={isPreviewImage ? 'Portada actual' : 'Seleccionar como portada'}
                                >
                                    <Star className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isPreviewImage ? 'fill-white' : ''}`} />
                                    <span className="hidden sm:inline">Portada</span>
                                </Button>
                            )}

                            {isVideo && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`video-cover-${index}`)?.click()}
                                    className="flex-1 text-xs sm:text-sm"
                                    title="Subir imagen de portada personalizada"
                                >
                                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    {videoCoverImages?.[index] ? 'Cambiar' : 'Portada'}
                                </Button>
                            )}
                        </div>

                        {/* ✅ Botón de recortar disponible para TODAS las fotos (Files Y URLs existentes) */}
                        {isImage && (isValidFile || isStringUrl) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(file, index)}
                                className={`w-full text-xs sm:text-sm ${isPreviewImage
                                    ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20'
                                    : ''
                                    }`}
                                title="Ajustar y recortar imagen"
                            >
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Recortar imagen
                            </Button>
                        )}

                        {/* ✅ Botón de recortar PORTADA DEL VIDEO (si existe portada personalizada) */}
                        {isVideo && videoCoverImages?.[index] && onEditVideoCover && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditVideoCover(index)}
                                className="w-full text-xs sm:text-sm border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                                title="Recortar portada del video"
                            >
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Recortar portada
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* 🎬 Modal de Reproducción de Video */}
            {isVideo && displayUrl && (
                <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                    <DialogContent className="max-w-4xl bg-background p-2">
                        <VisuallyHidden>
                            <DialogTitle>Reproductor de Video</DialogTitle>
                        </VisuallyHidden>

                        {/* Botón cerrar */}
                        <Button
                            onClick={closeVideoModal}
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 z-50 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {/* Video con controles */}
                        <div className="relative w-full">
                            {videoError ? (
                                <div className="w-full h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-muted rounded-lg">
                                    <div className="text-4xl mb-2">📹</div>
                                    <p className="text-sm">Error al cargar el video</p>
                                </div>
                            ) : (
                                <video
                                    ref={modalVideoRef}
                                    src={displayUrl}
                                    controls
                                    autoPlay
                                    className="w-full rounded-lg max-h-[80vh]"
                                    onError={handleVideoError}
                                >
                                    <track kind="captions" />
                                    Tu navegador no soporta la reproducción de videos.
                                </video>
                            )}
                        </div>

                        {/* Info del archivo */}
                        <div className="mt-2 text-center">
                            <p className="text-sm font-medium text-foreground">{fileName}</p>
                            {isValidFile && fileSize > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {(fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};