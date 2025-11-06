import { useEffect, useCallback, useRef, useState } from 'react';
import { 
  createOptimizedScrollHandler, 
  optimizeScrollContainer,
  getScrollBehavior 
} from '@/utils/encarScrollOptimization';

interface UseEncarScrollOptions {
  onScroll?: (data: ScrollData) => void;
  throttle?: number;
  enableOptimizations?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

interface ScrollData {
  scrollY: number;
  scrollDirection: 'up' | 'down';
  scrollSpeed: number;
  isScrolling: boolean;
}

/**
 * High-performance scroll hook inspired by encar.com
 * Optimized for Korean e-commerce style scrolling performance
 */
export const useEncarScroll = (options: UseEncarScrollOptions = {}) => {
  const {
    onScroll,
    throttle = 100,
    enableOptimizations = true,
    containerRef
  } = options;

  const [scrollData, setScrollData] = useState<ScrollData>({
    scrollY: 0,
    scrollDirection: 'down',
    scrollSpeed: 0,
    isScrolling: false
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  // Optimize container on mount
  useEffect(() => {
    if (enableOptimizations) {
      const container = containerRef?.current || document.documentElement;
      if (container) {
        optimizeScrollContainer(container);
      }
    }
  }, [enableOptimizations, containerRef]);

  // Set up optimized scroll handler
  useEffect(() => {
    const handleScrollData = (data: ScrollData) => {
      setScrollData(data);
      onScroll?.(data);
    };

    const { handler, cleanup, options: eventOptions } = createOptimizedScrollHandler(
      handleScrollData,
      { throttle, passive: true }
    );

    window.addEventListener('scroll', handler, eventOptions);
    cleanupRef.current = cleanup;

    return () => {
      window.removeEventListener('scroll', handler);
      cleanup();
    };
  }, [onScroll, throttle]);

  // Smooth scroll to top
  const scrollToTop = useCallback((smooth: boolean = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? getScrollBehavior() : 'auto'
    });
  }, []);

  // Smooth scroll to position
  const scrollToPosition = useCallback((position: number, smooth: boolean = true) => {
    window.scrollTo({
      top: position,
      behavior: smooth ? getScrollBehavior() : 'auto'
    });
  }, []);

  // Smooth scroll to element
  const scrollToElement = useCallback((
    element: HTMLElement | null,
    offset: number = 0,
    smooth: boolean = true
  ) => {
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: smooth ? getScrollBehavior() : 'auto'
    });
  }, []);

  return {
    ...scrollData,
    scrollToTop,
    scrollToPosition,
    scrollToElement
  };
};

/**
 * Hook for detecting scroll direction changes
 * Useful for hiding/showing navigation on scroll
 */
export const useScrollDirection = (threshold: number = 10) => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY.current) < threshold) {
        rafId = null;
        return;
      }

      setScrollDirection(scrollY > lastScrollY.current ? 'down' : 'up');
      setIsScrolled(scrollY > 50);
      lastScrollY.current = scrollY;
      rafId = null;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateScrollDirection);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [threshold]);

  return { scrollDirection, isScrolled };
};
