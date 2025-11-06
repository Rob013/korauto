import { useEffect, useCallback, useRef } from 'react';
import { batchDOMOperations, DOMCache } from '@/utils/performance';

/**
 * Hook to prevent forced reflows by batching DOM operations
 * Use this when you need to read and write DOM properties
 */
export const useReflowPrevention = () => {
  const domCache = useRef(new DOMCache());

  useEffect(() => {
    return () => {
      domCache.current.invalidate();
    };
  }, []);

  const readDOM = useCallback((fn: () => void) => {
    batchDOMOperations.read(fn);
  }, []);

  const writeDOM = useCallback((fn: () => void) => {
    batchDOMOperations.write(fn);
  }, []);

  const getCachedValue = useCallback(<T,>(key: string, getter: () => T): T => {
    return domCache.current.get(key, getter);
  }, []);

  return {
    readDOM,
    writeDOM,
    getCachedValue
  };
};

/**
 * Hook for safe element measurements that prevents forced reflows
 */
export const useMeasure = (ref: React.RefObject<HTMLElement>) => {
  const cache = useRef(new DOMCache());

  const measure = useCallback(() => {
    if (!ref.current) return null;

    return cache.current.get('bounds', () => {
      return ref.current?.getBoundingClientRect();
    });
  }, [ref]);

  useEffect(() => {
    const handleResize = () => {
      cache.current.invalidate();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return measure;
};
