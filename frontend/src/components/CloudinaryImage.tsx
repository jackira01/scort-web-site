'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onClick?: () => void;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

export const CloudinaryImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  onClick,
  quality = 80,
  format = 'auto'
}: CloudinaryImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Función para optimizar URLs de Cloudinary
  const optimizeCloudinaryUrl = (url: string) => {
    if (!url.includes('res.cloudinary.com')) {
      return url;
    }

    // Extraer la parte después de /upload/
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const beforeUpload = url.substring(0, uploadIndex + 8); // incluye '/upload/'
    const afterUpload = url.substring(uploadIndex + 8);

    // Agregar transformaciones de optimización
    const transformations = [
      `w_${width}`,
      `h_${height}`,
      `c_fill`,
      `f_${format}`,
      `q_${quality}`,
      'fl_progressive',
      'fl_immutable_cache'
    ].join(',');

    return `${beforeUpload}${transformations}/${afterUpload}`;
  };

  const optimizedSrc = optimizeCloudinaryUrl(src);

  if (fallbackError) {
    return (
      <div 
        className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm`}
        style={{ width, height }}
      >
        Error al cargar imagen
      </div>
    );
  }

  if (imageError) {
    return (
      <div 
        className={`cursor-pointer ${className}`}
        onClick={onClick}
        style={{ width, height, display: 'inline-block' }}
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover"
          onError={() => setFallbackError(true)}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div 
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      style={{ width, height, display: 'inline-block' }}
    >
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        quality={quality}
        onError={() => setImageError(true)}
        unoptimized={false}
        priority={false}
      />
    </div>
  );
};

export default CloudinaryImage;