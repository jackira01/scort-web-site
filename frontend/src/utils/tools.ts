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
    console.error('Error al comprimir imagen:', error);
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
      console.error(`Error al subir ${file.name}:`, error);
      uploadedUrls.push(null); // O maneja según tu lógica
    }
  }

  return uploadedUrls;
};
