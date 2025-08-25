import { useEffect, useCallback } from 'react';
import { preloadResource } from '@/utils/performance';

interface ResourcePreloadOptions {
  enabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Hook for preloading critical resources to improve performance
 */
export const useResourcePreloader = () => {
  
  const preloadCriticalAssets = useCallback((options: ResourcePreloadOptions = {}) => {
    const { enabled = true, priority = 'high' } = options;
    
    if (!enabled) return;

    // Preload critical fonts
    const fontLinks = [
      '/fonts/inter-var.woff2',
      '/fonts/geist-sans.woff2'
    ];

    fontLinks.forEach(href => {
      const existingLink = document.head.querySelector(`link[href="${href}"]`);
      if (!existingLink) {
        preloadResource(href, 'font', 'font/woff2');
      }
    });

    // Preload critical CSS for faster rendering
    const criticalStyles = document.head.querySelector('style[data-critical]');
    if (!criticalStyles) {
      const style = document.createElement('style');
      style.setAttribute('data-critical', 'true');
      style.textContent = `
        /* Critical above-the-fold styles */
        .loading-skeleton { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .image-placeholder { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); }
      `;
      document.head.appendChild(style);
    }

    // Preload important images based on connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.effectiveType === '4g' || connection?.downlink > 2) {
        // High-quality connection, preload hero images
        const heroImages = [
          '/images/hero-car.jpg',
          '/images/catalog-preview.jpg'
        ];
        
        heroImages.forEach(src => {
          preloadResource(src, 'image');
        });
      }
    }
  }, []);

  const preloadRouteResources = useCallback((routeName: string) => {
    // Preload resources specific to certain routes
    const routeResources: Record<string, string[]> = {
      'catalog': [
        '/api/manufacturers',
        '/api/car-models'
      ],
      'car-details': [
        '/api/car-images',
        '/api/inspection-data'
      ],
      'admin': [
        '/api/admin-dashboard',
        '/api/analytics'
      ]
    };

    const resources = routeResources[routeName] || [];
    resources.forEach(url => {
      // Use fetch to preload API responses into browser cache
      fetch(url, { 
        method: 'GET',
        headers: { 'Cache-Control': 'max-age=300' }
      }).catch(() => {
        // Silently fail - preloading is best effort
      });
    });
  }, []);

  const preloadNextPageResources = useCallback((currentPage: number, totalPages: number) => {
    // Preload next page of results if available
    if (currentPage < totalPages) {
      const nextPageUrl = `/api/cars?page=${currentPage + 1}`;
      fetch(nextPageUrl, {
        method: 'GET',
        headers: { 'Cache-Control': 'max-age=300' }
      }).catch(() => {
        // Silently fail - preloading is best effort
      });
    }
  }, []);

  // Auto-preload critical assets on hook initialization (delayed to avoid warnings)
  useEffect(() => {
    // Use requestIdleCallback for non-critical preloading with longer delay
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        // Add delay to ensure fonts/images are actually needed
        setTimeout(() => {
          preloadCriticalAssets();
        }, 3000); // Wait 3 seconds before preloading
      });
    } else {
      // Fallback for browsers without requestIdleCallback - longer delay
      setTimeout(() => {
        preloadCriticalAssets();
      }, 5000);
    }
  }, [preloadCriticalAssets]);

  return {
    preloadCriticalAssets,
    preloadRouteResources,
    preloadNextPageResources
  };
};

export default useResourcePreloader;