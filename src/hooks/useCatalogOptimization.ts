import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce, throttle, LRUCache } from '@/utils/performance';
import { useMeasureOperation } from './use-performance';

interface UseCatalogOptimizationOptions {
  pageSize?: number;
  initialPage?: number;
  cacheSize?: number;
  debounceMs?: number;
  throttleMs?: number;
}

// Global cache for catalog data
const catalogCache = new LRUCache<string, any>(100);

export const useCatalogOptimization = (options: UseCatalogOptimizationOptions = {}) => {
  const {
    pageSize = 20,
    initialPage = 1,
    cacheSize = 100,
    debounceMs = 300,
    throttleMs = 1000,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [items, setItems] = useState<any[]>([]);
  
  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const measureOperation = useMeasureOperation('catalog-load');

  // Debounced search/filter function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string, callback: (results: any[]) => void) => {
      measureOperation(() => {
        // Implement search logic here
        callback([]);
      });
    }, debounceMs),
    [debounceMs, measureOperation]
  );

  // Throttled load more function
  const throttledLoadMore = useCallback(
    throttle(() => {
      if (!loadingRef.current && hasMore) {
        setCurrentPage(prev => prev + 1);
      }
    }, throttleMs),
    [hasMore, throttleMs]
  );

  // Load items for a specific page
  const loadPage = useCallback(async (page: number, searchParams?: any) => {
    const cacheKey = `page-${page}-${JSON.stringify(searchParams)}`;
    const cached = catalogCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await measureOperation(async () => {
        // Implement your API call here
        // const response = await fetch(`/api/cars?page=${page}&limit=${pageSize}&${new URLSearchParams(searchParams)}`);
        // return response.json();
        
        // Placeholder implementation
        return {
          items: [],
          total: 0,
          hasMore: false,
        };
      });

      // Cache the result
      catalogCache.set(cacheKey, result);
      
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [pageSize, measureOperation]);

  // Load more items
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    try {
      const result = await loadPage(currentPage + 1);
      
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      console.error('Failed to load more items:', err);
    }
  }, [currentPage, hasMore, loadPage]);

  // Reset catalog
  const reset = useCallback(() => {
    setItems([]);
    setCurrentPage(initialPage);
    setHasMore(true);
    setError(null);
    loadingRef.current = false;
  }, [initialPage]);

  // Search with debouncing
  const search = useCallback((searchTerm: string) => {
    debouncedSearch(searchTerm, (results) => {
      setItems(results);
      setCurrentPage(1);
      setHasMore(results.length >= pageSize);
    });
  }, [debouncedSearch, pageSize]);

  // Intersection observer for infinite scroll
  const observeElement = useCallback((element: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (element) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMore && !loadingRef.current) {
              throttledLoadMore();
            }
          });
        },
        { rootMargin: '100px' }
      );

      observerRef.current.observe(element);
    }
  }, [hasMore, throttledLoadMore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    isLoading,
    error,
    hasMore,
    currentPage,
    loadMore,
    loadPage,
    search,
    reset,
    observeElement,
    setItems,
  };
};

// Hook for optimizing image loading in catalogs
export const useImageOptimization = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((src: string) => {
    if (loadedImages.has(src) || failedImages.has(src)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        resolve();
      };
      
      img.onerror = () => {
        setFailedImages(prev => new Set(prev).add(src));
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }, [loadedImages, failedImages]);

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src);
  }, [loadedImages]);

  const isImageFailed = useCallback((src: string) => {
    return failedImages.has(src);
  }, [failedImages]);

  return {
    preloadImage,
    isImageLoaded,
    isImageFailed,
    loadedImages,
    failedImages,
  };
}; 