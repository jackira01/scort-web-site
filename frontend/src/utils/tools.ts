import axios from 'axios';
import { applyWatermarkToImage } from './watermark';
import { ProcessedImageResult } from './imageProcessor';

const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "";

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

  /* CÓDIGO ORIGINAL COMENTADO
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

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
  */
};


/**
 * Comprime una imagen manteniendo calidad aceptable
 * TEMPORALMENTE COMENTADO - No comprimir imágenes
 */
export const compressImage = async (file: File): Promise<File> => {
  // COMENTADO TEMPORALMENTE - Devolver archivo original sin comprimir
  return file;

  /* CÓDIGO ORIGINAL COMENTADO
  const options = {
    maxSizeMB: 1, // máximo 1MB
    maxWidthOrHeight: 1280, // permitir hasta 1280px para mantener la resolución original
    useWebWorker: true,
    preserveExif: false, // remover metadatos para reducir tamaño
    initialQuality: 0.9, // calidad inicial más alta
  };
  try {
    const imageCompression = await loadImageCompression();
    return await imageCompression(file, options);
  } catch {
    // Error al comprimir imagen
    return file; // si falla, sigue con el original
  }
  */
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
      console.log(`📤 Subiendo imagen ${i + 1}/${filesArray.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

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

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );

      if (response.data && response.data.secure_url) {
        uploadedUrls.push(response.data.secure_url);
        console.log(`✅ Imagen ${i + 1} subida exitosamente: ${response.data.secure_url}`);
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

  console.log(`📊 Resultado subida imágenes: ${successCount} exitosas, ${failCount} fallidas`);

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
      console.log(`📤 Subiendo video ${i + 1}/${filesArray.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // Subir el video
      const videoFormData = new FormData();
      videoFormData.append('file', file);
      videoFormData.append('upload_preset', upload_preset);
      videoFormData.append('resource_type', 'video');

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
          console.log(`📤 Subiendo imagen de preview para video ${i + 1}: ${coverImage.name}`);

          // Subir imagen de preview personalizada
          const previewFormData = new FormData();
          previewFormData.append('file', coverImage);
          previewFormData.append('upload_preset', upload_preset);
          previewFormData.append('resource_type', 'image');

          const previewResponse = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
            previewFormData,
          );

          if (previewResponse.data && previewResponse.data.secure_url) {
            previewUrl = previewResponse.data.secure_url;
            console.log(`✅ Imagen de preview subida exitosamente: ${previewUrl}`);
          } else {
            console.error(`❌ Error al subir imagen de preview para video ${i + 1}:`, previewResponse.data);
          }
        } else if (typeof coverImage === 'string') {
          // Ya es una URL de imagen
          previewUrl = coverImage;
          console.log(`📋 Usando URL existente como preview: ${previewUrl}`);
        }
      } else {
        // Generar preview automático desde el video usando Cloudinary
        const publicId = videoResponse.data.public_id;
        previewUrl = `https://res.cloudinary.com/${cloud_name}/video/upload/so_1.0,w_400,h_300,c_fill/${publicId}.jpg`;
        console.log(`🎬 Generando preview automático: ${previewUrl}`);
      }

      uploadedVideos.push({
        link: videoResponse.data.secure_url,
        preview: previewUrl
      });

      console.log(`✅ Video ${i + 1} subido exitosamente: ${videoResponse.data.secure_url}`);
    } catch (error) {
      console.error(`❌ Error al subir video ${i + 1} (${file.name}):`, error);
      // En caso de error, no agregamos el video a la lista
    }
  }

  const successCount = uploadedVideos.length;
  const failCount = filesArray.length - successCount;

  console.log(`📊 Resultado subida videos: ${successCount} exitosos, ${failCount} fallidos`);

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
      console.log(`📤 Subiendo audio ${i + 1}/${filesArray.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', upload_preset);
      formData.append('resource_type', 'video'); // Cloudinary usa 'video' para audios también

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
        formData,
      );

      if (response.data && response.data.secure_url) {
        uploadedUrls.push(response.data.secure_url);
        console.log(`✅ Audio ${i + 1} subido exitosamente: ${response.data.secure_url}`);
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

  console.log(`📊 Resultado subida audios: ${successCount} exitosos, ${failCount} fallidos`);

  return uploadedUrls;
};
