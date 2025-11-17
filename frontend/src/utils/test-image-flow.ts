/**
 * Script de prueba para verificar el flujo de procesamiento de imágenes
 * Este archivo puede ser usado para debugging del sistema de crop
 */

import { processImageComplete, validateImageDimensions } from './imageProcessor';

// Función para simular el flujo completo
export const testImageProcessingFlow = async (file: File): Promise<void> => {
  try {
    // 1. Validar dimensiones (simulando que ya se hizo el crop)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    // Simular un crop (crear un blob recortado)
    canvas.width = Math.min(img.width, 800);
    canvas.height = Math.min(img.height, 600);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const croppedBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
    });

    // 2. Procesar imagen completa
    const processedResult = await processImageComplete(file, croppedBlob);

    // 3. Validar dimensiones finales
    const validation = validateImageDimensions(processedResult.dimensions);

    // Limpiar URLs
    URL.revokeObjectURL(img.src);
    if (processedResult.url) {
      URL.revokeObjectURL(processedResult.url);
    }

  } catch (error) {
    console.error('❌ Error en el flujo de prueba:', error);
    throw error;
  }
};

// Función para verificar que las funciones de subida están disponibles
export const testUploadFunctions = async () => {

  try {
    // Importación dinámica para evitar require()
    const toolsModule = await import('./tools');
    const { uploadProcessedImages, uploadMixedImages } = toolsModule;
    return true;
  } catch (error) {
    console.error('❌ Error importando funciones de subida:', error);
    return false;
  }
};

// Interfaces para tipado
interface ProcessedImage {
  file?: File;
  dimensions?: { width: number; height: number };
  compressionRatio?: number;
}

interface FormData {
  photos?: File[];
  processedImages?: ProcessedImage[];
}
