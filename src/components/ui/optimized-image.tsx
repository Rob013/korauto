import React, { useState, useEffect, useRef, memo } from 'react';
import { Skeleton } from './skeleton';
import { getOptimizedImageUrl, createIntersectionObserver } from '@/utils/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage = memo<OptimizedImageProps>(({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  priority = false,
  placeholder = '/placeholder.svg',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!src) {
      setIsError(true);
      return;
    }

    // If priority is true, load immediately
    if (priority) {
      setCurrentSrc(getOptimizedImageUrl(src, width || 800, quality));
      return;
    }

    // Set up intersection observer for lazy loading
    if (!isInView && imgRef.current) {
      observerRef.current = createIntersectionObserver(
        (entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setCurrentSrc(getOptimizedImageUrl(src, width || 800, quality));
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        },
        { rootMargin: '50px' }
      );

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority, isInView, width, quality]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(true);
    setCurrentSrc(placeholder);
    onError?.();
  };

  // Show skeleton while loading
  if (!isInView && !priority) {
    return (
      <div ref={imgRef} className={`${className} bg-muted`}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Show error placeholder
  if (isError && !currentSrc) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <span className="text-muted-foreground text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading skeleton */}
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={currentSrc || placeholder}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage }; 