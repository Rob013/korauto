import React, { useEffect, useRef, useState } from 'react';
import { optimizeImageUrl, getGlobalLazyLoader } from '@/utils/imageOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
  enableLazyLoad?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  quality = 85,
  format = 'auto',
  width = 300,
  height = 200,
  enableLazyLoad = true,
  onLoad,
  onError,
  ...props
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Optimize the image URL
  const optimizedSrc = src ? optimizeImageUrl(src, { quality, format }) : '';

  useEffect(() => {
    if (!src) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    if (enableLazyLoad && !priority) {
      // Use lazy loading
      const lazyLoader = getGlobalLazyLoader();
      img.dataset.src = optimizedSrc;
      img.classList.add('loading');
      lazyLoader.observe(img);
    } else {
      // Load immediately
      img.src = optimizedSrc;
    }
  }, [optimizedSrc, enableLazyLoad, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setIsLoading(false);
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      {(isLoading || (!isLoaded && !isError)) && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center"
          style={{ 
            aspectRatio: `${width}/${height}`,
            minHeight: `${height}px`
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
            aspectRatio: `${width}/${height}`,
            minHeight: `${height}px`
          }}
        >
          <div className="text-xs text-muted-foreground">Image failed to load</div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 mobile-optimized-image ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          aspectRatio: `${width}/${height}`,
          objectFit: 'cover',
          minHeight: `${height}px`,
          backgroundColor: 'hsl(var(--muted))'
        }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        width={width}
        height={height}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;