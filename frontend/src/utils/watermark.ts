/**
 * Utilidades para aplicar marca de agua a imágenes y videos
 */

// Configuración de la marca de agua
const WATERMARK_CONFIG = {
  text: '© ScortWeb',
  fontSize: 24,
  fontFamily: 'Arial',
  color: 'rgba(255, 255, 255, 0.4)',
  position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'
  padding: 20,
};

/**
 * Aplica marca de agua a una imagen usando canvas
 */
export function applyWatermarkToImage(
  file: File,
  watermarkText: string = WATERMARK_CONFIG.text
): Promise<File> {
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

          // Configurar el canvas con las dimensiones de la imagen
          canvas.width = img.width;
          canvas.height = img.height;

          // Dibujar la imagen base
          ctx.drawImage(img, 0, 0);

          // Configurar el estilo de la marca de agua
          ctx.font = `${WATERMARK_CONFIG.fontSize}px ${WATERMARK_CONFIG.fontFamily}`;
          ctx.fillStyle = WATERMARK_CONFIG.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Guardar el estado del contexto
          ctx.save();

          // Rotar el canvas para inclinar el texto en diagonal (-45 grados)
          ctx.rotate(-Math.PI / 4);

          // Calcular el espaciado entre marcas de agua (reducido para más densidad)
          const spacing = WATERMARK_CONFIG.fontSize * 3;

          // Calcular los límites extendidos para cubrir toda el área rotada
          const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
          const startX = -diagonal;
          const endX = diagonal;
          const startY = -diagonal;
          const endY = diagonal;

          // Aplicar patrón diagonal repetido
          for (let x = startX; x < endX; x += spacing) {
            for (let y = startY; y < endY; y += spacing) {
              ctx.fillText(watermarkText, x, y);
            }
          }

          // Restaurar el estado del contexto
          ctx.restore();

          // Convertir el canvas a blob y luego a File
          canvas.toBlob((blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(watermarkedFile);
            } else {
              reject(new Error('Error al generar el blob de la imagen'));
            }
          }, file.type, 0.9); // Calidad del 90%
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = e.target!.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsDataURL(file);
  });
}

// Función de marca de agua para videos removida - los videos ahora se suben sin marca de agua

/**
 * Aplica marca de agua a un archivo según su tipo
 */
export async function applyWatermarkToFile(
  file: File,
  watermarkText?: string
): Promise<File> {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    return applyWatermarkToImage(file, watermarkText);
  } else {
    // Para videos, audios u otros tipos, devolver el archivo original
    return file;
  }
}

/**
 * Aplica marca de agua a múltiples archivos
 */
export async function applyWatermarkToFiles(
  files: File[],
  watermarkText?: string,
  onProgress?: (current: number, total: number) => void
): Promise<File[]> {
  const watermarkedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const watermarkedFile = await applyWatermarkToFile(file, watermarkText);
      watermarkedFiles.push(watermarkedFile);

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Error aplicando marca de agua a ${file.name}:`, error);
      // En caso de error, usar el archivo original
      watermarkedFiles.push(file);
    }
  }

  return watermarkedFiles;
}

/**
 * Verifica si un archivo necesita marca de agua
 */
export function needsWatermark(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Obtiene el texto de marca de agua personalizado para un perfil
 */
export function getProfileWatermarkText(profileName?: string): string {
  if (profileName) {
    return `© ${profileName} - ScortWeb`;
  }
  return WATERMARK_CONFIG.text;
}