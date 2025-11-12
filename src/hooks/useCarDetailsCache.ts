import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { transformCachedCarRecord } from '@/services/carCache';

interface CacheEntry {
  data: any;
  timestamp: number;
  fetching?: boolean;
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const globalCache = new Map<string, CacheEntry>();

/**
 * Advanced caching hook for car details with memory cache and prefetching
 */
export const useCarDetailsCache = () => {
  const prefetchQueue = useRef<Set<string>>(new Set());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getCachedCar = useCallback(async (carId: string): Promise<any | null> => {
    if (!carId) return null;

    // Check memory cache first
    const cached = globalCache.get(carId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Check if already fetching
    if (cached?.fetching) {
      // Wait for ongoing fetch
      await new Promise(resolve => setTimeout(resolve, 100));
      return getCachedCar(carId);
    }

    // Mark as fetching
    globalCache.set(carId, { 
      data: null, 
      timestamp: Date.now(), 
      fetching: true 
    });

    try {
      const { data, error } = await supabase
        .from('cars_cache')
        .select(`
          *,
          car_data,
          lot_data,
          images,
          high_res_images,
          inspection_report,
          features,
          original_api_data,
          accident_history,
          damage_primary,
          damage_secondary,
          service_history,
          warranty_info,
          previous_owners
        `)
        .eq('id', carId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const transformed = transformCachedCarRecord(data);
      
      if (isMounted.current) {
        globalCache.set(carId, {
          data: transformed,
          timestamp: Date.now(),
          fetching: false
        });
      }

      return transformed;
    } catch (err) {
      console.error('Error fetching car from cache:', err);
      globalCache.delete(carId);
      return null;
    }
  }, []);

  const prefetchCar = useCallback((carId: string) => {
    if (!carId || prefetchQueue.current.has(carId) || globalCache.has(carId)) {
      return;
    }

    prefetchQueue.current.add(carId);

    // Prefetch in idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        getCachedCar(carId).finally(() => {
          prefetchQueue.current.delete(carId);
        });
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        getCachedCar(carId).finally(() => {
          prefetchQueue.current.delete(carId);
        });
      }, 100);
    }
  }, [getCachedCar]);

  const prefetchAdjacentCars = useCallback(async (currentCarId: string) => {
    try {
      // Fetch adjacent cars for prefetching
      const { data } = await supabase
        .from('cars_cache')
        .select('id')
        .neq('id', currentCarId)
        .limit(3);

      if (data) {
        data.forEach(car => prefetchCar(car.id));
      }
    } catch (err) {
      console.error('Error prefetching adjacent cars:', err);
    }
  }, [prefetchCar]);

  const clearCache = useCallback(() => {
    globalCache.clear();
    prefetchQueue.current.clear();
  }, []);

  return {
    getCachedCar,
    prefetchCar,
    prefetchAdjacentCars,
    clearCache
  };
};
