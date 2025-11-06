// Performance utilities for optimization

/**
 * Debounce function to limit how often a function can fire
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);
    
    if (callNow) func(...args);
  };
};

/**
 * Throttle function to limit how often a function can fire
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Intersection Observer for lazy loading
 */
export const createIntersectionObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, defaultOptions);
};

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

/**
 * Batch DOM updates to avoid layout thrashing
 */
export const batchDOMUpdates = (callback: () => void) => {
  requestAnimationFrame(callback);
};

/**
 * Check if we're in a fast connection
 */
export const isFastConnection = (): boolean => {
  const connection = (navigator as any).connection;
  if (!connection) return true; // Assume fast if not supported
  
  return connection.effectiveType === '4g' || connection.downlink > 1.5;
};

/**
 * Optimize images based on device capabilities and connection
 */
export const getOptimizedImageUrl = (url: string, width: number, quality = 80): string => {
  if (!url) return '';
  
  // If it's already optimized or local, return as is
  if (url.includes('?') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  
  // Adjust quality based on connection speed
  const effectiveQuality = isFastConnection() ? quality : Math.min(quality, 60);
  
  // For external images, you could add query parameters for optimization
  // This is a placeholder - adjust based on your image service
  return `${url}?w=${width}&q=${effectiveQuality}&auto=format,compress`;
};

/**
 * Memoization utility for expensive computations
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
};

/**
 * Virtual scrolling utility for large lists
 */
export const createVirtualScrollConfig = (itemHeight: number, containerHeight: number) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferSize = Math.min(5, Math.ceil(visibleCount * 0.3));
  
  return {
    itemHeight,
    visibleCount,
    bufferSize,
    overscan: bufferSize
  };
};

/**
 * Performance measurement utility
 */
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  return async () => {
    const startTime = performance.now();
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
      
      // Report to analytics in production
      if (process.env.NODE_ENV === 'production' && 'analytics' in window) {
        (window as any).analytics?.track('Performance Metric', {
          name,
          duration,
          timestamp: Date.now()
        });
      }
    }
  };
};

/**
 * Prevent forced reflows by batching DOM reads and writes
 */
export const batchDOMOperations = (() => {
  let readQueue: Array<() => void> = [];
  let writeQueue: Array<() => void> = [];
  let scheduled = false;

  const flush = () => {
    // Execute all reads first
    const reads = readQueue;
    readQueue = [];
    reads.forEach(fn => fn());

    // Then execute all writes
    const writes = writeQueue;
    writeQueue = [];
    writes.forEach(fn => fn());

    scheduled = false;
  };

  return {
    read: (fn: () => void) => {
      readQueue.push(fn);
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    },
    write: (fn: () => void) => {
      writeQueue.push(fn);
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    }
  };
})();

/**
 * Cache DOM measurements to avoid repeated reflows
 */
export class DOMCache {
  private cache = new Map<string, any>();
  private rafId: number | null = null;

  get<T>(key: string, getter: () => T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const value = getter();
    this.cache.set(key, value);
    this.scheduleInvalidation();
    return value;
  }

  invalidate() {
    this.cache.clear();
  }

  private scheduleInvalidation() {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.invalidate();
      this.rafId = null;
    });
  }
}

/**
 * Safe scroll position getter that prevents forced reflows
 */
export const getScrollPosition = (() => {
  let cached = { x: 0, y: 0 };
  let ticking = false;

  const update = () => {
    cached = {
      x: window.pageXOffset,
      y: window.pageYOffset
    };
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  return () => cached;
})();

export default {
  debounce,
  throttle,
  createIntersectionObserver,
  preloadResource,
  batchDOMUpdates,
  batchDOMOperations,
  isFastConnection,
  getOptimizedImageUrl,
  memoize,
  createVirtualScrollConfig,
  measurePerformance,
  DOMCache,
  getScrollPosition
};