import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { transformCachedCarRecord, isCarSold } from '@/services/carCache';
import { APIFilters } from '@/utils/catalog-filter';

export const useCachedCars = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<APIFilters>({});
  const [totalCount, setTotalCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);

  // Fetch paginated cars from cache with filters - SHOW ALL AVAILABLE CARS
  const fetchCars = useCallback(async (appliedFilters: APIFilters = {}, page: number = 1, pageSize: number = 200): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('cars_cache')
        .select('*', { count: 'exact' })
        .not('sale_status', 'in', '(sold,archived)')  // Filter out sold/archived cars
        .not('price_cents', 'is', null)  // Only cars with valid prices
        .gt('price_cents', 0);  // Price must be positive

      // Apply filters - map API filter names to cache column names
      if (appliedFilters.manufacturer_id) {
        query = query.ilike('make', `%${appliedFilters.manufacturer_id}%`);
      }
      
      if (appliedFilters.model_id) {
        query = query.ilike('model', `%${appliedFilters.model_id}%`);
      }
      
      if (appliedFilters.from_year) {
        query = query.gte('year', parseInt(appliedFilters.from_year));
      }
      
      if (appliedFilters.to_year) {
        query = query.lte('year', parseInt(appliedFilters.to_year));
      }
      
      if (appliedFilters.buy_now_price_from) {
        query = query.gte('price_cents', parseInt(appliedFilters.buy_now_price_from) * 100);
      }
      
      if (appliedFilters.buy_now_price_to) {
        query = query.lte('price_cents', parseInt(appliedFilters.buy_now_price_to) * 100);
      }
      
      if (appliedFilters.fuel_type) {
        query = query.eq('fuel', appliedFilters.fuel_type);
      }
      
      if (appliedFilters.transmission) {
        query = query.eq('transmission', appliedFilters.transmission);
      }
      
      if (appliedFilters.color) {
        query = query.eq('color', appliedFilters.color);
      }

      // Order by rank score (best cars first) then updated date
      query = query
        .order('rank_score', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .range(from, to);  // Paginate results

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Error fetching cached cars:', fetchError);
        setError(fetchError.message);
        return [];
      }

      console.log(`✅ Fetched ${data?.length || 0} cars (page ${page}) out of ${count || 0} total available cars`);

      // Transform cars (they're already filtered in the query)
      const transformed = (data || []).map(transformCachedCarRecord);

      setCars(transformed);
      setTotalCount(count || 0);
      setHasMorePages((count || 0) > (page * pageSize));

      return transformed;
    } catch (err) {
      console.error('Failed to fetch cached cars:', err);
      setError('Failed to fetch cached cars');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch manufacturers from cache
  const fetchManufacturers = useCallback(async (appliedFilters: APIFilters = {}, page: number = 1, perPage: number = 500) => {
    try {
      const { data, error } = await supabase
        .from('cars_cache')
        .select('make')
        .order('make');

      if (error) throw error;

      const uniqueMakes = [...new Set(data.map(item => item.make))].filter(Boolean);
      return uniqueMakes.map((make, index) => ({
        id: index,
        name: make
      }));
    } catch (err) {
      console.error('Failed to fetch manufacturers:', err);
      return [];
    }
  }, []);

  // Fetch models for a manufacturer
  const fetchModels = useCallback(async (manufacturerName?: string) => {
    try {
      let query = supabase
        .from('cars_cache')
        .select('model');
      
      if (manufacturerName) {
        query = query.ilike('make', `%${manufacturerName}%`);
      }
      
      const { data, error } = await query.order('model');

      if (error) throw error;

      const uniqueModels = [...new Set(data.map(item => item.model))].filter(Boolean);
      return uniqueModels.map((model, index) => ({
        id: index,
        name: model
      }));
    } catch (err) {
      console.error('Failed to fetch models:', err);
      return [];
    }
  }, []);

  // Stub implementations for compatibility with useSecureAuctionAPI
  const fetchGenerations = useCallback(async (manufacturerName: string, modelName: string) => [], []);
  const fetchAllGenerationsForManufacturer = useCallback(async (manufacturerName: string) => [], []);
  const fetchFilterCounts = useCallback(async (appliedFilters: APIFilters) => ({ 
    makes: [], 
    models: [], 
    years: [] 
  }), []);
  const fetchGrades = useCallback(async (manufacturerName: string, modelName: string) => [], []);
  const fetchTrimLevels = useCallback(async (manufacturerId?: string, modelId?: string) => {
    return [];
  }, []);
  const loadMore = useCallback(async () => {}, []);
  const refreshInventory = useCallback(async () => {
    await fetchCars(filters, 1, 200);
  }, [fetchCars, filters]);
  const clearCarsCache = useCallback(() => {
    setCars([]);
  }, []);
  const fetchAllCars = useCallback(async (appliedFilters: APIFilters = {}): Promise<any[]> => {
    try {
      console.log('📊 Fetching all available cars for global sorting with filters:', appliedFilters);
      
      let query = supabase
        .from('cars_cache')
        .select('*')
        .not('sale_status', 'in', '(sold,archived)')
        .not('price_cents', 'is', null)
        .gt('price_cents', 0);

      // Apply same filters as fetchCars
      if (appliedFilters.manufacturer_id) {
        query = query.ilike('make', `%${appliedFilters.manufacturer_id}%`);
      }
      
      if (appliedFilters.model_id) {
        query = query.ilike('model', `%${appliedFilters.model_id}%`);
      }
      
      if (appliedFilters.from_year) {
        query = query.gte('year', parseInt(appliedFilters.from_year));
      }
      
      if (appliedFilters.to_year) {
        query = query.lte('year', parseInt(appliedFilters.to_year));
      }
      
      if (appliedFilters.buy_now_price_from) {
        query = query.gte('price_cents', parseInt(appliedFilters.buy_now_price_from) * 100);
      }
      
      if (appliedFilters.buy_now_price_to) {
        query = query.lte('price_cents', parseInt(appliedFilters.buy_now_price_to) * 100);
      }
      
      if (appliedFilters.fuel_type) {
        query = query.eq('fuel', appliedFilters.fuel_type);
      }
      
      if (appliedFilters.transmission) {
        query = query.eq('transmission', appliedFilters.transmission);
      }
      
      if (appliedFilters.color) {
        query = query.eq('color', appliedFilters.color);
      }

      // Order and limit for global sorting - fetch more cars for better sorting
      query = query
        .order('rank_score', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .limit(5000);  // Increased limit for better global sorting coverage

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('❌ Error fetching all cars:', fetchError);
        return [];
      }

      console.log(`✅ Fetched ${data?.length || 0} cars for global sorting`);
      return (data || []).map(transformCachedCarRecord);
    } catch (err) {
      console.error('Failed to fetch all cars:', err);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCars(filters);
  }, []);

  return {
    cars,
    setCars,
    loading,
    error,
    totalCount,
    setTotalCount,
    hasMorePages,
    fetchCars,
    fetchAllCars,
    filters,
    setFilters,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer,
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    loadMore,
    refreshInventory,
    clearCarsCache,
  };
};
