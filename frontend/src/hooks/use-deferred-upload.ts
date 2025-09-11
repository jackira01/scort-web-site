import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface PendingFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const useDeferredUpload = () => {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Agregar archivo para subida diferida
  const addPendingFile = useCallback((file: File, type: 'image' | 'video' = 'image') => {
    const id = Math.random().toString(36).substr(2, 9);
    const preview = URL.createObjectURL(file);
    
    const pendingFile: PendingFile = {
      id,
      file,
      preview,
      type
    };

    setPendingFiles(prev => [...prev, pendingFile]);
    return { id, preview };
  }, []);

  // Remover archivo pendiente
  const removePendingFile = useCallback((id: string) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Subir archivo individual a Cloudinary
  const uploadSingleFile = async (file: File, folder: string = 'blog-images'): Promise<UploadResult> => {
    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('Solo se permiten archivos de imagen o video');
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. Máximo 10MB.');
      }

      const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
      const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "";

      if (!upload_preset || !cloud_name) {
        throw new Error('Configuración de Cloudinary no encontrada');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', upload_preset);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/${file.type.startsWith('video/') ? 'video' : 'image'}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir el archivo a Cloudinary');
      }

      const result = await response.json();
      
      return {
        success: true,
        url: result.secure_url
      };
    } catch (error) {
      console.error('Error al subir archivo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir el archivo'
      };
    }
  };

  // Subir todos los archivos pendientes
  const uploadAllPendingFiles = async (folder: string = 'blog-images'): Promise<{ [key: string]: string }> => {
    if (pendingFiles.length === 0) {
      return {};
    }

    setIsUploading(true);
    const uploadedUrls: { [key: string]: string } = {};
    
    try {
      toast.loading(`Subiendo ${pendingFiles.length} archivo(s)...`);
      
      for (const pendingFile of pendingFiles) {
        const result = await uploadSingleFile(pendingFile.file, folder);
        
        if (result.success && result.url) {
          uploadedUrls[pendingFile.id] = result.url;
        } else {
          throw new Error(result.error || `Error al subir ${pendingFile.file.name}`);
        }
      }
      
      toast.success(`${pendingFiles.length} archivo(s) subido(s) exitosamente`);
      
      // Limpiar archivos pendientes después de subir
      clearPendingFiles();
      
      return uploadedUrls;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir archivos';
      toast.error(`Error al subir archivos: ${errorMessage}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Función para procesar contenido del editor y reemplazar URLs temporales
  const processEditorContent = (content: any, uploadedUrls: Record<string, string>): any => {
    if (!content || !content.blocks) return content;

    const processedBlocks = content.blocks.map((block: any) => {
      if (block.type === 'image' && block.data?.file?.pendingId) {
        const pendingId = block.data.file.pendingId;
        const uploadedUrl = uploadedUrls[pendingId];
        
        if (uploadedUrl) {
          return {
            ...block,
            data: {
              ...block.data,
              file: {
                ...block.data.file,
                url: uploadedUrl,
                // Remover el pendingId ya que ya no es necesario
                pendingId: undefined
              }
            }
          };
        }
      }
      return block;
    });

    return {
      ...content,
      blocks: processedBlocks
    };
  };

  // Limpiar todos los archivos pendientes
  const clearPendingFiles = useCallback(() => {
    setPendingFiles(prev => {
      prev.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
      return [];
    });
  }, []);

  // Obtener URL de preview para un archivo pendiente
  const getPreviewUrl = useCallback((id: string) => {
    return pendingFiles.find(f => f.id === id)?.preview;
  }, [pendingFiles]);

  return {
    pendingFiles,
    isUploading,
    addPendingFile,
    removePendingFile,
    uploadAllPendingFiles,
    clearPendingFiles,
    getPreviewUrl,
    uploadSingleFile,
    processEditorContent
  };
};