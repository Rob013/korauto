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
 * Optimize images based on device capabilities
 */
export const getOptimizedImageUrl = (url: string, width: number, quality = 80): string => {
  if (!url) return '';
  
  // If it's already optimized or local, return as is
  if (url.includes('?') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  
  // For external images, you could add query parameters for optimization
  // This is a placeholder - adjust based on your image service
  return `${url}?w=${width}&q=${quality}`;
};

/**
 * Memory-efficient cache with LRU behavior
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Virtual scrolling utilities
 */
export const calculateVisibleRange = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return { startIndex, endIndex };
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);
      
      // Keep only last 100 measurements
      if (this.metrics.get(name)!.length > 100) {
        this.metrics.get(name)!.shift();
      }
    };
  }

  getAverageTime(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return 0;
    return measurements.reduce((a, b) => a + b, 0) / measurements.length;
  }

  logMetrics(): void {
    console.group('Performance Metrics');
    this.metrics.forEach((measurements, name) => {
      const avg = this.getAverageTime(name);
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);
      console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

/**
 * Optimize React rendering with requestIdleCallback
 */
export const scheduleIdleTask = (task: () => void): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(task);
  } else {
    setTimeout(task, 1);
  }
};

/**
 * Preload critical images
 */
export const preloadCriticalImages = (imageUrls: string[]): void => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

/**
 * Optimize scroll performance
 */
export const optimizeScroll = (callback: () => void): (() => void) => {
  let ticking = false;
  
  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
};

/**
 * Memory cleanup utilities
 */
export const cleanupEventListeners = (element: Element, event: string, handler: EventListener): void => {
  element.removeEventListener(event, handler);
};

export const cleanupTimeouts = (timeouts: NodeJS.Timeout[]): void => {
  timeouts.forEach(timeout => clearTimeout(timeout));
};

export const cleanupIntervals = (intervals: NodeJS.Timeout[]): void => {
  intervals.forEach(interval => clearInterval(interval));
};

export default {
  debounce,
  throttle,
  createIntersectionObserver,
  preloadResource,
  batchDOMUpdates,
  isFastConnection,
  getOptimizedImageUrl,
  LRUCache,
  calculateVisibleRange,
  PerformanceMonitor,
  scheduleIdleTask,
  preloadCriticalImages,
  optimizeScroll,
  cleanupEventListeners,
  cleanupTimeouts,
  cleanupIntervals
};