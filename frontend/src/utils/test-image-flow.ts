/**
 * Script de prueba para verificar el flujo de procesamiento de imágenes
 * Este archivo puede ser usado para debugging del sistema de crop
 */

import { processImageComplete, validateImageDimensions } from './imageProcessor';

// Función para simular el flujo completo
export const testImageProcessingFlow = async (file: File): Promise<void> => {
  console.log('🔍 Iniciando prueba del flujo de procesamiento...');
  console.log('📁 Archivo original:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

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

    console.log('📐 Dimensiones originales:', {
      width: img.width,
      height: img.height
    });

    // Simular un crop (crear un blob recortado)
    canvas.width = Math.min(img.width, 800);
    canvas.height = Math.min(img.height, 600);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const croppedBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
    });

    console.log('✂️ Blob recortado creado:', {
      size: croppedBlob.size,
      type: croppedBlob.type
    });

    // 2. Procesar imagen completa
    const processedResult = await processImageComplete(file, croppedBlob);
    
    console.log('✅ Imagen procesada exitosamente:', {
      originalSize: file.size,
      processedSize: processedResult.file.size,
      compressionRatio: processedResult.compressionRatio,
      dimensions: processedResult.dimensions,
      url: processedResult.url ? 'URL creada' : 'Sin URL'
    });

    // 3. Validar dimensiones finales
    const validation = validateImageDimensions(processedResult.dimensions);
    console.log('🔍 Validación de dimensiones:', validation);

    // Limpiar URLs
    URL.revokeObjectURL(img.src);
    if (processedResult.url) {
      URL.revokeObjectURL(processedResult.url);
    }

    console.log('🎉 Flujo de prueba completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en el flujo de prueba:', error);
    throw error;
  }
};

// Función para verificar que las funciones de subida están disponibles
export const testUploadFunctions = () => {
  console.log('🔍 Verificando funciones de subida...');
  
  try {
    const { uploadProcessedImages, uploadMixedImages } = require('./tools');
    console.log('✅ uploadProcessedImages disponible:', typeof uploadProcessedImages === 'function');
    console.log('✅ uploadMixedImages disponible:', typeof uploadMixedImages === 'function');
    return true;
  } catch (error) {
    console.error('❌ Error importando funciones de subida:', error);
    return false;
  }
};

// Función para verificar el estado del formulario
export const debugFormState = (formData: any) => {
  console.log('🔍 Estado del formulario:');
  console.log('📷 Fotos:', formData.photos?.length || 0);
  console.log('🖼️ Imágenes procesadas:', formData.processedImages?.length || 0);
  
  if (formData.processedImages?.length > 0) {
    formData.processedImages.forEach((img: any, index: number) => {
      console.log(`   Imagen ${index + 1}:`, {
        size: img.file?.size,
        dimensions: img.dimensions,
        compressionRatio: img.compressionRatio
      });
    });
  }
};