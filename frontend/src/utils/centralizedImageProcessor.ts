/**
 * Procesador centralizado de imágenes que maneja crop, marca de agua y optimización en un solo paso
 * para evitar múltiples transformaciones que degradan la calidad y causan desplazamientos
 */

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

export interface CroppedAreaPixels {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface CentralizedProcessingOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  applyWatermark?: boolean;
  watermarkText?: string;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
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

// Configuración de marca de agua
const WATERMARK_CONFIG = {
  type: 'image', // 'text' | 'image'
  text: '© ScortWeb', // Fallback or previous usage
  imageSrc: '/images/logo 1.png',
  opacity: 0.8,
  scale: 0.3, // Escala relativa al ancho de la imagen principal
  minWidth: 100, // Ancho mínimo en píxeles
};

/**
 * Crea una imagen desde una URL
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Aplica marca de agua de imagen centrada
 */
const applyImageWatermarkToContext = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  watermarkImage: HTMLImageElement
) => {
  const { width, height } = canvas;

  // Calcular dimensiones de la marca de agua manteniendo su aspecto original
  const watermarkAspect = watermarkImage.width / watermarkImage.height;

  // Calcular ancho objetivo (porcentaje del ancho del canvas)
  let targetWidth = width * WATERMARK_CONFIG.scale;

  // Asegurar ancho mínimo si es posible (sin exceder el canvas)
  if (targetWidth < WATERMARK_CONFIG.minWidth && width > WATERMARK_CONFIG.minWidth) {
    targetWidth = WATERMARK_CONFIG.minWidth;
  }

  // Si el ancho calculado es mayor que el canvas (improbable con scale 0.3 pero posible en imgs pequeñas), limitar
  if (targetWidth > width * 0.9) {
    targetWidth = width * 0.9;
  }

  let targetHeight = targetWidth / watermarkAspect;

  // Verificar que la altura no exceda el canvas
  if (targetHeight > height * 0.9) {
    targetHeight = height * 0.9;
    targetWidth = targetHeight * watermarkAspect;
  }

  // Calcular posición para centrar
  const x = (width - targetWidth) / 2;
  const y = (height - targetHeight) / 2;

  // Guardar estado
  ctx.save();

  // Configurar opacidad
  ctx.globalAlpha = WATERMARK_CONFIG.opacity;

  // Dibujar imagen (usando high quality)
  ctx.drawImage(watermarkImage, x, y, targetWidth, targetHeight);

  // Restaurar estado
  ctx.restore();
};

/**
 * Aplica marca de agua diagonal repetida a un contexto de canvas (Legacy text mode)
 */
const applyTextWatermarkToContext = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  watermarkText: string
) => {
  const fontSize = 26;
  const fontFamily = 'Arial';
  const color = 'rgba(255, 255, 255, 0.2)';

  // Configurar el estilo de la marca de agua
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Guardar el estado del contexto
  ctx.save();

  // Rotar el canvas para inclinar el texto en diagonal (-45 grados)
  ctx.rotate(-Math.PI / 4);

  // Calcular el espaciado entre marcas de agua
  const spacingX = fontSize * 8;
  const spacingY = fontSize * 4;

  // Calcular los límites extendidos para cubrir toda el área rotada
  const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
  const startX = -diagonal;
  const endX = diagonal;
  const startY = -diagonal;
  const endY = diagonal;

  // Aplicar patrón diagonal repetido
  let rowOffset = 0;
  for (let y = startY; y < endY; y += spacingY) {
    const currentOffset = (rowOffset % 2) * (spacingX / 2);
    for (let x = startX + currentOffset; x < endX; x += spacingX) {
      ctx.fillText(watermarkText, x, y);
    }
    rowOffset++;
  }

  // Restaurar el estado del contexto
  ctx.restore();
};

/**
 * Procesa una imagen aplicando crop, marca de agua y optimización en un solo paso
 */
export const processCroppedImageCentralized = async (
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  rotation = 0,
  options: CentralizedProcessingOptions = {},
  originalFileName: string,
  originalIndex?: number
): Promise<ProcessedImageResult> => {
  const {
    maxSizeMB = 0.6,
    maxWidthOrHeight = 1024,
    initialQuality = 0.9,
    applyWatermark = true, // Default true según requerimiento
    watermarkText = WATERMARK_CONFIG.text,
    outputFormat = 'image/jpeg'
  } = options;

  try {
    // Cargar la imagen original
    const image = await createImage(imageSrc);

    // Obtener el tamaño original del blob
    let originalSize = 0;
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      originalSize = blob.size;
    } catch (fetchError) {
      console.warn('No se pudo obtener el tamaño original, usando 0:', fetchError);
      // Si es un blob URL y falla el fetch, no es crítico para el procesamiento
      originalSize = 0;
    }

    // Crear canvas para el procesamiento
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No se pudo obtener el contexto del canvas');
    }

    const rotRad = (rotation * Math.PI) / 180;

    // Establecer el tamaño del canvas para que coincida con el área recortada
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Configurar el contexto para mejor calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // PASO 1: APLICAR CROP DIRECTO SIN ROTACIÓN COMPLEJA
    if (rotation === 0) {
      // Crop simple sin rotación - método más preciso
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } else {
      // Crop con rotación - usar método simplificado
      ctx.save();

      // Mover al centro del canvas de destino
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // Aplicar rotación
      ctx.rotate(rotRad);

      // Dibujar la imagen centrada y recortada
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      );

      ctx.restore();
    }

    // PASO 2: APLICAR MARCA DE AGUA (si está habilitada)
    if (applyWatermark) {
      if (WATERMARK_CONFIG.type === 'image') {
        try {
          const watermarkImage = await createImage(WATERMARK_CONFIG.imageSrc);
          applyImageWatermarkToContext(ctx, canvas, watermarkImage);
        } catch (watermarkError) {
          console.error("Error cargando watermark image:", watermarkError);
          // Fallback a texto si falla la imagen
          applyTextWatermarkToContext(ctx, canvas, watermarkText);
        }
      } else {
        applyTextWatermarkToContext(ctx, canvas, watermarkText);
      }
    }

    // PASO 3: CONVERTIR A BLOB CON CALIDAD OPTIMIZADA
    const croppedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al crear el blob de la imagen'));
            return;
          }
          resolve(blob);
        },
        outputFormat,
        initialQuality
      );
    });

    // PASO 4: APLICAR COMPRESIÓN FINAL SI ES NECESARIO
    let finalFile = new File([croppedBlob], originalFileName, {
      type: outputFormat,
      lastModified: Date.now(),
    });

    // Solo comprimir si el archivo es mayor al límite
    if (finalFile.size > maxSizeMB * 1024 * 1024) {
      const imageCompression = await loadImageCompression();
      finalFile = await imageCompression(finalFile, {
        maxSizeMB,
        maxWidthOrHeight,
        initialQuality: initialQuality * 0.9, // Reducir un poco más la calidad para la compresión final
        useWebWorker: true,
        fileType: outputFormat,
      });
    }

    // Obtener dimensiones finales
    const finalDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(finalFile);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al obtener dimensiones finales'));
      };

      img.src = url;
    });

    const compressedSize = finalFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    const url = URL.createObjectURL(finalFile);

    return {
      file: finalFile,
      url,
      originalSize,
      compressedSize,
      compressionRatio,
      dimensions: finalDimensions,
      originalIndex,
      originalFileName
    };
  } catch (error) {
    console.error('Error detallado en processCroppedImageCentralized:', error);
    throw new Error(`Error al procesar la imagen de forma centralizada: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Calcula opciones óptimas de procesamiento basadas en las dimensiones del crop
 */
export const calculateOptimalProcessingOptions = (
  cropDimensions: { width: number; height: number }
): CentralizedProcessingOptions => {
  const { width, height } = cropDimensions;
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

  // Ajustar maxWidthOrHeight basado en las dimensiones del crop
  let maxWidthOrHeight = 1024;
  if (Math.max(width, height) > 2048) {
    maxWidthOrHeight = 1200;
  }

  return {
    maxSizeMB,
    maxWidthOrHeight,
    initialQuality,
    applyWatermark: true, // Re-habilitado para usar la marca de agua centrada
    watermarkText: WATERMARK_CONFIG.text,
    outputFormat: 'image/jpeg'
  };
};