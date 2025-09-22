import { applyWatermarkToImage } from './watermark';

/**
 * Carga dinámica de browser-image-compression solo en el cliente
 */
const loadImageCompression = async () => {
  if (typeof window === 'undefined') {
    throw new Error('browser-image-compression solo puede usarse en el cliente');
  }
  const { default: imageCompression } = await import('browser-image-compression');
  return imageCompression;
};

export interface ImageProcessingOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  useWebWorker?: boolean;
  applyWatermark?: boolean;
  watermarkText?: string;
}

export interface ProcessedImageResult {
  file: File;
  url: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  originalIndex?: number;
  originalFileName?: string;
}

/**
 * Obtiene las dimensiones de una imagen desde un Blob o File
 */
export const getImageDimensions = (file: Blob): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = url;
  });
};

/**
 * Convierte un Blob a File con nombre personalizado
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now(),
  });
};

/**
 * Procesa una imagen recortada aplicando optimización y marca de agua
 */
export const processImageAfterCrop = async (
  croppedBlob: Blob,
  originalFileName: string,
  options: ImageProcessingOptions = {},
  originalIndex?: number
): Promise<ProcessedImageResult> => {
  const {
    maxSizeMB = 0.6,
    maxWidthOrHeight = 1024,
    initialQuality = 0.9,
    useWebWorker = true,
    applyWatermark = true,
    watermarkText = 'SCORT'
  } = options;

  try {
    // Obtener dimensiones originales para validación
    await getImageDimensions(croppedBlob);
    const originalSize = croppedBlob.size;

    // Convertir blob a file para el procesamiento
    let processedFile = blobToFile(croppedBlob, originalFileName);

    // Aplicar marca de agua si está habilitada
    if (applyWatermark) {
      const watermarkedBlob = await applyWatermarkToImage(processedFile, watermarkText);
      processedFile = blobToFile(watermarkedBlob, originalFileName);
    }

    // Comprimir la imagen - TEMPORALMENTE COMENTADO
    // const imageCompression = await loadImageCompression();
    // const compressedFile = await imageCompression(processedFile, {
    //   maxSizeMB,
    //   maxWidthOrHeight,
    //   initialQuality,
    //   useWebWorker,
    //   fileType: 'image/jpeg', // Forzar JPEG para mejor compresión
    // });
    
    // TEMPORALMENTE: usar archivo sin comprimir
    const compressedFile = processedFile;

    // Obtener dimensiones finales
    const finalDimensions = await getImageDimensions(compressedFile);
    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    // Crear URL para preview
    const url = URL.createObjectURL(compressedFile);

    return {
      file: compressedFile,
      url,
      originalSize,
      compressedSize,
      compressionRatio,
      dimensions: finalDimensions,
      originalIndex,
      originalFileName
    };
  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw new Error('Error al procesar la imagen después del recorte');
  }
};

/**
 * Valida las dimensiones mínimas recomendadas
 */
export const validateImageDimensions = (
  dimensions: { width: number; height: number },
  minWidth = 500,
  minHeight = 600
): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  let isValid = true;

  if (dimensions.width < minWidth) {
    warnings.push(`El ancho (${dimensions.width}px) es menor al recomendado (${minWidth}px)`);
    isValid = false;
  }

  if (dimensions.height < minHeight) {
    warnings.push(`La altura (${dimensions.height}px) es menor a la recomendada (${minHeight}px)`);
    isValid = false;
  }

  return { isValid, warnings };
};

/**
 * Procesa múltiples imágenes recortadas
 */
export const processMultipleImagesAfterCrop = async (
  croppedImages: Array<{ blob: Blob; fileName: string }>,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult[]> => {
  const results: ProcessedImageResult[] = [];

  for (const { blob, fileName } of croppedImages) {
    try {
      const result = await processImageAfterCrop(blob, fileName, options);
      results.push(result);
    } catch (error) {
      console.error(`Error procesando ${fileName}:`, error);
      throw error;
    }
  }

  return results;
};

/**
 * Calcula el tamaño óptimo de compresión basado en las dimensiones
 */
export const calculateOptimalCompression = (
  dimensions: { width: number; height: number }
): ImageProcessingOptions => {
  const { width, height } = dimensions;
  const totalPixels = width * height;

  // Calcular calidad basada en el número de píxeles
  let initialQuality = 0.9;
  let maxSizeMB = 0.6;

  if (totalPixels > 2000000) { // Imágenes muy grandes (>2MP)
    initialQuality = 0.8;
    maxSizeMB = 0.5;
  } else if (totalPixels > 1000000) { // Imágenes grandes (>1MP)
    initialQuality = 0.85;
    maxSizeMB = 0.55;
  }

  // Ajustar maxWidthOrHeight basado en las dimensiones
  let maxWidthOrHeight = 1024;
  if (Math.max(width, height) > 2048) {
    maxWidthOrHeight = 1200;
  }

  return {
    maxSizeMB,
    maxWidthOrHeight,
    initialQuality,
    useWebWorker: true
  };
};

/**
 * Función principal para el flujo completo de procesamiento
 */
export const processImageComplete = async (
  originalFile: File,
  croppedBlob: Blob,
  options: Partial<ImageProcessingOptions> = {},
  originalIndex?: number
): Promise<ProcessedImageResult> => {
  // Obtener dimensiones del archivo recortado
  const dimensions = await getImageDimensions(croppedBlob);

  // Calcular configuración óptima de compresión
  const optimalOptions = calculateOptimalCompression(dimensions);

  // Combinar opciones
  const finalOptions: ImageProcessingOptions = {
    ...optimalOptions,
    ...options
  };

  // Procesar la imagen
  return await processImageAfterCrop(croppedBlob, originalFile.name, finalOptions, originalIndex);
};