import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuctionsApiSupabase } from './useAuctionsApiSupabase';

export interface UnifiedCar {
  id: string;
  external_id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  title?: string;
  vin?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
  condition?: string;
  location?: string;
  lot_number?: string;
  current_bid?: number;
  buy_now_price?: number;
  final_bid?: number;
  sale_date?: string;
  image_url?: string;
  images?: string[] | any;
  source_api: string;
  domain_name?: string;
  status?: string;
  is_active?: boolean;
  is_live?: boolean;
  is_archived?: boolean;
  keys_available?: boolean;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
}

export interface UnifiedCarsFilters {
  make?: string[];
  model?: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuel?: string[];
  transmission?: string[];
  color?: string[];
  condition?: string[];
  location?: string[];
  source_api?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface UnifiedCarsResponse {
  cars: UnifiedCar[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

export const useUnifiedCars = (filters: UnifiedCarsFilters = {}): UnifiedCarsResponse => {
  const [cars, setCars] = useState<UnifiedCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Auctions API integration
  const {
    cars: auctionsCars,
    isLoading: auctionsLoading,
    error: auctionsError,
    fetchAllCars: fetchAuctionsCars
  } = useAuctionsApiSupabase({
    autoStart: false
  });

  // Fetch cars from database
  const fetchCarsFromDB = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching unified cars from database...');
      
      let query = supabase
        .from('cars')
        .select('*', { count: 'exact' })
        .eq('is_archived', false)
        .eq('is_active', true);

      // Apply filters
      if (filters.make && filters.make.length > 0) {
        query = query.in('make', filters.make);
      }
      
      if (filters.model && filters.model.length > 0) {
        query = query.in('model', filters.model);
      }
      
      if (filters.yearMin) {
        query = query.gte('year', filters.yearMin);
      }
      
      if (filters.yearMax) {
        query = query.lte('year', filters.yearMax);
      }
      
      if (filters.priceMin) {
        query = query.gte('price', filters.priceMin);
      }
      
      if (filters.priceMax) {
        query = query.lte('price', filters.priceMax);
      }
      
      if (filters.fuel && filters.fuel.length > 0) {
        query = query.in('fuel', filters.fuel);
      }
      
      if (filters.transmission && filters.transmission.length > 0) {
        query = query.in('transmission', filters.transmission);
      }
      
      if (filters.color && filters.color.length > 0) {
        query = query.in('color', filters.color);
      }
      
      if (filters.condition && filters.condition.length > 0) {
        query = query.in('condition', filters.condition);
      }
      
      if (filters.location && filters.location.length > 0) {
        query = query.in('location', filters.location);
      }
      
      if (filters.source_api && filters.source_api.length > 0) {
        query = query.in('source_api', filters.source_api);
      }
      
      if (filters.search) {
        query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,title.ilike.%${filters.search}%,vin.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'last_synced_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 24;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error('❌ Error fetching cars from database:', queryError);
        throw queryError;
      }

      console.log(`✅ Fetched ${data?.length || 0} cars from database (total: ${count})`);
      
      setCars(data || []);
      setTotal(count || 0);

    } catch (err: any) {
      console.error('❌ Error in fetchCarsFromDB:', err);
      setError(err.message || 'Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch cars from Auctions API
  const fetchCarsFromAuctions = useCallback(async () => {
    try {
      console.log('🔄 Fetching cars from Auctions API...');
      await fetchAuctionsCars();
    } catch (err: any) {
      console.error('❌ Error fetching from Auctions API:', err);
    }
  }, [fetchAuctionsCars]);

  // Merge cars from all sources
  const mergedCars = useMemo(() => {
    const allCars = [...cars];
    
    // Add auctions cars if available and not already in database
    if (auctionsCars && auctionsCars.length > 0) {
      const existingIds = new Set(cars.map(car => car.id));
      const newAuctionsCars = auctionsCars
        .filter(auctionsCar => !existingIds.has(auctionsCar.id))
        .map(auctionsCar => ({
          ...auctionsCar,
          source_api: 'auctions_api',
          domain_name: 'auctionsapi_com',
          is_active: true,
          is_archived: false,
          status: 'active'
        }));
      
      allCars.push(...newAuctionsCars);
    }
    
    return allCars;
  }, [cars, auctionsCars]);

  // Apply client-side filtering for merged cars
  const filteredCars = useMemo(() => {
    let filtered = [...mergedCars];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(car => 
        car.make?.toLowerCase().includes(searchTerm) ||
        car.model?.toLowerCase().includes(searchTerm) ||
        car.title?.toLowerCase().includes(searchTerm) ||
        car.vin?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply source filter
    if (filters.source_api && filters.source_api.length > 0) {
      filtered = filtered.filter(car => 
        filters.source_api!.includes(car.source_api)
      );
    }
    
    return filtered;
  }, [mergedCars, filters]);

  // Calculate pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 24;
  const totalPages = Math.ceil(filteredCars.length / pageSize);
  const paginatedCars = filteredCars.slice((page - 1) * pageSize, page * pageSize);

  // Load cars on mount and when filters change
  useEffect(() => {
    fetchCarsFromDB();
  }, [fetchCarsFromDB]);

  // Load auctions cars on mount
  useEffect(() => {
    fetchCarsFromAuctions();
  }, [fetchCarsFromAuctions]);

  return {
    cars: paginatedCars,
    total: filteredCars.length,
    page,
    totalPages,
    hasMore: page < totalPages,
    loading: loading || auctionsLoading,
    error: error || auctionsError
  };
};

export default useUnifiedCars;
