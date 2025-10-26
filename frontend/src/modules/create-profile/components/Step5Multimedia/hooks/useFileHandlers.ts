import toast from 'react-hot-toast';
import { FileType, ContentLimits } from '../types';
import {
    extractFilesFromList,
    validateFileTypes,
    validateFileSize,
    validateFileLimits
} from '../utils/fileValidation';
import { ProcessedImageResult } from '@/utils/imageProcessor';

interface UseFileHandlersProps {
    contentLimits: ContentLimits;
    selectedPlan: any;
    photos: (File | string)[];
    videos: (File | string)[];
    audios: (File | string)[];
    processedImages: Map<number, ProcessedImageResult>;
    originalImages: Map<number, File>;
    videoCoverImages: Record<number, File | string>;
    coverImageIndex?: number;
    setValue: (name: string, value: any, options?: any) => void;
    setOriginalImages: (images: Map<number, File>) => void;
    processNewImages: (files: File[], startIndex: number) => Promise<number>;
    setProcessedImages: (images: Map<number, ProcessedImageResult>) => void;
}

export const useFileHandlers = ({
    contentLimits,
    selectedPlan,
    photos,
    videos,
    audios,
    processedImages,
    originalImages,
    videoCoverImages,
    coverImageIndex,
    setValue,
    setOriginalImages,
    processNewImages,
    setProcessedImages
}: UseFileHandlersProps) => {

    const handleFileSelect = async (
        type: FileType,
        files: FileList | null,
        event?: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const fileArray = extractFilesFromList(files, event);

        // Limpiar el input
        if (event?.target) {
            event.target.value = '';
        }

        if (fileArray.length === 0) {
            toast.error('Error al leer los archivos. Por favor intenta de nuevo.');
            return;
        }

        const currentFiles =
            type === 'photos'
                ? (photos || [])
                : type === 'videos'
                    ? ((videos || []).filter(v => v !== null))
                    : (audios || []);

        // Validaciones
        const limits = {
            photos: contentLimits.maxPhotos,
            videos: contentLimits.maxVideos,
            audios: contentLimits.maxAudios,
        };

        if (!validateFileLimits(currentFiles.length, fileArray.length, limits[type], type, selectedPlan?.name)) {
            return;
        }

        if (!validateFileTypes(fileArray, type)) {
            return;
        }

        if (type !== 'photos' && !validateFileSize(fileArray, type)) {
            return;
        }

        // Procesar archivos
        if (type === 'photos') {
            const newFiles = [...currentFiles, ...fileArray];
            setValue('photos', newFiles, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

            const newOriginalImages = new Map(originalImages);
            fileArray.forEach((file, i) => {
                newOriginalImages.set(currentFiles.length + i, file);
            });
            setOriginalImages(newOriginalImages);

            toast.loading(`Procesando ${fileArray.length} imagen(es)...`, { id: 'processing-images' });
            const processedCount = await processNewImages(fileArray, currentFiles.length);
            toast.dismiss('processing-images');

            if (processedCount > 0) {
                toast.success(`${processedCount} imagen(es) procesada(s)`);
            } else {
                toast.error('No se pudieron procesar las imágenes');
            }
        } else {
            const newFiles = [...currentFiles, ...fileArray];
            setValue(type, newFiles, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            toast.success(`${fileArray.length} archivo(s) agregado(s)`);
        }
    };

    const handleFileRemove = (
        type: 'photos' | 'videos' | 'audios',
        index: number,
    ) => {
        if (type === 'photos') {
            const currentFiles = photos || [];

            console.log('\n🗑️ ===== ELIMINANDO FOTO =====');
            console.log('Índice a eliminar:', index);
            console.log('Archivo:', currentFiles[index] instanceof File ? currentFiles[index].name : currentFiles[index]); console.log('Total archivos:', currentFiles.length);
            console.log('coverImageIndex:', coverImageIndex);

            // 1. Revocar URL del blob
            const processedImage = processedImages.get(index);
            if (processedImage?.url.startsWith('blob:')) {
                URL.revokeObjectURL(processedImage.url);
                console.log('✅ URL revocada');
            }

            // 2. Crear nuevo array sin el elemento eliminado
            const newFiles = currentFiles.filter((_, i) => i !== index);

            // 3. REINDEXAR MAPS CORRECTAMENTE
            const reindexedProcessedImages = new Map<number, ProcessedImageResult>();
            const reindexedOriginalImages = new Map<number, File>();

            console.log('🔄 Reindexando...');
            let newIndex = 0;

            for (let oldIndex = 0; oldIndex < currentFiles.length; oldIndex++) {
                if (oldIndex === index) {
                    console.log(`  ⏭️ Saltando ${oldIndex} (eliminado)`);
                    continue;
                }

                const processed = processedImages.get(oldIndex);
                const original = originalImages.get(oldIndex);
                const file = currentFiles[oldIndex];
                const currentFileName = file instanceof File ? file.name : (typeof file === 'string' ? file.split('/').pop() : null);

                console.log(`  🔄 ${oldIndex} → ${newIndex}: ${currentFileName}`, {
                    tieneProcesada: !!processed,
                    tieneOriginal: !!original,
                    processedName: processed?.originalFileName
                });

                // ✅ VERIFICACIÓN CRÍTICA: Solo asignar imagen procesada si el nombre coincide
                if (processed) {
                    const namesMatch = currentFileName && processed.originalFileName === currentFileName;
                    
                    if (namesMatch) {
                        // ✅ La imagen procesada SÍ corresponde a este archivo
                        reindexedProcessedImages.set(newIndex, {
                            ...processed,
                            originalIndex: newIndex
                        });
                        console.log(`    ✅ Imagen procesada asignada (nombres coinciden)`);
                    } else {
                        // ❌ La imagen procesada NO corresponde - no la asignamos
                        console.warn(`    ⚠️ Imagen procesada NO coincide:`, {
                            archivo: currentFileName,
                            procesada: processed.originalFileName,
                            accion: 'imagen procesada descartada'
                        });
                        // NO asignamos la imagen procesada incorrecta
                        // El componente usará el archivo original
                    }
                }

                if (original) {
                    reindexedOriginalImages.set(newIndex, original);
                }

                newIndex++;
            }

            // 4. Calcular nuevo coverImageIndex
            const currentCoverIndex = coverImageIndex ?? 0;
            let newCoverIndex: number | undefined;

            if (newFiles.length === 0) {
                newCoverIndex = undefined;
            } else if (currentCoverIndex === index) {
                newCoverIndex = 0;
                console.log('📸 Portada eliminada, nueva: 0');
            } else if (currentCoverIndex > index) {
                newCoverIndex = currentCoverIndex - 1;
                console.log(`📸 Portada ajustada: ${currentCoverIndex} → ${newCoverIndex}`);
            } else {
                newCoverIndex = currentCoverIndex;
                console.log(`📸 Portada mantenida: ${newCoverIndex}`);
            }

            console.log('Maps DESPUÉS:', {
                processedImages: Array.from(reindexedProcessedImages.entries()).map(([k, v]) => ({
                    idx: k,
                    file: v.originalFileName
                })),
                originalImages: Array.from(reindexedOriginalImages.keys())
            });

            // Verificar correspondencia
            console.log('✅ Verificación final:');
            newFiles.forEach((file, idx) => {
                const proc = reindexedProcessedImages.get(idx);
                const fileName = file instanceof File ? file.name : (typeof file === 'string' ? file.split('/').pop() : 'unknown');
                const match = fileName === proc?.originalFileName;
                console.log(`  [${idx}] ${fileName} ↔ ${proc?.originalFileName} ${match ? '✅' : '❌'}`);
            });

            console.log('🗑️ ===== FIN ELIMINACIÓN =====\n');

            // 5. Actualizar estados EN ORDEN
            // ✅ Primero actualizar los Maps
            setProcessedImages(reindexedProcessedImages);
            setOriginalImages(reindexedOriginalImages);

            // ✅ Luego actualizar el formulario (esto causa el re-render)
            setValue('photos', newFiles, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
            });

            setValue('processedImages', Array.from(reindexedProcessedImages.values()), {
                shouldValidate: true,
                shouldDirty: true
            });

            setValue('coverImageIndex', newCoverIndex, {
                shouldValidate: true,
                shouldDirty: true
            });

            toast.success('Foto eliminada');

        } else if (type === 'videos') {
            const currentFiles = videos || [];
            const newFiles = currentFiles.filter((_, i) => i !== index);

            const newVideoCoverImages: Record<number, File | string> = {};
            Object.entries(videoCoverImages || {}).forEach(([oldIndexStr, coverImage]) => {
                const oldIndex = parseInt(oldIndexStr);
                if (oldIndex < index) {
                    newVideoCoverImages[oldIndex] = coverImage;
                } else if (oldIndex > index) {
                    newVideoCoverImages[oldIndex - 1] = coverImage;
                }
            });

            setValue('videos', newFiles, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
            });
            setValue('videoCoverImages', newVideoCoverImages, {
                shouldValidate: true
            });
            toast.success('Video eliminado');
        } else {
            const currentFiles = audios || [];
            const newFiles = currentFiles.filter((_, i) => i !== index);
            setValue('audios', newFiles, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
            });
            toast.success('Audio eliminado');
        }
    };

    return {
        handleFileSelect,
        handleFileRemove
    };
};
