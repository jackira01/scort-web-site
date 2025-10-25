'use client';

import { Camera, Edit3, Mic, Star, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedImageResult } from '@/utils/imageProcessor';
import { useEffect, useRef } from 'react';

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
    onVideoCoverSelect
}: ImagePreviewCardProps) => {
    const isImage = type === 'photos';
    const isVideo = type === 'videos';
    const isAudio = type === 'audios';

    const isValidFile = file instanceof File && file.size > 0;
    const isStringUrl = typeof file === 'string';
    const fileName = isValidFile ? file.name : isStringUrl ? file.split('/').pop() || 'Archivo' : 'Archivo';
    const fileSize = isValidFile ? file.size : 0;

    // VALIDACIÓN CRÍTICA: Verificar que la imagen procesada corresponde al archivo
    let displayUrl: string | null = null;
    let isProcessedValid = false;
    let isThisImageProcessing = false;
    let shouldCreateBlob = false;

    if (isImage) {
        if (processedImage) {
            // Verificar que el nombre de archivo coincida
            const namesMatch = isValidFile && processedImage.originalFileName === file.name;

            if (namesMatch) {
                displayUrl = processedImage.url;
                isProcessedValid = true;
            } else {
                console.warn(`⚠️ MISMATCH en índice ${index}:`, {
                    archivoActual: fileName,
                    imagenProcesada: processedImage.originalFileName,
                    accion: 'marcando para usar original'
                });
                // Marcar para crear blob del original
                shouldCreateBlob = isValidFile;
            }
        } else {
            // No hay imagen procesada
            shouldCreateBlob = isValidFile;
            isThisImageProcessing = isProcessingImage;
        }

        // Crear blob solo si es necesario y tenemos un archivo válido
        if (shouldCreateBlob && isValidFile && file instanceof File) {
            try {
                displayUrl = URL.createObjectURL(file);
            } catch (err) {
                console.error('Error creando blob URL:', err);
                displayUrl = null;
            }
        } else if (isStringUrl && !displayUrl) {
            displayUrl = file;
        }
    } else {
        // Para videos y audios, usar displayUrl normal
        if (isValidFile && file instanceof File) {
            try {
                displayUrl = URL.createObjectURL(file);
            } catch (err) {
                console.error('Error creando blob URL para video/audio:', err);
                displayUrl = null;
            }
        } else if (isStringUrl) {
            displayUrl = file;
        }
    }

    const currentCoverIndex = coverImageIndex ?? 0;
    const isPreviewImage = isImage && currentCoverIndex === index;

    console.log(`🖼️ [${index}] ${fileName}:`, {
        hasProcesada: !!processedImage,
        processedValid: isProcessedValid,
        processedFileName: processedImage?.originalFileName,
        isPortada: isPreviewImage,
        coverIndex: currentCoverIndex,
        displayUrl: displayUrl?.substring(0, 30)
    });

    const getVideoCoverUrl = () => {
        const coverImage = videoCoverImages?.[index];
        if (!coverImage) return '';

        try {
            if (typeof coverImage === 'object' && coverImage !== null) {
                return URL.createObjectURL(coverImage as Blob);
            }
            return typeof coverImage === 'string' ? coverImage : '';
        } catch (error) {
            console.error('Error creating object URL:', error);
            return '';
        }
    };

    return (
        <div
            className={`relative group border-2 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg w-full sm:w-60 md:w-60 lg:w-64 ${isImage && isPreviewImage
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-lg'
                : 'bg-card border-border hover:border-primary/50'
                }`}
        >
            <div className="flex flex-row sm:flex-col h-full">
                {/* Imagen principal */}
                <div className="relative overflow-hidden w-2/5 sm:w-full aspect-[4/5] bg-muted flex-shrink-0">
                    {isImage && displayUrl ? (
                        <div className="relative w-full h-full">
                            <img
                                src={displayUrl}
                                alt={fileName}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                    console.error(`❌ Error cargando imagen [${index}]: ${fileName}`);
                                    // Prevenir loops infinitos
                                    e.currentTarget.onerror = null;
                                    // Intentar con archivo original si falla y es un File válido
                                    if (isValidFile && file instanceof File) {
                                        try {
                                            const newUrl = URL.createObjectURL(file);
                                            e.currentTarget.src = newUrl;
                                        } catch (err) {
                                            console.error('No se pudo crear blob alternativo:', err);
                                        }
                                    }
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
                            {/* Indicador de debug - OPCIONAL (puedes comentarlo en producción) */}
                            {!isProcessedValid && processedImage && (
                                <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded shadow-lg">
                                    ⚠️ Original
                                </div>
                            )}
                        </div>
                    ) : isVideo && videoCoverImages?.[index] ? (
                        <img
                            src={getVideoCoverUrl()}
                            alt={`Portada de ${fileName}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : isVideo && displayUrl ? (
                        <video src={displayUrl} className="w-full h-full object-cover" muted />
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
                        <p className="text-sm sm:text-base font-medium text-foreground truncate">
                            {fileName}
                        </p>
                        {isValidFile && (
                            <p className="text-xs text-muted-foreground">
                                {(fileSize / 1024 / 1024).toFixed(2)} MB
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
                                    <span className="sm:hidden">★</span>
                                </Button>
                            )}

                            {isVideo && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`video-cover-${index}`)?.click()}
                                    className="flex-1 text-xs sm:text-sm"
                                >
                                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    {videoCoverImages?.[index] ? 'Cambiar' : 'Portada'}
                                </Button>
                            )}
                        </div>

                        {isImage && isValidFile && isPreviewImage && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(file, index)}
                                className="w-full text-xs sm:text-sm"
                                title="Ajustar y recortar imagen"
                            >
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Ajustar imagen
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};