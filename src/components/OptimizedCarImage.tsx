import { useState, useEffect, type CSSProperties } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedCarImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  style?: CSSProperties;
}

export const OptimizedCarImage = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-[4/3]',
  priority = false,
  style,
}: OptimizedCarImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setHasError(false);

    // Preload image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoaded(true);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoaded(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <div
      className={`OptimizedCarImage relative ${aspectRatio} w-full overflow-hidden bg-muted ${className}`}
      style={style}
    >
      {/* Skeleton loader */}
      {!isLoaded && (
        <Skeleton className="absolute inset-0" />
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        onError={() => setHasError(true)}
      />

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Imazhi nuk është i disponueshëm
        </div>
      )}
    </div>
  );
};
