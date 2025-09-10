import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Performance optimization utilities
 */

// Remove console.log in production
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(...args);
    }
  }
};

// Debounce with cleanup
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Memoized stable callback
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback(((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }) as T, []);
};

// Optimized object comparison
export const shallowEqual = (obj1: Record<string, any>, obj2: Record<string, any>): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
};

// Memoized filter function
export const useMemoizedFilter = <T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: any[]
) => {
  return useMemo(() => {
    if (!items.length) return [];
    return items.filter(filterFn);
  }, [items, ...deps]);
};

// Batch updates to avoid multiple re-renders
export const useBatchedUpdates = () => {
  const updateQueue = useRef<Array<() => void>>([]);
  const isUpdating = useRef(false);
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    updateQueue.current.push(updateFn);
    
    if (!isUpdating.current) {
      isUpdating.current = true;
      
      setTimeout(() => {
        const updates = [...updateQueue.current];
        updateQueue.current = [];
        isUpdating.current = false;
        
        updates.forEach(update => update());
      }, 0);
    }
  }, []);
  
  return batchUpdate;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current++;
  });
  
  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current;
      if (process.env.NODE_ENV !== 'production' && renderTime > 16) {
        logger.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }
    }
  });
  
  return {
    renderCount: renderCount.current
  };
};

// Intersection observer for lazy loading
export const useIntersectionObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  
  useEffect(() => {
    if (!targetRef.current) return;
    
    observerRef.current = new IntersectionObserver(([entry]) => {
      callback(entry);
    }, options);
    
    observerRef.current.observe(targetRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);
  
  return targetRef;
};