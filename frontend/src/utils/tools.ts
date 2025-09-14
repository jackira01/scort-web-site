import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { applyWatermarkToImage } from './watermark';
import { ProcessedImageResult } from './imageProcessor';

const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "";

/**
 * Normaliza el tamaño de una imagen a un máximo de 1000px manteniendo la proporción
 */
export const normalizeImageSize = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Calcular nuevas dimensiones manteniendo la proporción
          const maxSize = 1024; // Aumentar a 1024px para mantener mejor resolución
          let { width, height } = img;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          // Configurar el canvas con las nuevas dimensiones
          canvas.width = width;
          canvas.height = height;

          // Dibujar la imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir el canvas a blob y luego a File
          canvas.toBlob((blob) => {
            if (blob) {
              const normalizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(normalizedFile);
            } else {
              reject(new Error('Error al generar el blob de la imagen normalizada'));
            }
          }, file.type, 0.98); // Calidad del 98% para mantener mejor resolución
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen para normalización'));
      };

      img.src = e.target!.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo para normalización'));
    };

    reader.readAsDataURL(file);
  });
};


export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.6, // máximo 600KB
    maxWidthOrHeight: 1280, // permitir hasta 1280px para mantener la resolución original
    useWebWorker: true,
    preserveExif: false, // remover metadatos para reducir tamaño
    initialQuality: 0.9, // calidad inicial más alta
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    // Error al comprimir imagen
    return file; // si falla, sigue con el original
  }
};

export const uploadMultipleImages = async (
  filesArray: File[],
  watermarkText?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(string | null)[]> => {
  const uploadedUrls: (string | null)[] = [];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    try {
      // 1. Normalización de tamaño (máximo 1000px)
      const normalizedFile = await normalizeImageSize(file);

      // 2. Aplicación de marca de agua
      const watermarkedFile = await applyWatermarkToImage(normalizedFile, watermarkText);

      // 3. Compresión final (máximo 500KB)
      const compressedFile = await compressImage(watermarkedFile);

      // 4. Subida a Cloudinary
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', upload_preset);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );

      uploadedUrls.push(response.data.secure_url);

      // Callback de progreso
      if (onProgress) {
        onProgress(i + 1, filesArray.length);
      }
    } catch (error) {
      // Error en cualquier paso del proceso
      uploadedUrls.push(null);

      // Callback de progreso incluso en error
      if (onProgress) {
        onProgress(i + 1, filesArray.length);
      }
    }
  }

  return uploadedUrls;
};

/**
 * Sube imágenes ya procesadas (recortadas y optimizadas) a Cloudinary
 * Esta función omite el procesamiento local ya que las imágenes vienen listas
 */
export const uploadProcessedImages = async (
  processedImages: ProcessedImageResult[],
  onProgress?: (current: number, total: number) => void
): Promise<(string | null)[]> => {
  const uploadedUrls: (string | null)[] = [];

  for (let i = 0; i < processedImages.length; i++) {
    const processedImage = processedImages[i];

    try {
      const formData = new FormData();
      formData.append('file', processedImage.file);
      formData.append('upload_preset', upload_preset);
      formData.append('resource_type', 'image');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );

      uploadedUrls.push(response.data.secure_url);

      // Callback de progreso
      if (onProgress) {
        onProgress(i + 1, processedImages.length);
      }
    } catch (error) {
      console.error('Error subiendo imagen procesada:', error);
      uploadedUrls.push(null);

      // Callback de progreso incluso en error
      if (onProgress) {
        onProgress(i + 1, processedImages.length);
      }
    }
  }

  return uploadedUrls;
};

/**
 * Función híbrida que maneja tanto archivos File como ProcessedImageResult
 * Útil para mantener compatibilidad con código existente
 */
export const uploadMixedImages = async (
  items: (File | ProcessedImageResult)[],
  watermarkText?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(string | null)[]> => {
  const uploadedUrls: (string | null)[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      let fileToUpload: File;

      // Si es ProcessedImageResult, usar el archivo ya procesado
      if ('file' in item && 'url' in item && 'compressionRatio' in item) {
        fileToUpload = (item as ProcessedImageResult).file;
      } else {
        // Si es File, procesarlo con el flujo original
        const file = item as File;
        const normalizedFile = await normalizeImageSize(file);
        const watermarkedFile = watermarkText
          ? await applyWatermarkToImage(normalizedFile, watermarkText)
          : normalizedFile;
        fileToUpload = await compressImage(watermarkedFile);
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('upload_preset', upload_preset);
      formData.append('resource_type', 'image');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );

      uploadedUrls.push(response.data.secure_url);

      // Callback de progreso
      if (onProgress) {
        onProgress(i + 1, items.length);
      }
    } catch (error) {
      console.error('Error en uploadMixedImages:', error);
      uploadedUrls.push(null);

      // Callback de progreso incluso en error
      if (onProgress) {
        onProgress(i + 1, items.length);
      }
    }
  }

  return uploadedUrls;
};

export const uploadMultipleVideos = async (
  filesArray: File[],
): Promise<(string | null)[]> => {
  const uploadedUrls: (string | null)[] = [];
  for (const file of filesArray) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', upload_preset);
      formData.append('resource_type', 'video');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        formData,
      );
      uploadedUrls.push(response.data.secure_url);
    } catch (error) {
      // Error al subir video
      uploadedUrls.push(null);
    }
  }

  return uploadedUrls;
};

export const uploadMultipleAudios = async (
  filesArray: File[],
): Promise<(string | null)[]> => {
  const uploadedUrls: (string | null)[] = [];
  for (const file of filesArray) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', upload_preset);
      formData.append('resource_type', 'video'); // Cloudinary usa 'video' para audios también

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        formData,
      );
      uploadedUrls.push(response.data.secure_url);
    } catch (error) {
      // Error al subir audio
      uploadedUrls.push(null);
    }
  }

  return uploadedUrls;
};
