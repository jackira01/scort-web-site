'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useLazyImage } from '@/hooks/useLazyLoading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * Componente de imagen optimizado con lazy loading, fallback y placeholder
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/placeholder.svg',
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { elementRef, imageSrc, isLoaded, isError } = useLazyImage(
    priority ? src : currentSrc,
    placeholder
  );

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    
    onError?.();
  }, [currentSrc, fallbackSrc, onError]);

  // Si es priority, usar Next.js Image directamente
  if (priority) {
    return (
      <div ref={elementRef} className={cn('relative overflow-hidden', className)}>
        <Image
          src={hasError ? fallbackSrc : currentSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          sizes={sizes}
          quality={quality}
          priority={true}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            objectFit: fill ? objectFit : undefined,
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">Cargando...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={elementRef} className={cn('relative overflow-hidden', className)}>
      {isLoaded && !isError ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          sizes={sizes}
          quality={quality}
          loading={loading}
          className={cn(
            'transition-opacity duration-300 opacity-100'
          )}
          style={{
            objectFit: fill ? objectFit : undefined,
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {isError ? (
            <span className="text-gray-400 text-sm">Error al cargar</span>
          ) : (
            <span className="text-gray-400 text-sm">Cargando...</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Componente de avatar optimizado
 */
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  alt,
  size = 'md',
  className,
  fallback,
}) => {
  const initials = alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {fallback || initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
      className={cn(
        'rounded-full',
        sizeClasses[size],
        className
      )}
      objectFit="cover"
      quality={80}
    />
  );
};

/**
 * Componente de galería optimizada con lazy loading
 */
interface OptimizedGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
  itemClassName?: string;
  columns?: number;
  gap?: number;
}

export const OptimizedGallery: React.FC<OptimizedGalleryProps> = ({
  images,
  className,
  itemClassName,
  columns = 3,
  gap = 4,
}) => {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${columns}`,
        `gap-${gap}`,
        className
      )}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          width={image.width || 300}
          height={image.height || 200}
          className={cn('w-full h-auto', itemClassName)}
          loading={index < 6 ? 'eager' : 'lazy'} // Cargar las primeras 6 inmediatamente
          priority={index < 3} // Prioridad para las primeras 3
        />
      ))}
    </div>
  );
};