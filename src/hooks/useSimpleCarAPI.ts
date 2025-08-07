import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchCars = useCallback(async (resetList: boolean = true) => {
    // Prevent too frequent API calls
    const now = Date.now();
    if (now - lastFetchTime < 2000) { // 2 second minimum between calls
      console.log('🚫 Skipping API call - too frequent');
      return;
    }

    if (resetList) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🔄 Fetching cars from API');
      setLastFetchTime(now);

      const { data, error: functionError } = await supabase.functions.invoke('secure-cars-api', {
        body: { 
          endpoint: 'cars',
          filters: {
            page: '1',
            per_page: '36', // Get enough cars for homepage display
            simple_paginate: '0'
          }
        }
      });

      if (functionError) {
        console.error('❌ Edge function error:', functionError);
        throw new Error(functionError.message || 'API call failed');
      }

      if (data?.error) {
        if (data.retryAfter) {
          console.log('⏳ Rate limited, waiting...');
          await delay(data.retryAfter);
          throw new Error('RATE_LIMITED');
        }
        throw new Error(data.error);
      }

      const response: SimpleAPIResponse = data;
      
      if (response.data && response.data.length > 0) {
        setCars(response.data);
        console.log(`✅ Fetched ${response.data.length} cars successfully`);
      } else {
        console.log('⚠️ No cars returned from API');
        setCars([]);
      }

    } catch (err: any) {
      if (err.message === 'RATE_LIMITED') {
        // Retry once after rate limit
        try {
          await delay(3000);
          return fetchCars(resetList);
        } catch (retryErr) {
          console.error('❌ Retry failed:', retryErr);
          setError('Rate limited - please try again later');
        }
      } else {
        console.error('❌ Fetch cars error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      }
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime]);

  // Auto-fetch cars on mount
  useEffect(() => {
    fetchCars(true);
  }, []);

  return {
    cars,
    loading,
    error,
    fetchCars: () => fetchCars(true),
    refreshCars: () => fetchCars(true)
  };
};