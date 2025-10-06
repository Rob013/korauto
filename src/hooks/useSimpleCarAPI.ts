import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qtyyiqimkysmjnaocswe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8";

interface SimpleCar {
  id: string;
  manufacturer?: { name: string };
  model?: { name: string };
  year: number;
  price?: string;
  mileage?: string;
  title?: string;
  vin?: string;
  fuel?: { name: string };
  transmission?: { name: string };
  condition?: string;
  lot_number?: string;
  color?: { name: string };
  status?: number;
  sale_status?: string;
  final_price?: number;
  lots?: any[];
}

interface SimpleAPIResponse {
  data: SimpleCar[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
  error?: string;
}

export const useSimpleCarAPI = () => {
  const [cars, setCars] = useState<SimpleCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchCars = useCallback(async (resetList: boolean = true) => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) {
      console.log('🚫 Skipping - too frequent');
      return;
    }

    if (resetList) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🔄 Fetching cars from Supabase');
      lastFetchTimeRef.current = now;

      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const result: any = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact' })
        .neq('sale_status', 'archived')
        .neq('sale_status', 'sold')
        .order('price_cents', { ascending: true, nullsFirst: false })
        .range(0, 35);

      const data = result.data;
      const queryError = result.error;
      const count = result.count;

      if (queryError) throw queryError;

      const transformedCars: SimpleCar[] = (data || []).map((car: any) => ({
        id: car.id,
        manufacturer: { name: car.make },
        model: { name: car.model },
        year: car.year,
        price: car.price?.toString(),
        mileage: car.mileage,
        title: `${car.make} ${car.model} ${car.year}`,
        vin: car.vin,
        fuel: car.fuel ? { name: car.fuel } : undefined,
        transmission: car.transmission ? { name: car.transmission } : undefined,
        condition: car.condition,
        lot_number: car.lot_number,
        color: car.color ? { name: car.color } : undefined,
        lots: [{
          buy_now: car.price,
          lot: car.lot_number,
          images: typeof car.images === 'string' ? JSON.parse(car.images || '[]') : car.images
        }]
      }));

      setCars(transformedCars);
      console.log(`✅ Fetched ${transformedCars.length} cars from Supabase (Total: ${count})`);
    } catch (err: any) {
      console.error('❌ Fetch cars error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch cars on mount
  useEffect(() => {
    fetchCars(true);
  }, [fetchCars]);

  return {
    cars,
    loading,
    error,
    fetchCars: () => fetchCars(true),
    refreshCars: () => fetchCars(true)
  };
};