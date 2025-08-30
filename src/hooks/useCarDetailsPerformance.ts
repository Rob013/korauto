import { useEffect, useCallback, useMemo } from 'react';
import { preloadResource } from '@/utils/performance';

interface CarData {
  images?: string[];
  image?: string;
  make?: string;
  model?: string;
  year?: number;
}

interface UseCarDetailsPerformanceOptions {
  enableImagePreloading?: boolean;
  preloadThumbnails?: boolean;
  enableCaching?: boolean;
}

// Cache for preloaded images
const imagePreloadCache = new Set<string>();

export const useCarDetailsPerformance = (
  car: CarData | null,
  options: UseCarDetailsPerformanceOptions = {}
) => {
  const {
    enableImagePreloading = true,
    preloadThumbnails = true,
    enableCaching = true,
  } = options;

  // Memoize critical images to preload
  const criticalImages = useMemo(() => {
    if (!car) return [];
    
    const images = [];
    
    // Primary image
    if (car.image) {
      images.push(car.image);
    }
    
    // First few gallery images
    if (car.images?.length) {
      images.push(...car.images.slice(0, 3));
    }
    
    return [...new Set(images)]; // Remove duplicates
  }, [car?.image, car?.images]);

  // Preload critical images
  useEffect(() => {
    if (!enableImagePreloading || !criticalImages.length) return;

    const startTime = performance.now();
    let preloadedCount = 0;

    const preloadPromises = criticalImages.map(async (src, index) => {
      if (!src || imagePreloadCache.has(src)) return;

      try {
        // Preload with different priorities
        const priority = index === 0 ? 'high' : 'low';
        
        if ('requestIdleCallback' in window) {
          // Use idle time for non-critical images
          const preloadAction = () => {
            preloadResource(src, 'image');
            imagePreloadCache.add(src);
            preloadedCount++;
          };

          if (index === 0) {
            // Immediate preload for primary image
            preloadAction();
          } else {
            // Idle preload for gallery images
            (window as any).requestIdleCallback(preloadAction, { timeout: 1000 });
          }
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            preloadResource(src, 'image');
            imagePreloadCache.add(src);
            preloadedCount++;
          }, index * 100);
        }
      } catch (error) {
        console.warn('Failed to preload image:', src, error);
      }
    });

    Promise.allSettled(preloadPromises).then(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (preloadedCount > 0) {
        console.log(`⚡ Preloaded ${preloadedCount} images in ${duration.toFixed(2)}ms`);
      }
    });

  }, [criticalImages, enableImagePreloading]);

  // Preload page-specific resources
  const preloadPageResources = useCallback(() => {
    if (!car) return;

    // Preload likely next actions
    const pageName = `${car.make} ${car.model} ${car.year}`;
    
    // Pre-fetch potential contact form dependencies
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // Preload contact form modal resources
        import('@/components/InspectionRequestForm').catch(() => {
          // Ignore errors for optional preload
        });
        
        // Preload WhatsApp functionality
        const whatsappUrl = 'https://wa.me/38348181116';
        preloadResource(whatsappUrl, 'prefetch');
      });
    }
  }, [car?.make, car?.model, car?.year]);

  // Performance monitoring
  const reportPerformanceMetrics = useCallback(() => {
    if (!car || typeof window === 'undefined') return;

    try {
      // Report performance metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      // Only report if we have meaningful data
      if (pageLoadTime > 0 && pageLoadTime < 30000) {
        console.log(`📊 Car details page loaded in ${pageLoadTime.toFixed(2)}ms`);
        
        // Report to analytics in production
        if (process.env.NODE_ENV === 'production' && 'gtag' in window) {
          (window as any).gtag('event', 'page_performance', {
            event_category: 'performance',
            event_label: 'car_details_load_time',
            value: Math.round(pageLoadTime),
            custom_parameters: {
              car_make: car.make,
              car_model: car.model,
              car_year: car.year
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to report performance metrics:', error);
    }
  }, [car?.make, car?.model, car?.year]);

  // Cache management
  const clearImageCache = useCallback(() => {
    if (enableCaching) {
      imagePreloadCache.clear();
    }
  }, [enableCaching]);

  // Initialize performance optimizations
  useEffect(() => {
    if (car) {
      preloadPageResources();
      
      // Report metrics after a short delay to ensure everything is loaded
      const metricsTimer = setTimeout(reportPerformanceMetrics, 1000);
      
      return () => clearTimeout(metricsTimer);
    }
  }, [car, preloadPageResources, reportPerformanceMetrics]);

  return {
    criticalImages,
    clearImageCache,
    preloadedCount: imagePreloadCache.size,
  };
};