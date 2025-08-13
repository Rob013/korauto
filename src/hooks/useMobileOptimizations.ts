// @ts-nocheck
import { useEffect, useCallback, useRef } from 'react';
import { debounce, throttle } from '@/utils/performance';

interface MobileOptimizationOptions {
  enableTouchOptimizations?: boolean;
  enableScrollOptimizations?: boolean;
  enableImageOptimizations?: boolean;
  enableReducedMotion?: boolean;
}

/**
 * Hook for mobile-specific performance optimizations
 */
export const useMobileOptimizations = (options: MobileOptimizationOptions = {}) => {
  const {
    enableTouchOptimizations = true,
    enableScrollOptimizations = true,
    enableImageOptimizations = true,
    enableReducedMotion = true,
  } = options;

  useEffect(() => {
    if (!enableTouchOptimizations) return;

    // Improve touch responsiveness
    const fastClickHandler = (e: TouchEvent) => {
      // Prevent 300ms delay on mobile
      if (e.touches.length === 1) {
        const target = e.target as HTMLElement;
        if (target.classList.contains('touch-manipulation')) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', fastClickHandler, { passive: false });

    return () => {
      document.removeEventListener('touchstart', fastClickHandler);
    };
  }, [enableTouchOptimizations]);

  useEffect(() => {
    if (!enableScrollOptimizations) return;

    // Optimize scroll performance
    const scrollContainer = document.documentElement;
    scrollContainer.style.scrollBehavior = 'smooth';

    // Add momentum scrolling for iOS
    document.body.style.webkitOverflowScrolling = 'touch';

    return () => {
      scrollContainer.style.scrollBehavior = '';
      document.body.style.webkitOverflowScrolling = '';
    };
  }, [enableScrollOptimizations]);

  useEffect(() => {
    if (!enableReducedMotion) return;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    // Set initial state
    if (prefersReducedMotion.matches) {
      document.documentElement.classList.add('reduce-motion');
    }

    prefersReducedMotion.addEventListener('change', handleMotionChange);

    return () => {
      prefersReducedMotion.removeEventListener('change', handleMotionChange);
      document.documentElement.classList.remove('reduce-motion');
    };
  }, [enableReducedMotion]);

  // Return utility functions
  return {
    isMobile: useCallback(() => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }, []),
    
    isSlowDevice: useCallback(() => {
      return navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    }, []),
    
    optimizeForDevice: useCallback(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSlowDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
      
      return {
        shouldUseVirtualScroll: isMobile || isSlowDevice,
        shouldLazyLoadImages: true,
        shouldReduceAnimations: isSlowDevice,
        shouldUseLowerQualityImages: isSlowDevice,
      };
    }, []),
  };
};

/**
 * Hook for optimized scroll handling
 */
export const useOptimizedScroll = (onScroll?: (scrollTop: number) => void, delay = 16) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTop = useRef(0);

  const handleScroll = useCallback(
    throttle((e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop || window.pageYOffset;
      
      // Only call if scroll position actually changed
      if (Math.abs(scrollTop - lastScrollTop.current) > 1) {
        lastScrollTop.current = scrollTop;
        onScroll?.(scrollTop);
      }
    }, delay),
    [onScroll, delay]
  );

  return handleScroll;
};

/**
 * Hook for touch gesture optimization
 */
export const useTouchGestures = () => {
  const startY = useRef(0);
  const startTime = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Prevent overscroll on mobile
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    const target = e.target as HTMLElement;
    
    // Check if element is scrollable
    const isScrollable = target.scrollHeight > target.clientHeight;
    
    if (!isScrollable) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const endTime = Date.now();
    const duration = endTime - startTime.current;
    
    // Add swipe gesture detection if needed
    if (duration < 300) {
      // Fast swipe detected
      const deltaY = e.changedTouches[0].clientY - startY.current;
      
      if (Math.abs(deltaY) > 50) {
        // Trigger swipe event
        const event = new CustomEvent('swipe', {
          detail: { direction: deltaY > 0 ? 'down' : 'up', distance: Math.abs(deltaY) }
        });
        e.target?.dispatchEvent(event);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

/**
 * Hook for network-aware optimizations
 */
export const useNetworkOptimizations = () => {
  const getConnectionInfo = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!connection) return { effectiveType: '4g', downlink: 10 };
    
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }, []);

  const isSlowConnection = useCallback(() => {
    const { effectiveType, downlink } = getConnectionInfo();
    return effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5;
  }, [getConnectionInfo]);

  const isFastConnection = useCallback(() => {
    const { effectiveType, downlink } = getConnectionInfo();
    return effectiveType === '4g' && downlink > 2;
  }, [getConnectionInfo]);

  const getOptimalImageQuality = useCallback(() => {
    if (isSlowConnection()) return 50;
    if (isFastConnection()) return 85;
    return 70;
  }, [isSlowConnection, isFastConnection]);

  const getOptimalPageSize = useCallback(() => {
    if (isSlowConnection()) return 10;
    if (isFastConnection()) return 30;
    return 20;
  }, [isSlowConnection, isFastConnection]);

  return {
    getConnectionInfo,
    isSlowConnection,
    isFastConnection,
    getOptimalImageQuality,
    getOptimalPageSize,
  };
};