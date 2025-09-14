// Performance utilities for optimization

/**
 * Enhanced debounce function with performance optimizations
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
      if (!immediate) {
        // Use requestIdleCallback for better performance when available
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => func(...args));
        } else {
          func(...args);
        }
      }
    }, wait);
    
    if (callNow) func(...args);
  };
};

/**
 * Enhanced throttle function with frame-based limiting for smooth animations
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  useAnimationFrame = false
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let animationId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      if (useAnimationFrame) {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => func(...args));
      } else {
        func(...args);
      }
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Enhanced intersection observer with performance optimizations
 */
export const createIntersectionObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: [0, 0.1, 0.5, 1.0], // Multiple thresholds for better performance tracking
    ...options
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, defaultOptions);
};

/**
 * Enhanced resource preloading with priority hints
 */
export const preloadResource = (href: string, as: string, type?: string, priority: 'high' | 'low' = 'low') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  // Add fetchpriority for modern browsers
  if ('fetchPriority' in link) {
    (link as any).fetchPriority = priority;
  }
  
  document.head.appendChild(link);
};

/**
 * Batch DOM updates with requestAnimationFrame for optimal performance
 */
export const batchDOMUpdates = (callback: () => void): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      callback();
      resolve();
    });
  });
};

/**
 * Enhanced connection check with detailed network information
 */
export const isFastConnection = (): boolean => {
  const connection = (navigator as any).connection;
  if (!connection) return true; // Assume fast if not supported
  
  // Check for 4G or better effective connection type
  const fastTypes = ['4g', '5g'];
  if (connection.effectiveType && fastTypes.includes(connection.effectiveType)) {
    return true;
  }
  
  // Fallback to downlink speed
  return connection.downlink > 1.5;
};

/**
 * Advanced image optimization with WebP support and responsive sizing
 */
export const getOptimizedImageUrl = (
  url: string, 
  width: number, 
  quality = 80,
  format: 'auto' | 'webp' | 'jpeg' | 'png' = 'auto'
): string => {
  if (!url) return '';
  
  // If it's already optimized or local, return as is
  if (url.includes('?') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  
  // Adjust quality based on connection speed and device pixel ratio
  const devicePixelRatio = window.devicePixelRatio || 1;
  const isRetinaDisplay = devicePixelRatio >= 2;
  const connection = isFastConnection();
  
  let effectiveQuality = quality;
  if (!connection) {
    effectiveQuality = Math.min(quality, 60);
  } else if (isRetinaDisplay && connection) {
    effectiveQuality = Math.min(quality + 10, 90);
  }
  
  // Use WebP for modern browsers if format is auto
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();
  
  const finalFormat = format === 'auto' ? (supportsWebP ? 'webp' : 'jpeg') : format;
  
  // Adjust width for retina displays
  const effectiveWidth = isRetinaDisplay ? width * 2 : width;
  
  return `${url}?w=${effectiveWidth}&q=${effectiveQuality}&fm=${finalFormat}&auto=format,compress`;
};

/**
 * Enhanced memoization with size limits and LRU eviction
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T, maxSize = 100): T => {
  const cache = new Map();
  const accessOrder = new Set();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Update access order for LRU
      accessOrder.delete(key);
      accessOrder.add(key);
      return cache.get(key);
    }
    
    const result = fn(...args);
    
    // Implement LRU eviction
    if (cache.size >= maxSize) {
      const oldestKey = accessOrder.values().next().value;
      cache.delete(oldestKey);
      accessOrder.delete(oldestKey);
    }
    
    cache.set(key, result);
    accessOrder.add(key);
    
    return result;
  }) as T;
};

/**
 * Enhanced virtual scrolling with dynamic height support
 */
export const createVirtualScrollConfig = (
  itemHeight: number, 
  containerHeight: number,
  dynamicHeight = false
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferSize = Math.min(10, Math.ceil(visibleCount * 0.5)); // Increased buffer for smoother scrolling
  
  return {
    itemHeight,
    visibleCount,
    bufferSize,
    overscan: bufferSize,
    dynamicHeight,
    // Enhanced scroll optimization
    scrollBehavior: 'smooth' as const,
    useIsScrolling: true,
    estimatedItemSize: itemHeight
  };
};

/**
 * Enhanced performance measurement with User Timing API
 */
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  return async () => {
    const markStart = `${name}-start`;
    const markEnd = `${name}-end`;
    const measureName = `${name}-duration`;
    
    // Use Performance Timeline API for accurate measurements
    if ('performance' in window && 'mark' in performance) {
      performance.mark(markStart);
    }
    
    const startTime = performance.now();
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if ('performance' in window && 'mark' in performance) {
        performance.mark(markEnd);
        performance.measure(measureName, markStart, markEnd);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
      
      // Report to analytics in production with more context
      if (process.env.NODE_ENV === 'production' && 'analytics' in window) {
        (window as any).analytics?.track('Performance Metric', {
          name,
          duration,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          connection: (navigator as any).connection?.effectiveType || 'unknown'
        });
      }
    }
  };
};

/**
 * Advanced lazy loading with priority support
 */
export const createLazyLoader = (
  threshold = 0.1,
  rootMargin = '50px',
  priority: 'high' | 'normal' | 'low' = 'normal'
) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // Handle images
          if (element.tagName === 'IMG') {
            const img = element as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
          }
          
          // Handle background images
          const bgSrc = element.dataset.bgSrc;
          if (bgSrc) {
            element.style.backgroundImage = `url(${bgSrc})`;
            element.removeAttribute('data-bg-src');
          }
          
          // Trigger custom event for other components
          element.dispatchEvent(new CustomEvent('lazy-loaded', { detail: { priority } }));
          
          observer.unobserve(element);
        }
      });
    },
    { threshold, rootMargin }
  );
  
  return {
    observe: (element: Element) => observer.observe(element),
    unobserve: (element: Element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
};

/**
 * Smart preconnect for external resources
 */
export const preconnectDomains = (domains: string[]) => {
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

/**
 * Resource hints for better loading performance
 */
export const addResourceHints = () => {
  // Preconnect to commonly used domains
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.supabase.co'
  ];
  
  preconnectDomains(domains);
  
  // DNS prefetch for other domains that might be used
  const prefetchDomains = [
    'https://analytics.google.com',
    'https://www.google-analytics.com'
  ];
  
  prefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
};

export default {
  debounce,
  throttle,
  createIntersectionObserver,
  preloadResource,
  batchDOMUpdates,
  isFastConnection,
  getOptimizedImageUrl,
  memoize,
  createVirtualScrollConfig,
  measurePerformance,
  createLazyLoader,
  preconnectDomains,
  addResourceHints
};