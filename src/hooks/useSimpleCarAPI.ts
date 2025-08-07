import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAPIState, makeAPIRequest, delay, apiCache } from '@/utils/apiUtils';

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
  lots?: unknown[];
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
  const {
    data: cars,
    setData: setCars,
    loading,
    setLoading,
    error,
    setError,
    shouldSkipRequest,
    updateLastFetchTime
  } = useAPIState<SimpleCar>();

  const fetchCars = useCallback(async (resetList: boolean = true) => {
    // Prevent too frequent API calls
    if (shouldSkipRequest()) {
      console.log('🚫 Skipping API call - too frequent');
      return;
    }

    // Check cache first
    const cacheKey = apiCache.createKey('simple-cars', { page: 1, per_page: 36 });
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log('📋 Using cached cars data');
      setCars(cachedData);
      return;
    }

    const result = await makeAPIRequest(
      async () => {
        console.log('🔄 Fetching cars from API');
        updateLastFetchTime();

        const { data, error: functionError } = await supabase.functions.invoke('secure-cars-api', {
          body: { 
            endpoint: 'cars',
            filters: {
              page: '1',
              per_page: '36',
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

        return data as SimpleAPIResponse;
      },
      setLoading,
      setError
    );

    if (result?.data && result.data.length > 0) {
      setCars(result.data);
      apiCache.set(cacheKey, result.data);
      console.log(`✅ Fetched ${result.data.length} cars successfully`);
    } else {
      console.log('⚠️ No cars returned from API');
      setCars([]);
    }
  }, [shouldSkipRequest, updateLastFetchTime, setCars, setLoading, setError]);

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