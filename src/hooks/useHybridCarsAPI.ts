import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuctionAPI } from './useSecureAuctionAPI';

interface HybridCarsAPIOptions {
  cacheFirst?: boolean;
  cacheTimeout?: number; // in milliseconds
  autoRefresh?: boolean;
}

interface HybridCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  color?: string;
  images?: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  source?: 'cache' | 'api';
  _autoSave?: {
    saved: number;
    errors: number;
    timestamp: string;
  };
}

export const useHybridCarsAPI = (options: HybridCarsAPIOptions = {}) => {
  const {
    cacheFirst = true,
    cacheTimeout = 300000, // 5 minutes default
    autoRefresh = true
  } = options;

  const [hybridCars, setHybridCars] = useState<HybridCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | 'hybrid'>('cache');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Use the existing secure API hook for external API calls
  const {
    cars: apiCars,
    loading: apiLoading,
    error: apiError,
    fetchCars: fetchApiCars,
    filters,
    setFilters,
    totalCount: apiTotalCount
  } = useSecureAuctionAPI();

  // Fetch cars from database cache
  const fetchFromCache = useCallback(async (limit = 50, offset = 0) => {
    try {
      console.log('🗃️ Fetching cars from cache...');
      
      const { data: cachedCars, error: cacheError } = await supabase
        .from('cars_cache')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (cacheError) throw cacheError;

      if (cachedCars && cachedCars.length > 0) {
        const transformedCars: HybridCar[] = cachedCars.map(car => ({
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          price: car.price || 0,
          mileage: car.mileage ? parseInt(car.mileage) : undefined,
          fuel: car.fuel,
          transmission: car.transmission,
          color: car.color,
          images: Array.isArray(car.images) ? car.images as string[] : [],
          created_at: car.created_at,
          updated_at: car.updated_at,
          source: 'cache'
        }));

        console.log(`✅ Loaded ${transformedCars.length} cars from cache`);
        return transformedCars;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching from cache:', error);
      throw error;
    }
  }, []);

  // Check if cache is fresh
  const isCacheFresh = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cars_cache')
        .select('last_api_sync')
        .order('last_api_sync', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return false;

      const lastSyncTime = new Date(data.last_api_sync);
      const now = new Date();
      const timeDiff = now.getTime() - lastSyncTime.getTime();

      return timeDiff < cacheTimeout;
    } catch (error) {
      console.error('❌ Error checking cache freshness:', error);
      return false;
    }
  }, [cacheTimeout]);

  // Hybrid fetch strategy
  const fetchHybridCars = useCallback(async (
    page = 1, 
    filters: any = {}, 
    forceApi = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      let cars: HybridCar[] = [];
      let source: 'cache' | 'api' | 'hybrid' = 'cache';

      // Strategy 1: Try cache first if enabled and not forced to use API
      if (cacheFirst && !forceApi) {
        const cacheFresh = await isCacheFresh();
        
        if (cacheFresh) {
          cars = await fetchFromCache(50, (page - 1) * 50);
          if (cars.length > 0) {
            console.log('🎯 Using fresh cache data');
            setHybridCars(cars);
            setDataSource('cache');
            setLastSync(new Date());
            setLoading(false);
            return;
          }
        }
      }

      // Strategy 2: Fetch from API with auto-save
      console.log('🌐 Fetching from external API with auto-save...');
      await fetchApiCars(page, filters, true);
      
      // The API calls now automatically save to cache via our proxy
      // Wait a moment for the save to complete, then fetch from cache
      setTimeout(async () => {
        try {
          const freshCachedCars = await fetchFromCache(50, (page - 1) * 50);
          if (freshCachedCars.length > 0) {
            console.log('🔄 Using newly cached data from API');
            setHybridCars(freshCachedCars);
            setDataSource('hybrid');
          } else {
            // Fallback to API data if cache save failed
            const apiTransformed: HybridCar[] = apiCars.map(car => ({
              id: String(car.id),
              make: car.manufacturer?.name || 'Unknown',
              model: car.model?.name || 'Unknown', 
              year: car.year || 2020,
              price: car.lots?.[0]?.buy_now || 0,
              mileage: car.lots?.[0]?.odometer?.km,
              fuel: car.fuel?.name,
              transmission: car.transmission?.name,
              color: car.color?.name,
              images: car.lots?.[0]?.images?.normal || [],
              source: 'api'
            }));
            setHybridCars(apiTransformed);
            setDataSource('hybrid');
          }
          setLastSync(new Date());
        } catch (error) {
          console.error('❌ Error fetching cached data after API save:', error);
          // Use API data as final fallback
          const apiTransformed: HybridCar[] = apiCars.map(car => ({
            id: String(car.id),
            make: car.manufacturer?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year || 2020,
            price: car.lots?.[0]?.buy_now || 0,
            mileage: car.lots?.[0]?.odometer?.km,
            fuel: car.fuel?.name,
            transmission: car.transmission?.name,
            color: car.color?.name,
            images: car.lots?.[0]?.images?.normal || [],
            source: 'api'
          }));
          setHybridCars(apiTransformed);
          setDataSource('api');
        }
      }, 1000); // Wait 1 second for auto-save to complete

    } catch (error) {
      console.error('❌ Hybrid fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch cars');
      
      // Final fallback: try to get any cached data
      try {
        const fallbackCars = await fetchFromCache();
        if (fallbackCars.length > 0) {
          setHybridCars(fallbackCars);
          setDataSource('cache');
          console.log('🆘 Using cached data as fallback');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback cache fetch failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheFirst, fetchApiCars, fetchFromCache, isCacheFresh, apiCars]);

  // Get total count from cache or API
  const getTotalCount = useCallback(async () => {
    try {
      // Try to get count from cache first
      const { count: cacheCount, error: cacheError } = await supabase
        .from('cars_cache')
        .select('id', { count: 'exact', head: true });

      if (!cacheError && cacheCount && cacheCount > 0) {
        return cacheCount;
      }

      // Fallback to API total count
      return apiTotalCount || 0;
    } catch (error) {
      console.error('❌ Error getting total count:', error);
      return apiTotalCount || 0;
    }
  }, [apiTotalCount]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshInterval = setInterval(async () => {
      const fresh = await isCacheFresh();
      if (!fresh && !loading) {
        console.log('🔄 Auto-refreshing stale cache...');
        fetchHybridCars(1, filters, true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [autoRefresh, isCacheFresh, loading, fetchHybridCars, filters]);

  // Initial load
  useEffect(() => {
    fetchHybridCars(1, filters);
  }, []);

  return {
    cars: hybridCars,
    loading: loading || apiLoading,
    error: error || apiError,
    dataSource,
    lastSync,
    fetchCars: fetchHybridCars,
    refreshFromApi: () => fetchHybridCars(1, filters, true),
    getTotalCount,
    filters,
    setFilters,
    // Pass through some API functions
    fetchManufacturers: () => {}, // Placeholder - can be implemented if needed
    fetchModels: () => {}, // Placeholder - can be implemented if needed
  };
};