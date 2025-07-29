import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Lot {
  buy_now?: number;
  odometer?: { km?: number };
  popularity_score?: number;
  images?: { normal?: string[]; big?: string[] };
  bid?: number;
  lot?: string;
  status?: string;
  sale_status?: string;
  final_price?: number;
  estimate_repair_price?: number;
  pre_accident_price?: number;
  clean_wholesale_price?: number;
  actual_cash_value?: number;
  sale_date?: string;
  seller?: string;
  seller_type?: string;
  detailed_title?: string;
  damage?: { main?: string; second?: string };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  domain?: { name: string };
  external_id?: string;
  // Enhanced data from your API response
  insurance?: {
    accident_history?: string;
    repair_count?: string;
    total_loss?: string;
    repair_cost?: string;
    flood_damage?: string;
    own_damage?: string;
    other_damage?: string;
    car_info?: {
      make?: string;
      accident_history?: string;
      repair_count?: string;
      total_loss?: string;
      repair_cost?: string;
      flood_damage?: string;
    };
    general_info?: {
      model?: string;
      year?: string;
      usage_type?: string;
      insurance_start_date?: string;
    };
    usage_history?: Array<{
      description: string;
      value: string;
    }>;
    owner_changes?: Array<{
      date: string;
      change_type: string;
      previous_number?: string;
      usage_type: string;
    }>;
    special_accident_history?: Array<{
      type: string;
      value: string;
    }>;
  };
  insurance_v2?: {
    regDate?: string;
    year?: number;
    maker?: string;
    displacement?: number;
    firstDate?: string;
    model?: string;
    myAccidentCnt?: number;
    otherAccidentCnt?: number;
    ownerChangeCnt?: number;
    robberCnt?: number;
    totalLossCnt?: number;
    floodTotalLossCnt?: number;
    government?: number;
    business?: number;
    loan?: number;
    carNoChangeCnt?: number;
    myAccidentCost?: number;
    otherAccidentCost?: number;
    carInfoChanges?: Array<{
      date: string;
      carNo: string;
    }>;
    carInfoUse1s?: string[];
    carInfoUse2s?: string[];
    ownerChanges?: any[];
    accidentCnt?: number;
    accidents?: any[];
  };
  location?: {
    country?: { name: string; iso: string };
    city?: { name: string };
    state?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string;
    is_offsite?: boolean;
    raw?: string;
    offsite?: string;
  };
  inspect?: {
    accident_summary?: {
      main_framework?: string;
      exterior1rank?: string;
      exterior2rank?: string;
      simple_repair?: string;
      accident?: string;
    };
    outer?: Record<string, string[]>;
    inner?: Record<string, string>;
  };
  details?: {
    engine_volume?: number;
    original_price?: number;
    year?: number;
    month?: number;
    first_registration?: {
      year: number;
      month: number;
      day: number;
    };
    badge?: string;
    comment?: string;
    description_ko?: string;
    description_en?: string;
    is_leasing?: boolean;
    sell_type?: string;
    equipment?: any;
    options?: {
      type?: string;
      standard?: string[];
      etc?: string[];
      choice?: string[];
      tuning?: string[];
    };
    inspect_outer?: Array<{
      type: { code: string; title: string };
      statusTypes: Array<{ code: string; title: string }>;
      attributes: string[];
    }>;
    seats_count?: number;
  };
}

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
  lots?: Lot[];
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