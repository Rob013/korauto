import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { transformCachedCarRecord } from '@/services/carCache';

export interface OptimizedCarDetailsOptions {
  carId: string;
  prefetch?: boolean;
}

const SESSION_CACHE_PREFIX = 'korauto-car-details:';
const SESSION_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_SESSION_CACHE_ITEMS = 5;

const isSessionStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__korauto-car-cache-test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const readFromSessionCache = (id: string): any | null => {
  if (!isSessionStorageAvailable()) return null;
  const key = SESSION_CACHE_PREFIX + id;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== 'number') {
      window.sessionStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.timestamp > SESSION_CACHE_TTL) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
};

const trimSessionCache = () => {
  if (!isSessionStorageAvailable()) return;
  const entries: Array<{ key: string; timestamp: number }> = [];

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (!key || !key.startsWith(SESSION_CACHE_PREFIX)) continue;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) {
        window.sessionStorage.removeItem(key);
        continue;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.timestamp !== 'number') {
        window.sessionStorage.removeItem(key);
        continue;
      }
      entries.push({ key, timestamp: parsed.timestamp });
    } catch {
      window.sessionStorage.removeItem(key);
    }
  }

  if (entries.length <= MAX_SESSION_CACHE_ITEMS) {
    return;
  }

  entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(MAX_SESSION_CACHE_ITEMS)
    .forEach((entry) => {
      window.sessionStorage.removeItem(entry.key);
    });
};

const writeToSessionCache = (id: string, data: unknown) => {
  if (!isSessionStorageAvailable()) return;
  const key = SESSION_CACHE_PREFIX + id;

  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      }),
    );
    trimSessionCache();
  } catch {
    // Ignore quota exceeded or serialization errors
  }
};

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

  const loadCarDetails = useCallback(
    async (id: string, fromCache = true) => {
      if (!id) return null;

      try {
        if (fromCache) {
          if (memoryCache.has(id)) {
            const cached = memoryCache.get(id);
            if (cached) {
              setCar(cached);
              return cached;
            }
          }

          const sessionCached = readFromSessionCache(id);
          if (sessionCached) {
            memoryCache.set(id, sessionCached);
            setCar(sessionCached);
            return sessionCached;
          }
        }

        setLoading(true);
        setError(null);

        // Try both tables: encar_cars_cache (Encar) and cars_cache (old data)
        
        // First try encar_cars_cache with vehicle_id (convert string ID to number for Encar)
        const vehicleIdNum = parseInt(id, 10);
        if (!isNaN(vehicleIdNum)) {
          const encarResult = await supabase
            .from('encar_cars_cache')
            .select('*')
            .eq('vehicle_id', vehicleIdNum)
            .maybeSingle();
          
          if (encarResult.data) {
            const data = encarResult.data;
            // Transform Encar cached car to expected format
            const transformedEncar = {
              id: String(data.vehicle_id),
              year: parseInt(data.form_year || '0'),
              manufacturer: data.manufacturer_name,
              model: data.model_name,
              generation: data.generation_name,
              grade: data.grade_name,
              mileage: data.mileage,
              transmission: data.transmission,
              fuel: data.fuel_type,
              color: data.color_name,
              body_type: data.body_type,
              // Price conversion: 만원 (10,000 KRW units) to EUR
              price: data.buy_now_price 
                ? Math.round((Number(data.buy_now_price) * 10000) / 1400) + 2500 
                : null,
              images: data.photos ? 
                (typeof data.photos === 'string' ? JSON.parse(data.photos) : data.photos)
                : [],
              details: {
                seats_count: data.seat_count,
                badge: data.grade_name,
                displacement: data.displacement,
              },
              insurance_v2: {
                accidentCnt: data.has_accident ? 1 : 0,
              },
              dealer_name: data.dealer_name,
              dealer_firm: data.dealer_firm,
              contact: {
                address: data.contact_address
              },
              _cached: true,
              _source: 'encar_cars_cache'
            };
            
            memoryCache.set(id, transformedEncar);
            writeToSessionCache(id, transformedEncar);
            setCar(transformedEncar);
            return transformedEncar;
          }
        }
        
        // Fallback to old cars_cache table
        const oldCacheResult = await supabase
          .from('cars_cache')
          .select('id, car_data, updated_at')
          .eq('id', id)
          .maybeSingle();

        if (oldCacheResult.error) throw oldCacheResult.error;
        if (!oldCacheResult.data) {
          throw new Error('Car not found');
        }

        const transformedCar = transformCachedCarRecord(oldCacheResult.data);

        memoryCache.set(id, transformedCar);
        writeToSessionCache(id, transformedCar);

        setCar(transformedCar);
        return transformedCar;
      } catch (err) {
        console.error('Error loading car details:', err);
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [memoryCache],
  );

  // Prefetch adjacent cars for instant navigation
  const prefetchAdjacentCars = useCallback(
    async (currentId: string) => {
      if (!prefetch) return;

      if (typeof navigator !== 'undefined') {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType?.toLowerCase() as string | undefined;
        if (connection?.saveData) {
          return;
        }
        if (effectiveType && ['slow-2g', '2g', '3g'].includes(effectiveType)) {
          return;
        }
      }

      try {
        const { data: adjacentCars } = await supabase
          .from('cars_cache')
          .select('id, car_data, updated_at')
          .neq('id', currentId)
          .limit(2);

        if (adjacentCars) {
          adjacentCars.forEach((adjacent) => {
            if (!adjacent?.id || memoryCache.has(adjacent.id)) {
              return;
            }
            const transformed = transformCachedCarRecord(adjacent);
            memoryCache.set(adjacent.id, transformed);
            writeToSessionCache(adjacent.id, transformed);
          });
        }
      } catch (err) {
        console.error('Error prefetching adjacent cars:', err);
      }
    },
    [prefetch, memoryCache],
  );

  useEffect(() => {
    if (!carId) {
      return;
    }

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    loadCarDetails(carId).then((carData) => {
      if (!carData || cancelled) {
        return;
      }

      const schedulePrefetch = () => {
        if (!cancelled) {
          prefetchAdjacentCars(carId);
        }
      };

      if (typeof window !== 'undefined') {
        const idleCallback = (window as typeof window & {
          requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
          cancelIdleCallback?: (handle: number) => void;
        }).requestIdleCallback;

        if (typeof idleCallback === 'function') {
          idleId = idleCallback(schedulePrefetch, { timeout: 2000 });
        } else {
          timeoutId = window.setTimeout(schedulePrefetch, 1500) as unknown as number;
        }
      } else {
        schedulePrefetch();
      }
    });

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        const cancelIdle = (window as typeof window & {
          cancelIdleCallback?: (handle: number) => void;
        }).cancelIdleCallback;
        if (idleId !== null && typeof cancelIdle === 'function') {
          cancelIdle(idleId);
        }
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      }
    };
  }, [carId, loadCarDetails, prefetchAdjacentCars]);

  return {
    car,
    loading,
    error,
    reload: () => loadCarDetails(carId, false),
    prefetchCar: (id: string) => loadCarDetails(id, true)
  };
};
