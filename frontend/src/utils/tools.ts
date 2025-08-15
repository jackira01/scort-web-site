import imageCompression from 'browser-image-compression';
import axios from 'axios';

const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "";


export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.3, // máximo 300KB
    maxWidthOrHeight: 800, // redimensiona si es más grande
    useWebWorker: true,
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
): Promise<(string | null)[]> => {
  const uploadedUrls: (string | null)[] = [];
  for (const file of filesArray) {
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('upload_preset', upload_preset);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );
      uploadedUrls.push(response.data.secure_url);
    } catch (error) {
      // Error al subir archivo
      uploadedUrls.push(null); // O maneja según tu lógica
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
