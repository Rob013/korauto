import { useEffect, useRef, useState, useCallback } from 'react';

interface UseOptimizedIntersectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export const useOptimizedIntersection = (
  options: UseOptimizedIntersectionOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    delay = 0
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
      if (delay > 0) {
        // Use requestIdleCallback for better performance
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            setIsIntersecting(true);
            setHasTriggered(true);
          });
        } else {
          setTimeout(() => {
            setIsIntersecting(true);
            setHasTriggered(true);
          }, delay);
        }
      } else {
        setIsIntersecting(true);
        setHasTriggered(true);
      }

      if (triggerOnce && observerRef.current) {
        observerRef.current.disconnect();
      }
    } else if (!entry.isIntersecting && !triggerOnce) {
      setIsIntersecting(false);
    }
  }, [triggerOnce, hasTriggered, delay]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // Create observer with optimized settings
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      // Use passive scrolling for better performance
    });

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    targetRef,
    isIntersecting,
    hasTriggered
  };
};

// Hook specifically for lazy loading images with better mobile performance
export const useLazyImageLoading = (src?: string) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { targetRef, isIntersecting } = useOptimizedIntersection({
    rootMargin: '100px', // Load images earlier on mobile
    triggerOnce: true
  });

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true); // Still set loaded to show placeholder
  }, []);

  const shouldLoadImage = isIntersecting && src && !imageError;
  const imageSrc = shouldLoadImage ? src : undefined;

  return {
    targetRef,
    imageSrc,
    imageLoaded,
    imageError,
    handleLoad,
    handleError,
    shouldShowPlaceholder: !imageLoaded || imageError
  };
};

export default useOptimizedIntersection;