import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ProcessedImageResult, processImageComplete } from '@/utils/imageProcessor';

export const useImageProcessing = (companyName: string) => {
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [processedImages, setProcessedImages] = useState<Map<number, ProcessedImageResult>>(new Map());
    const [originalImages, setOriginalImages] = useState<Map<number, File>>(new Map());

    // Cleanup effect para revocar URLs
    useEffect(() => {
        return () => {
            processedImages.forEach((processedImage) => {
                if (processedImage.url.startsWith('blob:')) {
                    URL.revokeObjectURL(processedImage.url);
                }
            });
        };
    }, [processedImages]);

    const processNewImages = async (newFiles: File[], startIndex: number): Promise<number> => {
        let processedCount = 0;

        // CORRECCIÓN: Clonar el Map ACTUALIZADO
        const newProcessedImages = new Map(processedImages);

        console.log('📸 processNewImages iniciado:', {
            nuevosArchivos: newFiles.length,
            startIndex,
            processedImagesActual: processedImages.size,
            keysActuales: Array.from(processedImages.keys())
        });

        try {
            setIsProcessingImage(true);

            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];
                const imageIndex = startIndex + i;

                console.log(`  📸 Procesando imagen ${i + 1}/${newFiles.length}:`, {
                    fileName: file.name,
                    imageIndex,
                    startIndex
                });

                try {
                    const originalBlob = new Blob([file], { type: file.type });
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

                    newProcessedImages.set(imageIndex, processedResult);
                    processedCount++;

                    console.log(`  ✅ Imagen procesada en índice ${imageIndex}:`, file.name);
                } catch (error) {
                    console.error(`❌ Error procesando imagen ${i + 1}:`, error);
                    toast.error(`Error procesando imagen ${file.name}`);
                }
            }

            console.log('📸 Resultado processNewImages:', {
                procesadas: processedCount,
                totalEnMap: newProcessedImages.size,
                keysFinales: Array.from(newProcessedImages.keys())
            });

            setProcessedImages(newProcessedImages);
        } catch (error) {
            console.error('❌ Error en processNewImages:', error);
            toast.error('Error procesando las imágenes');
        } finally {
            setIsProcessingImage(false);
        }

        return processedCount;
    };

    return {
        isProcessingImage,
        setIsProcessingImage,
        processedImages,
        setProcessedImages,
        originalImages,
        setOriginalImages,
        processNewImages
    };
};