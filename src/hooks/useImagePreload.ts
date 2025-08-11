import { useState, useEffect, useRef, useMemo } from 'react';
import { createIntersectionObserver, getOptimizedImageUrl, preloadResource } from '@/utils/performance';

// Image cache to prevent redundant loads
const imageCache = new Map<string, boolean>();

interface UseImagePreloadOptions {
  priority?: boolean;
  quality?: number;
  width?: number;
  enableLazyLoad?: boolean;
  enableProgressiveLoad?: boolean;
}

export const useImagePreload = (
  imageSrc: string | undefined,
  options: UseImagePreloadOptions = {}
) => {
  const {
    priority = false,
    quality = 80,
    width = 300,
    enableLazyLoad = true,
    enableProgressiveLoad = true
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Memoize optimized URL to prevent recalculation
  const optimizedSrc = useMemo(() => {
    if (!imageSrc) return '';
    return getOptimizedImageUrl(imageSrc, width, quality);
  }, [imageSrc, width, quality]);

  // Check cache first
  useEffect(() => {
    if (!optimizedSrc) {
      setIsLoaded(true);
      return;
    }

    // If image is already cached, mark as loaded immediately
    if (imageCache.has(optimizedSrc)) {
      setIsLoaded(true);
      setIsError(false);
      return;
    }

    // Preload critical images immediately
    if (priority) {
      preloadResource(optimizedSrc, 'image');
    }
  }, [optimizedSrc, priority]);

  // Set up lazy loading with Intersection Observer
  useEffect(() => {
    if (!optimizedSrc || !enableLazyLoad || priority || imageCache.has(optimizedSrc)) return;

    const loadImage = () => {
      setIsLoading(true);
      setIsError(false);

      const img = new Image();
      
      // Progressive loading - load low quality first
      if (enableProgressiveLoad) {
        const lowQualityUrl = getOptimizedImageUrl(imageSrc!, width, 20);
        const lowQualityImg = new Image();
        
        lowQualityImg.onload = () => {
          if (imgRef.current) {
            imgRef.current.src = lowQualityUrl;
            imgRef.current.style.filter = 'blur(5px)';
          }
        };
        lowQualityImg.src = lowQualityUrl;
      }

      const handleLoad = () => {
        setIsLoaded(true);
        setIsLoading(false);
        setIsError(false);
        imageCache.set(optimizedSrc, true); // Cache successful load
        
        if (imgRef.current) {
          imgRef.current.src = optimizedSrc;
          imgRef.current.style.filter = 'none';
          imgRef.current.style.transition = 'filter 0.3s ease';
        }
      };

      const handleError = () => {
        setIsError(true);
        setIsLoading(false);
        setIsLoaded(false);
        imageCache.set(optimizedSrc, false); // Cache failed load
      };

      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
      img.src = optimizedSrc;

      return () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
    };

    // Create intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      observerRef.current = createIntersectionObserver(
        (entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observerRef.current?.disconnect();
          }
        },
        { rootMargin: '50px' }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Fallback for browsers without IntersectionObserver
      loadImage();
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [optimizedSrc, enableLazyLoad, priority, imageSrc, width, enableProgressiveLoad]);

  // Load immediately if priority or lazy loading disabled
  useEffect(() => {
    if (!optimizedSrc || (!priority && enableLazyLoad) || imageCache.has(optimizedSrc)) return;

    setIsLoading(true);
    setIsError(false);

    const img = new Image();
    
    const handleLoad = () => {
      setIsLoaded(true);
      setIsLoading(false);
      setIsError(false);
      imageCache.set(optimizedSrc, true); // Cache successful load
    };
    
    const handleError = () => {
      setIsError(true);
      setIsLoading(false);
      setIsLoaded(false);
      imageCache.set(optimizedSrc, false); // Cache failed load
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = optimizedSrc;

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [optimizedSrc, priority, enableLazyLoad]);

  return {
    imgRef,
    isLoaded,
    isError,
    isLoading,
    optimizedSrc: optimizedSrc || imageSrc || '',
    shouldShowPlaceholder: isLoading || (!isLoaded && !isError)
  };
};

export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach(url => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

export default useImagePreload;