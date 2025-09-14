import { useEffect, useCallback, useRef } from 'react';
import { preloadResource, isFastConnection, getOptimizedImageUrl } from '@/utils/performance';

interface ResourcePreloadOptions {
  enabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
  delay?: number;
}

interface PreloadedResource {
  url: string;
  type: string;
  timestamp: number;
  priority: string;
}

/**
 * Enhanced hook for intelligent resource preloading to improve performance
 */
export const useResourcePreloader = () => {
  const preloadedResources = useRef<Set<string>>(new Set());
  const preloadHistory = useRef<PreloadedResource[]>([]);
  const connectionType = useRef<string>('unknown');

  // Initialize connection monitoring
  useEffect(() => {
    const updateConnection = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        connectionType.current = connection.effectiveType || 'unknown';
      }
    };

    updateConnection();
    
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', updateConnection);
      return () => {
        (navigator as any).connection?.removeEventListener('change', updateConnection);
      };
    }
  }, []);
  
  const shouldPreload = useCallback((resource: string, type: string): boolean => {
    // Don't preload if already preloaded
    if (preloadedResources.current.has(resource)) {
      return false;
    }

    // Check connection quality
    const connection = (navigator as any).connection;
    if (connection) {
      // Don't preload on slow connections
      if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return false;
      }
      
      // Limit image preloading on medium connections
      if (type === 'image' && connection.effectiveType === '3g') {
        return Math.random() < 0.5; // 50% chance for images on 3G
      }
    }

    return true;
  }, []);

  const trackPreload = useCallback((url: string, type: string, priority: string) => {
    preloadedResources.current.add(url);
    preloadHistory.current.push({
      url,
      type,
      timestamp: Date.now(),
      priority
    });

    // Keep history limited
    if (preloadHistory.current.length > 100) {
      preloadHistory.current.shift();
    }
  }, []);

  const preloadCriticalAssets = useCallback((options: ResourcePreloadOptions = {}) => {
    const { enabled = true, priority = 'high', delay = 0 } = options;
    
    if (!enabled) return;

    const executePreload = () => {
      // Preload critical fonts with better detection
      const fontLinks = [
        '/fonts/inter-var.woff2',
        '/fonts/geist-sans.woff2'
      ];

      fontLinks.forEach(href => {
        if (shouldPreload(href, 'font')) {
          const existingLink = document.head.querySelector(`link[href="${href}"]`);
          if (!existingLink) {
            preloadResource(href, 'font', 'font/woff2', priority as any);
            trackPreload(href, 'font', priority);
          }
        }
      });

      // Preload critical CSS for faster rendering
      const criticalStyles = document.head.querySelector('style[data-critical]');
      if (!criticalStyles) {
        const style = document.createElement('style');
        style.setAttribute('data-critical', 'true');
        style.textContent = `
          /* Critical above-the-fold styles for instant loading */
          .loading-skeleton { 
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted) / 0.5) 50%, hsl(var(--muted)) 75%);
            background-size: 200% 100%;
          }
          .image-placeholder { 
            background: linear-gradient(90deg, hsl(var(--muted)), hsl(var(--muted) / 0.8), hsl(var(--muted)));
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .performance-optimized {
            contain: layout style paint;
            will-change: auto;
          }
        `;
        document.head.appendChild(style);
      }

      // Smart image preloading based on connection and viewport
      if (isFastConnection()) {
        const heroImages = [
          '/images/hero-car.webp',
          '/images/catalog-preview.webp',
          '/images/logo.webp'
        ];
        
        heroImages.forEach(src => {
          if (shouldPreload(src, 'image')) {
            // Use optimized image URLs
            const optimizedSrc = getOptimizedImageUrl(src, 1200, 85, 'webp');
            preloadResource(optimizedSrc, 'image', undefined, priority as any);
            trackPreload(optimizedSrc, 'image', priority);
          }
        });
      }

      // Preload critical API endpoints
      const criticalEndpoints = [
        '/api/status',
        '/api/manufacturers'
      ];

      criticalEndpoints.forEach(endpoint => {
        if (shouldPreload(endpoint, 'fetch')) {
          fetch(endpoint, { 
            method: 'HEAD',
            headers: { 'Cache-Control': 'max-age=300' }
          }).then(() => {
            trackPreload(endpoint, 'api', priority);
          }).catch(() => {
            // Silently fail
          });
        }
      });
    };

    if (delay > 0) {
      setTimeout(executePreload, delay);
    } else {
      executePreload();
    }
  }, [shouldPreload, trackPreload]);

  const preloadRouteResources = useCallback((routeName: string, options: ResourcePreloadOptions = {}) => {
    const { priority = 'medium' } = options;

    // Smart route-based preloading
    const routeResources: Record<string, Array<{ url: string; type: string }>> = {
      'catalog': [
        { url: '/api/manufacturers', type: 'api' },
        { url: '/api/models', type: 'api' },
        { url: '/api/filters', type: 'api' }
      ],
      'car-details': [
        { url: '/api/car-images', type: 'api' },
        { url: '/api/inspection-data', type: 'api' }
      ],
      'admin': [
        { url: '/api/admin-dashboard', type: 'api' },
        { url: '/api/analytics', type: 'api' },
        { url: '/api/sync-status', type: 'api' }
      ]
    };

    const resources = routeResources[routeName] || [];
    
    resources.forEach(({ url, type }) => {
      if (shouldPreload(url, type)) {
        // Use fetch to preload API responses into browser cache
        fetch(url, { 
          method: 'GET',
          headers: { 
            'Cache-Control': 'max-age=300',
            'Accept': 'application/json'
          }
        }).then(() => {
          trackPreload(url, type, priority);
        }).catch(() => {
          // Silently fail - preloading is best effort
        });
      }
    });
  }, [shouldPreload, trackPreload]);

  const preloadNextPageResources = useCallback((currentPage: number, totalPages: number, baseUrl = '/api/cars') => {
    // Smart next page preloading
    if (currentPage < totalPages && isFastConnection()) {
      const nextPageUrl = `${baseUrl}?page=${currentPage + 1}`;
      
      if (shouldPreload(nextPageUrl, 'api')) {
        fetch(nextPageUrl, {
          method: 'GET',
          headers: { 
            'Cache-Control': 'max-age=300',
            'Accept': 'application/json'
          }
        }).then(() => {
          trackPreload(nextPageUrl, 'api', 'low');
        }).catch(() => {
          // Silently fail
        });
      }
    }
  }, [shouldPreload, trackPreload]);

  // Preload images in viewport with Intersection Observer
  const preloadImagesInViewport = useCallback((threshold = 0.1) => {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src && shouldPreload(src, 'image')) {
              img.src = getOptimizedImageUrl(src, img.width || 400, 80);
              img.removeAttribute('data-src');
              trackPreload(src, 'image', 'medium');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      { 
        rootMargin: '50px',
        threshold 
      }
    );

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });

    return () => imageObserver.disconnect();
  }, [shouldPreload, trackPreload]);

  // Get preload statistics
  const getPreloadStats = useCallback(() => {
    const stats = {
      totalPreloaded: preloadHistory.current.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      connectionType: connectionType.current
    };

    preloadHistory.current.forEach(({ type, priority }) => {
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    return stats;
  }, []);

  // Auto-preload critical assets on hook initialization
  useEffect(() => {
    // Use requestIdleCallback for non-critical preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadCriticalAssets({ delay: 2000 }); // Wait 2 seconds
      }, { timeout: 10000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        preloadCriticalAssets({ delay: 3000 });
      }, 3000);
    }
  }, [preloadCriticalAssets]);

  return {
    preloadCriticalAssets,
    preloadRouteResources,
    preloadNextPageResources,
    preloadImagesInViewport,
    getPreloadStats
  };
};

export default useResourcePreloader;