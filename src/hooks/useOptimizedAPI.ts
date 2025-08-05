import { useState, useEffect, useRef, useCallback } from 'react';
import { LRUCache, debounce, throttle } from '@/utils/performance';
import { useMeasureAsyncOperation } from './use-performance';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseOptimizedAPIOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean;
  deduplicate?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

// Global cache instance
const globalCache = new LRUCache<string, CacheEntry<any>>(200);

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export const useOptimizedAPI = <T>({
  key,
  fetcher,
  ttl = 5 * 60 * 1000, // 5 minutes default
  enabled = true,
  deduplicate = true,
  retryCount = 2,
  retryDelay = 1000,
}: UseOptimizedAPIOptions<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  
  const measureOperation = useMeasureAsyncOperation(`api-${key}`);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if cache entry is valid
  const isCacheValid = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp < entry.ttl;
  }, []);

  // Fetch data with retry logic
  const fetchData = useCallback(async (): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();
        
        const result = await measureOperation(async () => {
          const response = await fetcher();
          
          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Request aborted');
          }
          
          return response;
        });
        
        return result;
      } catch (err) {
        lastError = err as Error;
        
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw lastError!;
  }, [fetcher, retryCount, retryDelay, measureOperation]);

  // Main data fetching logic
  const refetch = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first
    const cached = globalCache.get(key);
    if (cached && isCacheValid(cached) && !force) {
      setData(cached.data);
      setIsStale(false);
      return;
    }

    // Mark as stale if we have cached data but it's expired
    if (cached && !isCacheValid(cached)) {
      setIsStale(true);
    }

    // Deduplicate requests
    if (deduplicate && pendingRequests.has(key)) {
      try {
        const result = await pendingRequests.get(key)!;
        setData(result);
        setError(null);
        setIsStale(false);
        return;
      } catch (err) {
        setError(err as Error);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const promise = fetchData();
      
      if (deduplicate) {
        pendingRequests.set(key, promise);
      }
      
      const result = await promise;
      
      // Cache the result
      globalCache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl,
      });
      
      setData(result);
      setIsStale(false);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
      if (deduplicate) {
        pendingRequests.delete(key);
      }
    }
  }, [key, enabled, deduplicate, ttl, isCacheValid, fetchData]);

  // Debounced refetch for search/filter operations
  const debouncedRefetch = useCallback(
    debounce(() => refetch(true), 300),
    [refetch]
  );

  // Throttled refetch for frequent updates
  const throttledRefetch = useCallback(
    throttle(() => refetch(true), 1000),
    [refetch]
  );

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    isStale,
    refetch,
    debouncedRefetch,
    throttledRefetch,
  };
};

// Hook for prefetching data
export const usePrefetch = () => {
  return useCallback((key: string, fetcher: () => Promise<any>, ttl = 5 * 60 * 1000) => {
    const cached = globalCache.get(key);
    if (!cached || Date.now() - cached.timestamp >= cached.ttl) {
      // Prefetch in background
      fetcher().then(data => {
        globalCache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
        });
      }).catch(() => {
        // Silently fail for prefetch
      });
    }
  }, []);
};

// Hook for clearing cache
export const useClearCache = () => {
  return useCallback((key?: string) => {
    if (key) {
      globalCache.delete(key);
    } else {
      globalCache.clear();
    }
  }, []);
}; 