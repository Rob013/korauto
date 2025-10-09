import { useEffect, useCallback, useRef } from 'react';

interface UseOptimizedScrollOptions {
  onScroll?: () => void;
  throttle?: number;
  enableMomentum?: boolean;
}

/**
 * Optimized scroll hook for better performance
 * Uses requestAnimationFrame for smooth 120fps scrolling
 */
export const useOptimizedScroll = (options: UseOptimizedScrollOptions = {}) => {
  const { onScroll, throttle = 16, enableMomentum = true } = options;
  const rafIdRef = useRef<number | null>(null);
  const lastScrollRef = useRef<number>(0);

  const handleScroll = useCallback(() => {
    if (rafIdRef.current !== null) {
      return;
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const now = performance.now();
      
      if (now - lastScrollRef.current >= throttle) {
        onScroll?.();
        lastScrollRef.current = now;
      }
      
      rafIdRef.current = null;
    });
  }, [onScroll, throttle]);

  useEffect(() => {
    if (enableMomentum && document.body) {
      // Enable momentum scrolling on iOS
      (document.body.style as any).webkitOverflowScrolling = 'touch';
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll, enableMomentum]);

  return {
    scrollY: window.scrollY,
    isScrolling: rafIdRef.current !== null
  };
};

/**
 * Hook for smooth scroll to top with animation
 */
export const useSmoothScrollToTop = () => {
  const scrollToTop = useCallback((duration: number = 600) => {
    const startY = window.scrollY;
    const startTime = performance.now();

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 
        ? 4 * t * t * t 
        : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const scroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startY * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(scroll);
  }, []);

  return { scrollToTop };
};
