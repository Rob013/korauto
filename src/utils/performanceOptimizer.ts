/**
 * Performance optimization utilities for smooth rendering and animations
 */

import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Hook for optimized rendering with intersection observer
 */
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const setElement = useCallback((element: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    elementRef.current = element;

    if (element) {
      observerRef.current = new IntersectionObserver(callback, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      });
      observerRef.current.observe(element);
    }
  }, [callback, options]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return setElement;
};

/**
 * Hook for virtualized rendering with performance optimization
 */
export const useVirtualization = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = {
    start: Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
    end: Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    ),
  };

  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
};

/**
 * Hook for debounced state updates to prevent excessive re-renders
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] => {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(immediateValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [immediateValue, delay]);

  return [immediateValue, debouncedValue, setImmediateValue];
};

/**
 * Hook for optimized list rendering with memoization
 */
export const useOptimizedList = <T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number,
  options: {
    batchSize?: number;
    maxRenderTime?: number;
  } = {}
) => {
  const { batchSize = 20, maxRenderTime = 16 } = options;
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [isRendering, setIsRendering] = useState(false);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (isRendering || !hasMore) return;

    setIsRendering(true);
    const startTime = performance.now();

    const renderBatch = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;

      if (elapsed < maxRenderTime && visibleCount < items.length) {
        setVisibleCount(prev => Math.min(prev + batchSize, items.length));
        requestAnimationFrame(renderBatch);
      } else {
        setIsRendering(false);
      }
    };

    requestAnimationFrame(renderBatch);
  }, [visibleCount, items.length, batchSize, maxRenderTime, isRendering, hasMore]);

  return {
    visibleItems,
    hasMore,
    loadMore,
    isRendering,
    totalCount: items.length,
  };
};

/**
 * Hook for smooth scroll performance
 */
export const useSmoothScroll = () => {
  const scrollToElement = useCallback((
    element: HTMLElement,
    options: ScrollIntoViewOptions = {}
  ) => {
    const defaultOptions: ScrollIntoViewOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
      ...options,
    };

    element.scrollIntoView(defaultOptions);
  }, []);

  const scrollToTop = useCallback((smooth: boolean = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  const scrollToPosition = useCallback((
    x: number,
    y: number,
    smooth: boolean = true
  ) => {
    window.scrollTo({
      left: x,
      top: y,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  return {
    scrollToElement,
    scrollToTop,
    scrollToPosition,
  };
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
  });

  const measureRenderTime = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    setMetrics(prev => ({ ...prev, renderTime: end - start }));
  }, []);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);

    // Monitor memory usage if available
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    const memoryInterval = setInterval(checkMemory, 5000);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(memoryInterval);
    };
  }, []);

  return {
    metrics,
    measureRenderTime,
  };
};

/**
 * Utility for creating optimized CSS classes
 */
export const createOptimizedClasses = (baseClasses: string, conditions: Record<string, boolean>) => {
  const conditionalClasses = Object.entries(conditions)
    .filter(([, condition]) => condition)
    .map(([className]) => className)
    .join(' ');

  return `${baseClasses} ${conditionalClasses}`.trim();
};

/**
 * Utility for throttling function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

/**
 * Utility for creating smooth transitions
 */
export const createSmoothTransition = (
  element: HTMLElement,
  properties: Record<string, string>,
  duration: number = 300
) => {
  const originalTransitions: string[] = [];
  
  // Store original transitions
  Object.keys(properties).forEach(prop => {
    const computedStyle = getComputedStyle(element);
    originalTransitions.push(computedStyle.transition);
  });

  // Apply smooth transition
  element.style.transition = Object.keys(properties)
    .map(prop => `${prop} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`)
    .join(', ');

  // Apply properties
  Object.entries(properties).forEach(([prop, value]) => {
    element.style.setProperty(prop, value);
  });

  // Clean up after animation
  setTimeout(() => {
    element.style.transition = originalTransitions.join(', ');
  }, duration);
};

/**
 * Utility for detecting device capabilities
 */
export const getDeviceCapabilities = () => {
  const isHighRefreshRate = window.matchMedia('(min-resolution: 2dppx)').matches;
  const isLowPowerMode = (navigator as any).connection?.saveData || false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    isHighRefreshRate,
    isLowPowerMode,
    prefersReducedMotion,
    deviceMemory: (navigator as any).deviceMemory || 4,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
  };
};
