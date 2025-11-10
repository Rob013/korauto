import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { transformCachedCarRecord } from '@/services/carCache';

export interface OptimizedCarDetailsOptions {
  carId: string;
  prefetch?: boolean;
}

/**
 * Optimized hook for instant car details loading
 * Uses aggressive caching and prefetching strategies
 */
export const useOptimizedCarDetails = ({ carId, prefetch = true }: OptimizedCarDetailsOptions) => {
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memory cache for instant access
  const [memoryCache] = useState(() => new Map<string, any>());

  const loadCarDetails = useCallback(async (id: string, fromCache = true) => {
    try {
      // Check memory cache first for instant load
      if (fromCache && memoryCache.has(id)) {
        const cached = memoryCache.get(id);
        setCar(cached);
        setLoading(false);
        return cached;
      }

      setLoading(true);

      // Try to load from Supabase cache with minimal fields first for speed
      const { data: cacheData, error: cacheError } = await supabase
        .from('cars_cache')
        .select('id, car_data, updated_at')
        .eq('id', id)
        .single();

      if (cacheError) throw cacheError;

      if (cacheData) {
        const transformedCar = transformCachedCarRecord(cacheData);
        
        // Store in memory cache
        memoryCache.set(id, transformedCar);
        
        setCar(transformedCar);
        setLoading(false);
        return transformedCar;
      }

      throw new Error('Car not found');
    } catch (err) {
      console.error('Error loading car details:', err);
      setError(err as Error);
      setLoading(false);
      return null;
    }
  }, [memoryCache]);

  // Prefetch adjacent cars for instant navigation
  const prefetchAdjacentCars = useCallback(async (currentId: string) => {
    if (!prefetch) return;

    try {
      // Get adjacent cars (previous and next) for instant navigation
      const { data: adjacentCars } = await supabase
        .from('cars_cache')
        .select('id, car_data')
        .neq('id', currentId)
        .limit(4);

      if (adjacentCars) {
        adjacentCars.forEach(car => {
          const transformed = transformCachedCarRecord(car);
          memoryCache.set(car.id, transformed);
        });
      }
    } catch (err) {
      console.error('Error prefetching adjacent cars:', err);
    }
  }, [prefetch, memoryCache]);

  useEffect(() => {
    if (carId) {
      loadCarDetails(carId).then(carData => {
        if (carData) {
          // Prefetch adjacent cars in background
          prefetchAdjacentCars(carId);
        }
      });
    }
  }, [carId, loadCarDetails, prefetchAdjacentCars]);

  return {
    car,
    loading,
    error,
    reload: () => loadCarDetails(carId, false),
    prefetchCar: (id: string) => loadCarDetails(id, true)
  };
};
