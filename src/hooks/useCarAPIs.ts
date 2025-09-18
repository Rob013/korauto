import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CarAPIsFilters } from '@/types/carapis';

// Enhanced vehicle interface for CarAPIs.com
export interface CarAPIsVehicle {
  id: string;
  year: number;
  title: string;
  vin?: string;
  manufacturer: {
    id: number;
    name: string;
  };
  model: {
    id: number;
    name: string;
  };
  generation?: {
    id: number;
    name: string;
  };
  body_type?: string;
  color?: {
    name: string;
    id: number;
  };
  engine?: {
    id: number;
    name: string;
    size?: string;
    cylinders?: number;
    horsepower?: number;
    torque?: number;
  };
  transmission?: {
    name: string;
    id: number;
  };
  drive_wheel?: string;
  vehicle_type?: {
    name: string;
    id: number;
  };
  fuel?: {
    name: string;
    id: number;
  };
  lots: Array<{
    id: string;
    lot?: string;
    lot_number?: string;
    domain?: {
      name: string;
      id: number;
    };
    external_id?: string;
    odometer?: {
      km?: number;
      mi?: number;
      status?: {
        name: string;
        id: number;
      };
    };
    estimate_repair_price?: number;
    pre_accident_price?: number;
    clean_wholesale_price?: number;
    actual_cash_value?: number;
    sale_date?: string;
    bid?: number;
    buy_now?: number;
    final_bid?: number;
    status?: {
      name: string;
      id: number;
    };
    seller?: string;
    seller_type?: string;
    title?: string;
    detailed_title?: string;
    damage?: {
      main?: string;
      second?: string;
    };
    keys_available?: boolean;
    airbags?: boolean;
    condition?: {
      name: string;
      id: number;
    };
    grade_iaai?: string;
    images?: {
      id: number;
      small?: string[];
      normal?: string[];
      big?: string[];
    };
    features?: string[];
    inspection_report?: any;
    equipment?: string[];
    doors?: number;
    seats?: number;
    cargo_capacity?: number;
    fuel_economy?: {
      city?: number;
      highway?: number;
      combined?: number;
    };
    safety_rating?: string;
    emissions_rating?: string;
    co2_emissions?: number;
    msrp?: number;
    book_value?: number;
    trade_in_value?: number;
    accident_history?: string;
    service_records?: string;
    previous_owners?: number;
    warranty_info?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
      zip?: string;
    };
  }>;
}

export interface CarAPIsResponse {
  data: CarAPIsVehicle[];
  total: number;
  page: number;
  per_page: number;
}

export const useCarAPIs = () => {
  const [vehicles, setVehicles] = useState<CarAPIsVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CarAPIsFilters>({});
  const [hasMorePages, setHasMorePages] = useState(true);

  const fetchVehicles = useCallback(async (page = 1, newFilters: CarAPIsFilters = {}, reset = false, endpoint = 'vehicles') => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('car-apis', {
        body: {
          endpoint,
          filters: {
            limit: '50',
            page: page.toString(),
            ...newFilters
          }
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const response = data as CarAPIsResponse;
      
      if (reset) {
        setVehicles(response.data || []);
      } else {
        setVehicles(prev => [...prev, ...(response.data || [])]);
      }
      
      setTotal(response.total || 0);
      setTotalCount(response.total || 0);
      setCurrentPage(response.page || page);
      setHasMorePages((response.data || []).length === 50);
      
      if (reset) {
        setFilters(newFilters);
      }

      console.log('✅ CarAPIs vehicles fetched:', response.data?.length || 0);
      return response.data || [];

    } catch (err: any) {
      console.error('❌ CarAPIs fetch error:', err);
      setError(err.message || 'Failed to fetch vehicles from CarAPIs');
      setVehicles([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllVehicles = useCallback(async (newFilters: CarAPIsFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('car-apis', {
        body: {
          endpoint: 'vehicles',
          filters: {
            limit: '1000', // Fetch more for "show all"
            page: '1',
            ...newFilters
          }
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const response = data as CarAPIsResponse;
      console.log('✅ CarAPIs all vehicles fetched:', response.data?.length || 0);
      return response.data || [];

    } catch (err: any) {
      console.error('❌ CarAPIs fetch all error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVehicleById = useCallback(async (vehicleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('car-apis', {
        body: {
          endpoint: 'vehicle',
          vehicleId
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log('✅ CarAPIs vehicle fetched:', vehicleId);
      return data as CarAPIsVehicle;

    } catch (err: any) {
      console.error('❌ CarAPIs vehicle fetch error:', err);
      setError(err.message || 'Failed to fetch vehicle from CarAPIs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMakes = useCallback(async () => {
    try {
      const { data, error: funcError } = await supabase.functions.invoke('car-apis', {
        body: {
          endpoint: 'makes'
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      return data || [];
    } catch (err: any) {
      console.error('❌ CarAPIs makes fetch error:', err);
      return [];
    }
  }, []);

  const fetchModels = useCallback(async (make?: string) => {
    try {
      const { data, error: funcError } = await supabase.functions.invoke('car-apis', {
        body: {
          endpoint: 'models',
          filters: make ? { make } : {}
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      return data || [];
    } catch (err: any) {
      console.error('❌ CarAPIs models fetch error:', err);
      return [];
    }
  }, []);

  const fetchGenerations = useCallback(async (modelId?: string) => {
    // CarAPIs might not have generations endpoint, return empty array
    console.log('Generations not available in CarAPIs.com yet');
    return [];
  }, []);

  const fetchFilterCounts = useCallback(async (currentFilters: CarAPIsFilters) => {
    // Not implemented in CarAPIs yet
    return null;
  }, []);

  const fetchGrades = useCallback(async () => {
    // Not implemented in CarAPIs yet
    return [];
  }, []);

  const fetchTrimLevels = useCallback(async () => {
    // Not implemented in CarAPIs yet
    return [];
  }, []);

  const loadMore = useCallback(async () => {
    if (hasMorePages && !loading) {
      return fetchVehicles(currentPage + 1, filters, false);
    }
    return [];
  }, [hasMorePages, loading, currentPage, filters, fetchVehicles]);

  // Compatibility functions
  const setCars = useCallback((cars: CarAPIsVehicle[]) => {
    setVehicles(cars);
  }, []);

  // Load initial vehicles on mount
  useEffect(() => {
    fetchVehicles(1, {}, true);
  }, [fetchVehicles]);

  return {
    // Primary data
    vehicles,
    cars: vehicles, // Alias for compatibility
    loading,
    error,
    total,
    totalCount,
    currentPage,
    hasMorePages,
    filters,
    
    // Functions
    fetchVehicles,
    fetchCars: fetchVehicles, // Alias for compatibility
    fetchAllCars: fetchAllVehicles, // Alias for compatibility
    fetchVehicleById,
    fetchMakes,
    fetchManufacturers: fetchMakes, // Alias for compatibility
    fetchModels,
    fetchGenerations,
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    loadMore,
    
    // State setters for compatibility
    setCars,
    setVehicles,
    setFilters,
    setTotalCount,
    
    clearError: () => setError(null)
  };
};