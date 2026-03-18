import axios from 'axios';
import { ProcessedImageResult } from './imageProcessor';
import { applyWatermarkToImage } from './watermark';

const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "";
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "PrepagoYa";

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

/**
 * Normaliza el tamaño de una imagen a un máximo de 1000px manteniendo la proporción
 * TEMPORALMENTE COMENTADO - No reducir resolución de imágenes
 */
export const normalizeImageSize = async (file: File): Promise<File> => {
  // COMENTADO TEMPORALMENTE - Devolver archivo original sin procesar
  return file;
};


/**
 * Comprime una imagen manteniendo calidad aceptable
 * TEMPORALMENTE COMENTADO - No comprimir imágenes
 */
export const compressImage = async (file: File): Promise<File> => {
  // COMENTADO TEMPORALMENTE - Devolver archivo original sin comprimir
  return file;
};

export const uploadMultipleImages = async (
  filesArray: File[],
  watermarkText?: string,
  onProgress?: (current: number, total: number) => void
): Promise<(string | null)[]> => {
  // Validar configuración de Cloudinary
  if (!upload_preset || !cloud_name) {
    console.error('❌ Configuración de Cloudinary incompleta:', { upload_preset, cloud_name });
    throw new Error('Configuración de Cloudinary no encontrada. Verifica las variables de entorno.');
  }

  const uploadedUrls: (string | null)[] = [];

  for (let i = 0; i < (filesArray || []).length; i++) {
    const file = filesArray[i];
    try {
      // 1. Normalización de tamaño (máximo 1000px)
      const normalizedFile = await normalizeImageSize(file);

      // 2. Aplicación de marca de agua (deshabilitada para banners de noticias)
      const watermarkedFile = watermarkText ? await applyWatermarkToImage(normalizedFile, watermarkText) : normalizedFile;

      // 3. Compresión final (máximo 500KB)
      const compressedFile = await compressImage(watermarkedFile);

      // 4. Subida a Cloudinary
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', upload_preset);
      formData.append('folder', CLOUDINARY_FOLDER);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );

      if (response.data && response.data.secure_url) {
        uploadedUrls.push(response.data.secure_url);
      } else {
        console.error(`❌ Respuesta inválida de Cloudinary para imagen ${i + 1}:`, response.data);
        uploadedUrls.push(null);
      }

      // Callback de progreso
      if (onProgress) {
        onProgress(i + 1, filesArray.length);
      }
    } catch (error) {
      // Error en cualquier paso del proceso
      console.error(`❌ Error al subir imagen ${i + 1} (${file.name}):`, error);
      uploadedUrls.push(null);

      // Callback de progreso incluso en error
      if (onProgress) {
        onProgress(i + 1, filesArray.length);
      }
    }
  }

  const successCount = uploadedUrls.filter(url => url !== null).length;
  const failCount = uploadedUrls.length - successCount;

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
      formData.append('folder', CLOUDINARY_FOLDER);

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
      formData.append('folder', CLOUDINARY_FOLDER);

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
  videoCoverImages?: { [key: number]: File | string }
): Promise<{ link: string; preview: string }[]> => {
  // Validar configuración de Cloudinary
  if (!upload_preset || !cloud_name) {
    console.error('❌ Configuración de Cloudinary incompleta:', { upload_preset, cloud_name });
    throw new Error('Configuración de Cloudinary no encontrada. Verifica las variables de entorno.');
  }

  const uploadedVideos: { link: string; preview: string }[] = [];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    try {
      // Subir el video
      const videoFormData = new FormData();
      videoFormData.append('file', file);
      videoFormData.append('upload_preset', upload_preset);
      videoFormData.append('resource_type', 'video');
      videoFormData.append('folder', CLOUDINARY_FOLDER);

      const videoResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        videoFormData,
      );

      if (!videoResponse.data || !videoResponse.data.secure_url) {
        console.error(`❌ Respuesta inválida de Cloudinary para video ${i + 1}:`, videoResponse.data);
        continue;
      }

      let previewUrl = '';

      // Si hay imagen de preview personalizada, subirla
      if (videoCoverImages && videoCoverImages[i]) {
        const coverImage = videoCoverImages[i];

        if (coverImage instanceof File) {
          // Subir imagen de preview personalizada
          const previewFormData = new FormData();
          previewFormData.append('file', coverImage);
          previewFormData.append('upload_preset', upload_preset);
          previewFormData.append('resource_type', 'image');
          previewFormData.append('folder', CLOUDINARY_FOLDER);

          const previewResponse = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
            previewFormData,
          );

          if (previewResponse.data && previewResponse.data.secure_url) {
            previewUrl = previewResponse.data.secure_url;
          } else {
            console.error(`❌ Error al subir imagen de preview para video ${i + 1}:`, previewResponse.data);
          }
        } else if (typeof coverImage === 'string') {
          // Ya es una URL de imagen
          previewUrl = coverImage;
        }
      } else {
        // Generar preview automático desde el video usando Cloudinary
        const publicId = videoResponse.data.public_id;
        previewUrl = `https://res.cloudinary.com/${cloud_name}/video/upload/so_1.0,w_400,h_300,c_fill/${publicId}.jpg`;
      }

      uploadedVideos.push({
        link: videoResponse.data.secure_url,
        preview: previewUrl
      });

    } catch (error) {
      console.error(`❌ Error al subir video ${i + 1} (${file.name}):`, error);
      // En caso de error, no agregamos el video a la lista
    }
  }

  const successCount = uploadedVideos.length;
  const failCount = filesArray.length - successCount;
  return uploadedVideos;
};

export const uploadMultipleAudios = async (
  filesArray: File[],
): Promise<(string | null)[]> => {
  // Validar configuración de Cloudinary
  if (!upload_preset || !cloud_name) {
    console.error('❌ Configuración de Cloudinary incompleta:', { upload_preset, cloud_name });
    throw new Error('Configuración de Cloudinary no encontrada. Verifica las variables de entorno.');
  }

  const uploadedUrls: (string | null)[] = [];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', upload_preset);
      formData.append('resource_type', 'video'); // Cloudinary usa 'video' para audios también
      formData.append('folder', CLOUDINARY_FOLDER);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        formData,
      );

      if (response.data && response.data.secure_url) {
        uploadedUrls.push(response.data.secure_url);
      } else {
        console.error(`❌ Respuesta inválida de Cloudinary para audio ${i + 1}:`, response.data);
        uploadedUrls.push(null);
      }
    } catch (error) {
      // Error al subir audio
      console.error(`❌ Error al subir audio ${i + 1} (${file.name}):`, error);
      uploadedUrls.push(null);
    }
  }

  const successCount = uploadedUrls.filter(url => url !== null).length;
  const failCount = uploadedUrls.length - successCount;


  return uploadedUrls;
};
