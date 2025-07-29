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

export default {
  debounce,
  throttle,
  createIntersectionObserver,
  preloadResource,
  batchDOMUpdates,
  isFastConnection,
  getOptimizedImageUrl
};