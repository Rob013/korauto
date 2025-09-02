/**
 * Enhanced Database Cars Hook
 * 
 * Provides comprehensive car data from the cars_cache table with full API compatibility
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoRefreshOnSync } from '@/hooks/useCarSync';

interface EnhancedCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  price_cents: number;
  mileage: string;
  fuel: string;
  transmission: string;
  color: string;
  images: any[];
  title: string;
  created_at: string;
  manufacturer: { name: string };
  location: string;
  rank_score?: number;
  lot_number?: string;
  condition?: string;
  body_style?: string;
  drive_type?: string;
  doors?: number;
  seats?: number;
  vin?: string;
  image_url?: string;
}

interface EnhancedCarFilters {
  manufacturer_id?: string;
  model_id?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  fuel_type?: string;
  search?: string;
}

export const useEnhancedDatabaseCars = () => {
  const [cars, setCars] = useState<EnhancedCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [filters, setFilters] = useState<EnhancedCarFilters>({});

  /**
   * Fetch cars with enhanced data from cars_cache
   */
  const fetchCars = useCallback(async (
    page: number = 1,
    sortOptions?: { sort_by?: string; sort_direction?: string },
    resetCars: boolean = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      const limit = 24;
      const offset = (page - 1) * limit;

      // Use the backend global sorting function for optimal performance
      const { data: sortedCars, error: sortError } = await supabase.rpc('cars_global_sorted', {
        p_filters: {
          make: filters.manufacturer_id,
          model: filters.model_id,
          yearMin: filters.from_year ? parseInt(filters.from_year) : undefined,
          yearMax: filters.to_year ? parseInt(filters.to_year) : undefined,
          priceMin: filters.buy_now_price_from ? parseInt(filters.buy_now_price_from) : undefined,
          priceMax: filters.buy_now_price_to ? parseInt(filters.buy_now_price_to) : undefined,
          search: filters.search
        },
        p_sort_field: sortOptions?.sort_by === 'price_low' ? 'price_cents' : 
                     sortOptions?.sort_by === 'price_high' ? 'price_cents' :
                     sortOptions?.sort_by === 'year_new' ? 'year' :
                     sortOptions?.sort_by === 'year_old' ? 'year' : 'price_cents',
        p_sort_dir: sortOptions?.sort_by === 'price_high' ? 'DESC' : 
                   sortOptions?.sort_by === 'year_new' ? 'DESC' :
                   sortOptions?.sort_by === 'year_old' ? 'ASC' : 'ASC',
        p_offset: offset,
        p_limit: limit
      });

      if (sortError) throw sortError;

      // Transform the data to match the expected format
      const transformedCars: EnhancedCar[] = (sortedCars || []).map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: parseFloat(car.price?.toString() || '0'),
        price_cents: car.price_cents || 0,
        mileage: car.mileage || '0',
        fuel: car.fuel || 'Unknown',
        transmission: car.transmission || 'Unknown',
        color: car.color || 'Unknown',
        images: Array.isArray(car.images) ? car.images : [],
        title: car.title || `${car.make} ${car.model} ${car.year}`,
        created_at: car.created_at,
        manufacturer: { name: car.make },
        location: car.location || 'South Korea',
        rank_score: car.rank_score,
        lot_number: car.id,
        image_url: car.image_url
      }));

      if (resetCars) {
        setCars(transformedCars);
      } else {
        setCars(prev => [...prev, ...transformedCars]);
      }

      setTotalCount(transformedCars.length > 0 ? Math.max(totalCount, transformedCars.length * page) : totalCount);
      setHasMorePages(transformedCars.length === limit);

      return {
        items: transformedCars,
        total: totalCount,
        nextCursor: transformedCars.length === limit ? page + 1 : undefined
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      console.error('Enhanced database cars fetch error:', err);
      return { items: [], total: 0, nextCursor: undefined };
    } finally {
      setLoading(false);
    }
  }, [filters, totalCount]);

  /**
   * Get available manufacturers
   */
  const fetchManufacturers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cars_cache')
        .select('make')
        .not('make', 'is', null)
        .limit(1000);

      if (error) throw error;

      const manufacturers = Array.from(new Set(data?.map(car => car.make) || []))
        .sort()
        .map((make, index) => ({ id: index + 1, name: make }));

      return manufacturers;
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      return [];
    }
  }, []);

  /**
   * Get available models for a manufacturer
   */
  const fetchModels = useCallback(async (manufacturerId: string) => {
    try {
      const manufacturers = await fetchManufacturers();
      const manufacturer = manufacturers.find(m => m.id.toString() === manufacturerId);
      
      if (!manufacturer) return [];

      const { data, error } = await supabase
        .from('cars_cache')
        .select('model')
        .eq('make', manufacturer.name)
        .not('model', 'is', null)
        .limit(1000);

      if (error) throw error;

      const models = Array.from(new Set(data?.map(car => car.model) || []))
        .sort()
        .map((model, index) => ({ id: index + 1, name: model, manufacturer_id: manufacturerId }));

      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }, [fetchManufacturers]);

  /**
   * Auto-refresh when sync completes
   */
  useAutoRefreshOnSync(() => {
    if (cars.length > 0) {
      fetchCars(1, undefined, true);
    }
  });

  return {
    cars,
    loading,
    error,
    totalCount,
    hasMorePages,
    filters,
    fetchCars,
    fetchAllCars: fetchCars, // Alias for compatibility
    loadMore: () => fetchCars(Math.floor(cars.length / 24) + 1),
    fetchManufacturers,
    fetchModels,
    fetchGenerations: async () => [], // Not implemented yet
    fetchAllGenerationsForManufacturer: async () => [], // Not implemented yet
    fetchFilterCounts: async () => ({}), // Not implemented yet
    fetchGrades: async () => [], // Not implemented yet
    fetchTrimLevels: async () => [], // Not implemented yet
    refreshCars: () => fetchCars(1, undefined, true),
    clearCache: () => setCars([]),
    setCars,
    setTotalCount,
    setLoading,
    setFilters,
  };
};