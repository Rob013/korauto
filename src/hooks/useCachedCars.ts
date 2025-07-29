import { useState, useEffect } from 'react';
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
      setLoading(true);
      
      // First try to load from cache
      await fetchCachedCars();
      
      // If cache is empty or outdated (older than 1 hour), fetch from API
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentCars = cachedCars.filter(car => 
        new Date(car.last_api_sync) > oneHourAgo
      );

      if (recentCars.length === 0) {
        console.log('Cache is empty or outdated, fetching from API...');
        await fetchCars();
      }
      
      setLoading(false);
    };

    loadCars();
  }, []);

  // Convert cached cars to the format expected by the app
  const transformedCars = cachedCars.map(cached => {
    const carData = typeof cached.car_data === 'string' ? JSON.parse(cached.car_data) : cached.car_data;
    const lotData = typeof cached.lot_data === 'string' ? JSON.parse(cached.lot_data || '{}') : (cached.lot_data || {});
    const images = typeof cached.images === 'string' ? JSON.parse(cached.images || '[]') : (cached.images || []);

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