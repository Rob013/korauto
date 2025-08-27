import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { throttle } from '@/utils/performance';

/**
 * Hook providing throttled URL updates to prevent SecurityError from excessive history.replaceState() calls
 * 
 * This hook ensures that URL updates are throttled to prevent the browser's security mechanism
 * from blocking excessive history manipulation (>100 calls per 10 seconds).
 */
export const useThrottledUrlUpdate = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingUpdatesRef = useRef<URLSearchParams | null>(null);

  // Create throttled update function that batches multiple rapid calls
  const throttledUpdate = useCallback(
    throttle((params: URLSearchParams, options?: { replace?: boolean }) => {
      try {
        // If there are pending updates, merge them
        if (pendingUpdatesRef.current) {
          // Merge pending updates with current params
          for (const [key, value] of pendingUpdatesRef.current.entries()) {
            params.set(key, value);
          }
          pendingUpdatesRef.current = null;
        }
        
        setSearchParams(params, { replace: options?.replace ?? true });
      } catch (error) {
        console.warn('⚠️ Failed to update URL parameters:', error);
      }
    }, 1000), // Increased to 1000ms (1 second) to be more conservative
    [setSearchParams]
  );

  // Immediate update function for critical operations (like initial page load)
  const immediateUpdate = useCallback((params: URLSearchParams, options?: { replace?: boolean }) => {
    try {
      setSearchParams(params, { replace: options?.replace ?? true });
    } catch (error) {
      console.warn('⚠️ Failed to immediately update URL parameters:', error);
    }
  }, [setSearchParams]);

  // Main update function that uses throttling by default
  const updateUrl = useCallback((
    params: URLSearchParams | Record<string, string | undefined>, 
    options?: { replace?: boolean; immediate?: boolean }
  ) => {
    let urlParams: URLSearchParams;
    
    if (params instanceof URLSearchParams) {
      urlParams = new URLSearchParams(params);
    } else {
      urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlParams.set(key, value.toString());
        }
      });
    }

    if (options?.immediate) {
      // Use immediate update for critical operations
      immediateUpdate(urlParams, { replace: options.replace });
    } else {
      // Store pending updates for batching
      if (pendingUpdatesRef.current) {
        // Merge with existing pending updates
        for (const [key, value] of urlParams.entries()) {
          pendingUpdatesRef.current.set(key, value);
        }
      } else {
        pendingUpdatesRef.current = new URLSearchParams(urlParams);
      }
      
      // Use throttled update
      throttledUpdate(urlParams, { replace: options?.replace });
    }
  }, [throttledUpdate, immediateUpdate]);

  // Clear all URL parameters
  const clearUrl = useCallback((options?: { immediate?: boolean }) => {
    if (options?.immediate) {
      immediateUpdate(new URLSearchParams(), { replace: true });
    } else {
      throttledUpdate(new URLSearchParams(), { replace: true });
    }
  }, [throttledUpdate, immediateUpdate]);

  return {
    searchParams,
    updateUrl,
    clearUrl,
    // Legacy compatibility - but discouraged for new code
    setSearchParams: updateUrl
  };
};