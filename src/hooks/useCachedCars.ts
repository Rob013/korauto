import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuctionAPI } from './useAuctionAPI';

interface CachedCar {
  id: string;
  api_id: string;
  make: string;
  model: string;
  year: number;
  price: number | null;
  vin: string | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  condition: string | null;
  lot_number: string | null;
  mileage: string | null;
  images: any;
  car_data: any;
  lot_data: any;
  created_at: string;
  updated_at: string;
  last_api_sync: string;
}

export const useCachedCars = () => {
  const [cachedCars, setCachedCars] = useState<CachedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cars: apiCars, loading: apiLoading, error: apiError, fetchCars } = useAuctionAPI();

  const fetchCachedCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars_cache')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching cached cars:', error);
        setError(error.message);
      } else {
        setCachedCars(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch cached cars:', err);
      setError('Failed to fetch cached cars');
    }
  };

  useEffect(() => {
    const loadCars = async () => {
      console.log('🚀 Starting optimized car loading...');
      const startTime = performance.now();
      setLoading(true);
      
      // First try to load from cache instantly
      await fetchCachedCars();
      
      // Check if cache is fresh enough (extended to 6 hours for better performance)
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      
      // Only fetch from API if cache is empty or very outdated
      if (cachedCars.length === 0) {
        const hasRecentData = cachedCars.some(car => 
          new Date(car.last_api_sync) > sixHoursAgo
        );
        
        if (!hasRecentData) {
          console.log('Cache is empty or outdated, fetching from API...');
          await fetchCars();
        } else {
          console.log('✅ Using cached data - fresh enough');
        }
      } else {
        console.log('✅ Using cached data - available immediately');
      }
      
      const endTime = performance.now();
      console.log(`⚡ Car loading completed in ${(endTime - startTime).toFixed(2)}ms`);
      setLoading(false);
    };

    loadCars();
  }, []);

  // Memoize transformed cars to prevent unnecessary recalculations
  const transformedCars = useMemo(() => {
    const startTransform = performance.now();
    
    const transformed = cachedCars.map(cached => {
      // Optimize JSON parsing by checking type first
      let carData, lotData, images;
      
      try {
        carData = typeof cached.car_data === 'string' ? JSON.parse(cached.car_data) : cached.car_data;
        lotData = typeof cached.lot_data === 'string' ? JSON.parse(cached.lot_data || '{}') : (cached.lot_data || {});
        images = typeof cached.images === 'string' ? JSON.parse(cached.images || '[]') : (cached.images || []);
      } catch (parseError) {
        console.warn('Failed to parse cached car data:', parseError);
        carData = {};
        lotData = {};
        images = [];
      }

      return {
        id: cached.api_id,
        manufacturer: { id: 0, name: cached.make },
        model: { id: 0, name: cached.model },
        year: cached.year,
        vin: cached.vin,
        fuel: cached.fuel ? { id: 0, name: cached.fuel } : undefined,
        transmission: cached.transmission ? { id: 0, name: cached.transmission } : undefined,
        color: cached.color ? { id: 0, name: cached.color } : undefined,
        condition: cached.condition,
        lots: [{
          buy_now: cached.price,
          lot: cached.lot_number,
          odometer: lotData.odometer,
          images: { normal: images, big: images },
          ...lotData
        }]
      };
    });
    
    const endTransform = performance.now();
    console.log(`🔄 Transformed ${transformed.length} cars in ${(endTransform - startTransform).toFixed(2)}ms`);
    
    return transformed;
  }, [cachedCars]);

  // Use cached cars if available, otherwise fall back to API cars
  const cars = transformedCars.length > 0 ? transformedCars : apiCars;
  const finalLoading = loading || (transformedCars.length === 0 && apiLoading);
  const finalError = error || (transformedCars.length === 0 ? apiError : null);

  return {
    cars,
    loading: finalLoading,
    error: finalError,
    cachedCars,
    fetchCachedCars,
    hasCachedData: transformedCars.length > 0
  };
};