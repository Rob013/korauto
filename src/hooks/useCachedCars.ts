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

  // Fetch all cars from cache with filters
  const fetchCars = useCallback(async (appliedFilters: APIFilters = {}): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('cars_cache')
        .select('*', { count: 'exact' });

      // Apply filters - map API filter names to cache column names
      if (appliedFilters.manufacturer_id) {
        // manufacturer_id in API corresponds to make in cache
        const { data: makeData } = await supabase
          .from('cars_cache')
          .select('make')
          .limit(1000);
        
        // For now just use the make field directly if it matches
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

      // Order by updated date
      query = query.order('updated_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Error fetching cached cars:', fetchError);
        setError(fetchError.message);
        return [];
      }

      // Transform and filter out sold cars
      const transformed = (data || [])
        .map(transformCachedCarRecord)
        .filter(car => !isCarSold(car));

      setCars(transformed);
      setTotalCount(count || transformed.length);
      setHasMorePages(false); // All data loaded from cache

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
    await fetchCars(filters);
  }, [fetchCars, filters]);
  const clearCarsCache = useCallback(() => {
    setCars([]);
  }, []);
  const fetchAllCars = useCallback(async (appliedFilters: APIFilters = {}) => {
    return await fetchCars(appliedFilters);
  }, [fetchCars]);

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
