import React, { useEffect } from 'react';
import { useImagePreload } from '@/hooks/useImagePreload';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  width?: number;
  enableLazyLoad?: boolean;
  enableProgressiveLoad?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  quality = 80,
  width = 300,
  enableLazyLoad = true,
  enableProgressiveLoad = true,
  onLoad,
  onError,
  ...props
}) => {
  
  const {
    imgRef,
    isLoaded,
    isError,
    isLoading,
    optimizedSrc,
    shouldShowPlaceholder
  } = useImagePreload(src, {
    priority,
    quality,
    width,
    enableLazyLoad,
    enableProgressiveLoad
  });

  useEffect(() => {
    if (isLoaded && onLoad) onLoad();
    if (isError && onError) onError();
  }, [isLoaded, isError, onLoad, onError]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      {shouldShowPlaceholder && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          style={{ 
            aspectRatio: `${width}/160`,
            minHeight: '160px'
          }}
        >
          {isLoading && (
            <div className="text-xs text-muted-foreground">Loading...</div>
          )}
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div 
          className="absolute inset-0 bg-muted flex items-center justify-center"
          style={{ 
            aspectRatio: `${width}/160`,
            minHeight: '160px'
          }}
        >
          <div className="text-xs text-muted-foreground">Image failed to load</div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={!enableLazyLoad || priority ? optimizedSrc : ''}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 optimized-image ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          aspectRatio: `${width}/160`,
          objectFit: 'cover',
          // Prevent layout shifts
          minHeight: '160px',
          backgroundColor: 'hsl(var(--muted))'
        }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;