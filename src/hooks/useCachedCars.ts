import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuctionAPI } from './useSecureAuctionAPI';

interface CachedCar {
  id: string;
  external_id: string;
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
  mileage: number | null;
  images: any;
  image_url: string | null;
  current_bid: number | null;
  buy_now_price: number | null;
  keys_available: boolean;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

export const useCachedCars = () => {
  const [cachedCars, setCachedCars] = useState<CachedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cars: apiCars, loading: apiLoading, error: apiError, fetchCars } = useSecureAuctionAPI();

  const fetchCachedCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching cars:', error);
        setError(error.message);
      } else {
        setCachedCars(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch cars:', err);
      setError('Failed to fetch cars');
    }
  };

  useEffect(() => {
    const loadCars = async () => {
      setLoading(true);
      
      // First try to load from cache
      await fetchCachedCars();
      
      // Check if cache is fresh enough (increased from 1 hour to 4 hours for better performance)
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      
      // Only fetch from API if cache is empty or very outdated
      if (cachedCars.length === 0) {
        const hasRecentData = cachedCars.some(car => 
          new Date(car.last_synced_at) > fourHoursAgo
        );
        
        if (!hasRecentData) {
          console.log('Cache is empty or outdated, fetching from API...');
          await fetchCars();
        }
      }
      
      setLoading(false);
    };

    loadCars();
  }, []);

  // Memoize transformed cars to prevent unnecessary recalculations
  const transformedCars = useMemo(() => {
    return cachedCars.map(cached => {
      const images = typeof cached.images === 'string' ? JSON.parse(cached.images || '[]') : (cached.images || []);

      return {
        id: cached.external_id || cached.id,
        manufacturer: { id: 0, name: cached.make },
        model: { id: 0, name: cached.model },
        year: cached.year,
        vin: cached.vin,
        fuel: cached.fuel ? { id: 0, name: cached.fuel } : undefined,
        transmission: cached.transmission ? { id: 0, name: cached.transmission } : undefined,
        color: cached.color ? { id: 0, name: cached.color } : undefined,
        condition: cached.condition,
        lots: [{
          buy_now: cached.buy_now_price || cached.price,
          lot: cached.lot_number,
          bid: cached.current_bid,
          keys_available: cached.keys_available,
          odometer: cached.mileage ? { km: cached.mileage } : undefined,
          images: { normal: images, big: images }
        }]
      };
    });
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