'use client';

import { Camera, Edit3, Mic, Play, Star, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { ProcessedImageResult } from '@/utils/imageProcessor';
import { useRef, useState } from 'react';

interface BaseMediaProps {
    file: File | string;
    index: number;
    onRemove: (type: 'photos' | 'videos' | 'audios', index: number) => void;
}

interface PhotoCardProps extends BaseMediaProps {
    processedImage?: ProcessedImageResult | null;
    isProcessingImage: boolean;
    coverImageIndex?: number;
    onEdit: (file: File | string, index: number) => void;
    onSetCover: (index: number) => void;
}

interface VideoCardProps extends BaseMediaProps {
    videoCoverImages?: Record<number, File | string>;
    onEdit: (file: File | string, index: number) => void;
    onVideoCoverSelect: (index: number, files: FileList | null) => void;
    onEditVideoCover?: (videoIndex: number) => void;
}

interface AudioCardProps extends BaseMediaProps { }

// ===== COMPONENTE PARA FOTOS =====
export const PhotoPreviewCard = ({
    file,
    index,
    processedImage,
    isProcessingImage,
    coverImageIndex,
    onRemove,
    onEdit,
    onSetCover
}: PhotoCardProps) => {
    const isValidFile = file instanceof File && file.size > 0;
    const isStringUrl = typeof file === 'string';
    const fileName = isValidFile ? (file as File).name : (file as string).split('/').pop()?.split('?')[0] || 'Archivo';
    const fileSize = isValidFile ? (file as File).size : 0;

    let displayUrl: string | null = null;
    let isProcessedValid = false;
    let isThisImageProcessing = false;

    if (processedImage) {
        const namesMatch = isValidFile && processedImage.originalFileName === (file as File).name;
        if (namesMatch) {
            displayUrl = processedImage.url;
            isProcessedValid = true;
        } else if (isValidFile) {
            try {
                displayUrl = URL.createObjectURL(file as File);
            } catch (err) {
                console.error('Error creando blob URL:', err);
            }
        }
    } else {
        if (isValidFile && file instanceof File) {
            try {
                displayUrl = URL.createObjectURL(file);
            } catch (err) {
                console.error('Error creando blob URL:', err);
            }
        }
        isThisImageProcessing = isProcessingImage;
    }

    if (!displayUrl && isStringUrl) {
        displayUrl = file as string;
    }

    const currentCoverIndex = coverImageIndex ?? 0;
    const isPreviewImage = currentCoverIndex === index;

    return (
        <div
            className={`relative group border-2 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg w-full sm:w-60 md:w-60 lg:w-64 ${isPreviewImage
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg'
                : 'bg-card border-border hover:border-primary/50'
                }`}
        >
            <div className="flex flex-row sm:flex-col h-full">
                {/* Imagen principal */}
                <div className="relative overflow-hidden w-2/5 sm:w-full aspect-[4/5] bg-muted flex-shrink-0">
                    {displayUrl ? (
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
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Camera className="h-16 w-16 text-muted-foreground" />
                        </div>
                    )}

                    {/* Botón eliminar */}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove('photos', index)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 shadow-lg transition-opacity duration-300"
                        title="Eliminar archivo"
                    >
                        <X className="h-4 w-4" />
                    </Button>
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
                        {isStringUrl && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Archivo existente
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 mt-2 sm:mt-3">
                        <Button
                            variant={isPreviewImage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onSetCover(index)}
                            className={`w-full text-xs sm:text-sm ${isPreviewImage
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                                : 'hover:bg-yellow-50 hover:border-yellow-300 dark:hover:bg-yellow-950/20'
                                }`}
                            title={isPreviewImage ? 'Portada actual' : 'Seleccionar como portada'}
                        >
                            <Star className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isPreviewImage ? 'fill-white' : ''}`} />
                            <span className="hidden sm:inline">Portada</span>
                        </Button>

                        {(isValidFile || isStringUrl) && (
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
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===== COMPONENTE PARA VIDEOS =====
export const VideoPreviewCard = ({
    file,
    index,
    videoCoverImages,
    onRemove,
    onEdit,
    onVideoCoverSelect,
    onEditVideoCover
}: VideoCardProps) => {
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const modalVideoRef = useRef<HTMLVideoElement>(null);

    const isValidFile = file instanceof File && file.size > 0;
    const isStringUrl = typeof file === 'string';
    const isVideoObject = typeof file === 'object' && file !== null && 'link' in file;

    let fileName = 'Video';
    let fileSize = 0;
    let videoUrl = '';
    let videoPreview = '';
    let displayUrl: string | null = null;

    if (isValidFile) {
        fileName = (file as File).name;
        fileSize = (file as File).size;
        try {
            displayUrl = URL.createObjectURL(file as File);
        } catch (err) {
            console.error('Error creando blob URL para video:', err);
        }
    } else if (isVideoObject) {
        videoUrl = (file as any).link;
        videoPreview = (file as any).preview || '';
        fileName = videoUrl.split('/').pop()?.split('?')[0] || 'Video';
        displayUrl = videoUrl;
    } else if (isStringUrl) {
        fileName = (file as string).split('/').pop()?.split('?')[0] || 'Video';
        videoUrl = file as string;
        displayUrl = file as string;
    }

    const getVideoCoverUrl = () => {
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
        if (isVideoObject && videoPreview) {
            return videoPreview;
        }
        return '';
    };

    const videoCoverUrl = getVideoCoverUrl();
    const hasVideoPreview = !!videoCoverUrl;

    const openVideoModal = () => {
        if (displayUrl) {
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

    return (
        <>
            <div className="relative group border-2 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg bg-card border-border hover:border-primary/50 w-full">
                {/* Preview del video con aspect ratio 16:9 */}
                <div className="relative overflow-hidden w-full aspect-video bg-muted">
                    {hasVideoPreview ? (
                        <img
                            src={videoCoverUrl}
                            alt={`Portada de ${fileName}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                                console.error(`❌ Error cargando preview de video [${index}]:`, videoCoverUrl);
                                e.currentTarget.onerror = null;
                            }}
                        />
                    ) : displayUrl ? (
                        <video
                            src={displayUrl}
                            className="w-full h-full object-cover"
                            muted
                            onError={(e) => {
                                console.error(`❌ Error cargando video [${index}]:`, displayUrl);
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                            <Camera className="h-16 w-16 text-purple-500" />
                        </div>
                    )}

                    {/* Botón eliminar */}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove('videos', index)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 shadow-lg transition-opacity duration-300"
                        title="Eliminar video"
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {/* Botón Play */}
                    {displayUrl && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={openVideoModal}
                            className="absolute bottom-2 right-2 h-12 w-12 p-0 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg transition-all duration-300 hover:scale-110"
                            title="Reproducir video"
                        >
                            <Play className="h-6 w-6 text-white fill-white" />
                        </Button>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onVideoCoverSelect(index, e.target.files)}
                        className="hidden"
                        id={`video-cover-${index}`}
                    />
                </div>

                {/* Información y controles del video */}
                <div className="p-4 bg-card">
                    <div className="space-y-2 mb-3">
                        <p className="text-base font-medium text-foreground truncate" title={fileName}>
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
                                Video existente
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-2 mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`video-cover-${index}`)?.click()}
                            className="w-full text-sm"
                            title="Subir imagen de portada personalizada"
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            {videoCoverImages?.[index] ? 'Cambiar portada' : 'Subir portada'}
                        </Button>

                        {videoCoverImages?.[index] && onEditVideoCover && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditVideoCover(index)}
                                className="w-full text-sm border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                                title="Recortar portada del video"
                            >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Recortar
                            </Button>
                        )}
                    </div>

                </div>
            </div>

            {/* Modal de Reproducción */}
            {displayUrl && (
                <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                    <DialogContent className="max-w-4xl bg-background p-2">
                        <VisuallyHidden>
                            <DialogTitle>Reproductor de Video</DialogTitle>
                        </VisuallyHidden>

                        <Button
                            onClick={closeVideoModal}
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 z-50 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>

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
                                    onError={() => setVideoError(true)}
                                >
                                    <track kind="captions" />
                                    Tu navegador no soporta la reproducción de videos.
                                </video>
                            )}
                        </div>

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
        </>
    );
};

// ===== COMPONENTE PARA AUDIO =====
export const AudioPreviewCard = ({ file, index, onRemove }: AudioCardProps) => {
    const isValidFile = file instanceof File && file.size > 0;
    const isStringUrl = typeof file === 'string';
    const fileName = isValidFile ? (file as File).name : (file as string).split('/').pop()?.split('?')[0] || 'Audio';
    const fileSize = isValidFile ? (file as File).size : 0;

    let displayUrl: string | null = null;

    if (isValidFile && file instanceof File) {
        try {
            displayUrl = URL.createObjectURL(file);
        } catch (err) {
            console.error('Error creando blob URL para audio:', err);
        }
    } else if (isStringUrl) {
        displayUrl = file as string;
    }

    return (
        <div className="relative group border-2 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg bg-card border-border hover:border-primary/50 w-full sm:w-80">
            <div className="p-4">


                {/* Información del archivo */}
                <div className="space-y-2 mb-3">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove('audios', index)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 shadow-lg"
                        title="Eliminar audio"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <p className="text-base font-medium text-foreground truncate" title={fileName}>
                        {fileName}
                    </p>
                    {isValidFile && fileSize > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {(fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                    )}
                    {isStringUrl && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            Audio existente
                        </p>
                    )}
                </div>

                {/* Reproductor de audio */}
                {displayUrl && (
                    <audio controls className="w-full" src={displayUrl}>
                        Tu navegador no soporta la reproducción de audio.
                    </audio>
                )}
            </div>
        </div>
    );
};