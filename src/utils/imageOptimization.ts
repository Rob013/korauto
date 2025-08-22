// Advanced image optimization utilities for 100% mobile performance

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  decode?: 'async' | 'sync' | 'auto';
}

interface OptimizedImageProps extends ImageOptimizationOptions {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Detect supported image formats
 */
export const detectSupportedFormats = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  const supports = {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: false // Will be detected dynamically
  };
  
  // Test AVIF support
  const avifTest = new Image();
  avifTest.onload = () => {
    supports.avif = true;
  };
  avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  
  return supports;
};

/**
 * Get the best image format for the browser
 */
export const getBestImageFormat = (originalSrc: string, format: 'webp' | 'avif' | 'jpg' | 'png' | 'auto' = 'auto'): string => {
  if (format !== 'auto') return format;
  
  const supports = detectSupportedFormats();
  
  // Prefer AVIF > WebP > original format
  if (supports.avif) return 'avif';
  if (supports.webp) return 'webp';
  
  // Return original format
  const extension = originalSrc.split('.').pop()?.toLowerCase();
  return extension === 'jpg' || extension === 'jpeg' ? 'jpg' : 'png';
};

/**
 * Optimize image URL with compression and format conversion
 */
export const optimizeImageUrl = (src: string, options: ImageOptimizationOptions = {}): string => {
  const {
    quality = 85,
    format = 'auto',
    ...rest
  } = options;
  
  // If it's already a data URL or external URL without query params, return as is
  if (src.startsWith('data:') || (!src.includes('?') && !src.includes('/upload/'))) {
    return src;
  }
  
  const url = new URL(src, window.location.origin);
  const bestFormat = getBestImageFormat(src, format);
  
  // Add optimization parameters
  if (bestFormat !== 'auto') {
    url.searchParams.set('f', bestFormat);
  }
  url.searchParams.set('q', quality.toString());
  
  // Add performance optimizations
  url.searchParams.set('auto', 'compress');
  
  return url.toString();
};

/**
 * Generate responsive image sources
 */
export const generateResponsiveSources = (src: string, sizes: number[], options: ImageOptimizationOptions = {}) => {
  const { format = 'auto', quality = 85 } = options;
  const bestFormat = getBestImageFormat(src, format);
  
  return sizes.map(size => {
    const url = new URL(src, window.location.origin);
    url.searchParams.set('w', size.toString());
    if (bestFormat !== 'auto') {
      url.searchParams.set('f', bestFormat);
    }
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('auto', 'compress');
    
    return {
      src: url.toString(),
      width: size
    };
  });
};

/**
 * Advanced intersection observer for lazy loading with preloading
 */
export class AdvancedLazyLoader {
  private observer: IntersectionObserver;
  private preloadObserver: IntersectionObserver;
  private imageCache = new Map<string, boolean>();
  
  constructor() {
    // Main lazy loading observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
    
    // Preload observer for images coming into view soon
    this.preloadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.preloadImage(entry.target as HTMLImageElement);
            this.preloadObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0
      }
    );
  }
  
  observe(img: HTMLImageElement) {
    this.observer.observe(img);
    this.preloadObserver.observe(img);
  }
  
  private async loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (!src) return;
    
    try {
      // Check cache first
      if (this.imageCache.has(src)) {
        img.src = src;
        img.classList.add('loaded');
        return;
      }
      
      // Load image
      await this.loadImagePromise(src);
      this.imageCache.set(src, true);
      
      img.src = src;
      img.classList.add('loaded');
      
      // Remove loading placeholder
      img.classList.remove('loading');
      
    } catch (error) {
      console.warn('Failed to load image:', src, error);
      this.handleImageError(img);
    }
  }
  
  private async preloadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (!src || this.imageCache.has(src)) return;
    
    try {
      await this.loadImagePromise(src);
      this.imageCache.set(src, true);
    } catch (error) {
      console.warn('Failed to preload image:', src, error);
    }
  }
  
  private loadImagePromise(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  private handleImageError(img: HTMLImageElement) {
    // Set fallback image
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23f3f4f6"/%3E%3Ctext x="150" y="100" text-anchor="middle" fill="%23a1a1aa" font-family="Arial" font-size="16"%3EImage unavailable%3C/text%3E%3C/svg%3E';
    img.classList.add('loaded', 'error');
  }
  
  destroy() {
    this.observer.disconnect();
    this.preloadObserver.disconnect();
    this.imageCache.clear();
  }
}

// Global lazy loader instance
let globalLazyLoader: AdvancedLazyLoader | null = null;

export const getGlobalLazyLoader = () => {
  if (!globalLazyLoader) {
    globalLazyLoader = new AdvancedLazyLoader();
  }
  return globalLazyLoader;
};

/**
 * Performance monitoring for images
 */
export const measureImagePerformance = () => {
  const images = document.querySelectorAll('img');
  const metrics = {
    totalImages: images.length,
    loadedImages: 0,
    errorImages: 0,
    loadTimes: [] as number[],
    largestContentfulPaint: 0
  };
  
  // Measure load times
  images.forEach(img => {
    if (img.complete) {
      metrics.loadedImages++;
    } else {
      const startTime = performance.now();
      
      img.addEventListener('load', () => {
        metrics.loadedImages++;
        metrics.loadTimes.push(performance.now() - startTime);
      });
      
      img.addEventListener('error', () => {
        metrics.errorImages++;
      });
    }
  });
  
  // Measure LCP
  if ('PerformanceObserver' in window) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry) {
        metrics.largestContentfulPaint = lastEntry.startTime;
      }
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observation not supported');
    }
  }
  
  return metrics;
};

export default { 
  detectSupportedFormats,
  getBestImageFormat, 
  optimizeImageUrl,
  generateResponsiveSources,
  AdvancedLazyLoader,
  getGlobalLazyLoader,
  measureImagePerformance
};