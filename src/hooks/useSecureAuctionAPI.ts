import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Car {
  id: string;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
  generation?: { id: number; name: string; manufacturer_id: number; model_id: number };
  year: number;
  price?: string;
  mileage?: string;
  title?: string;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  condition?: string;
  lot_number?: string;
  image_url?: string;
  color?: { id: number; name: string };
  status?: number;
  sale_status?: string;
  final_price?: number;
  body_type?: { id: number; name: string };
  engine?: { id: number; name: string };
  drive_wheel?: string;
  vehicle_type?: { id: number; name: string };
  cylinders?: number;
  lots?: any[];
}

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
}

interface Generation {
  id: number;
  name: string;
  car_count?: number;
}

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
}

interface APIResponse {
  data: Car[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
  error?: string;
  retryAfter?: number;
}

export const useSecureAuctionAPI = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const makeSecureAPICall = async (endpoint: string, filters: APIFilters = {}, carId?: string): Promise<any> => {
    try {
      console.log('🔐 Making secure API call:', { endpoint, filters, carId });
      
      const { data, error: functionError } = await supabase.functions.invoke('secure-cars-api', {
        body: { endpoint, filters, carId }
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

      return data;
    } catch (err) {
      console.error('❌ Secure API call error:', err);
      throw err;
    }
  };

  const fetchCars = async (page: number = 1, filters: APIFilters = {}, resetList: boolean = true): Promise<void> => {
    if (resetList) {
      setLoading(true);
      setCurrentPage(1);
    }
    setError(null);

    try {
      const apiFilters = {
        ...filters,
        page: page.toString(),
        per_page: '12',
        simple_paginate: '0'
      };

      const data: APIResponse = await makeSecureAPICall('cars', apiFilters);
      
      setTotalCount(data.meta?.total || 0);
      setHasMorePages(page < (data.meta?.last_page || 1));
      
      if (resetList || page === 1) {
        setCars(data.data || []);
        setCurrentPage(1);
      } else {
        setCars(prev => [...prev, ...(data.data || [])]);
        setCurrentPage(page);
      }

    } catch (err: any) {
      if (err.message === 'RATE_LIMITED') {
        // Retry once after rate limit
        try {
          await delay(2000);
          return fetchCars(page, filters, resetList);
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
  };

  const fetchManufacturers = async (): Promise<Manufacturer[]> => {
    try {
      const data = await makeSecureAPICall('manufacturers/cars');
      return data.data || [];
    } catch (err) {
      console.error('❌ Error fetching manufacturers:', err);
      return [];
    }
  };

  const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
    try {
      const data = await makeSecureAPICall(`models/${manufacturerId}/cars`);
      return data.data || [];
    } catch (err) {
      console.error('❌ Error fetching models:', err);
      return [];
    }
  };

  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      const data = await makeSecureAPICall(`generations/${modelId}/cars`);
      return data.data || [];
    } catch (err) {
      console.error('❌ Error fetching generations:', err);
      return [];
    }
  };

  const fetchFilterCounts = async (currentFilters: APIFilters = {}, manufacturersList: any[] = []) => {
    // Mock implementation for backward compatibility
    console.log('📊 fetchFilterCounts called with filters:', currentFilters);
    return {
      manufacturers: {},
      models: {},
      generations: {},
      colors: {},
      fuelTypes: {},
      transmissions: {},
      years: {}
    };
  };

  const fetchCarCounts = async (filters: APIFilters = {}): Promise<{ [key: string]: number }> => {
    try {
      const apiFilters = {
        ...filters,
        per_page: '1',
        simple_paginate: '1'
      };

      const data: APIResponse = await makeSecureAPICall('cars', apiFilters);
      return { total: data.meta?.total || 0 };
    } catch (err) {
      console.error('❌ Error fetching car counts:', err);
      return { total: 0 };
    }
  };

  const fetchCarById = async (carId: string): Promise<Car | null> => {
    try {
      const data = await makeSecureAPICall('cars', {}, carId);
      return data.data || null;
    } catch (err) {
      console.error('❌ Error fetching car by ID:', err);
      return null;
    }
  };

  const loadMore = async (filters: APIFilters = {}) => {
    if (!hasMorePages || loading) return;
    await fetchCars(currentPage + 1, filters, false);
  };

  return {
    cars,
    loading,
    error,
    currentPage,
    totalCount,
    hasMorePages,
    fetchCars,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchCarById,
    fetchCarCounts,
    fetchFilterCounts,
    loadMore
  };
};