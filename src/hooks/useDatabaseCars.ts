/**
 * Database Cars Hook
 * 
 * This hook provides direct access to the local car database with proper backend sorting,
 * replacing the external API calls for better performance and global sorting support.
 */

import { useState, useCallback, useEffect } from 'react';
import { fetchCarsWithKeyset, CarFilters, SortOption, FrontendSortOption, mapFrontendSortToBackend } from '@/services/carsApi';
import { supabase } from '@/integrations/supabase/client';
import { useAutoRefreshOnSync } from '@/hooks/useCarSync';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  color?: string;
  location?: string;
  images?: any;
  image_url?: string;
  title?: string;
  created_at?: string;
  price_cents?: number;
  rank_score?: number;
}

interface UseDatabaseCarsState {
  cars: Car[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasMorePages: boolean;
  nextCursor?: string;
}

interface UseDatabaseCarsOptions {
  pageSize?: number;
  enableCaching?: boolean;
}

export const useDatabaseCars = (options: UseDatabaseCarsOptions = {}) => {
  const { pageSize = 24, enableCaching = true } = options;
  
  const [state, setState] = useState<UseDatabaseCarsState>({
    cars: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasMorePages: false,
    nextCursor: undefined
  });

  // Filter state for compatibility with existing catalog
  const [filters, setFilters] = useState<any>({});

  // Cache for filters and manufacturers data
  const [manufacturersCache, setManufacturersCache] = useState<any[]>([]);
  const [modelsCache, setModelsCache] = useState<Map<string, any[]>>(new Map());

  /**
   * Fetch cars with backend sorting and pagination
   * Compatible with useSecureAuctionAPI interface
   */
  const fetchCars = useCallback(async (
    page: number = 1,
    newFilters: any = {},
    resetList: boolean = true
  ) => {
    if (resetList) {
      setState(prev => ({ ...prev, loading: true, error: null, currentPage: page }));
      setFilters(newFilters);
    }

    try {
      // Convert API filters to CarFilters format for database query
      const dbFilters: CarFilters = {};
      
      if (newFilters.manufacturer_id) dbFilters.make = newFilters.manufacturer_id;
      if (newFilters.model_id) dbFilters.model = newFilters.model_id;
      if (newFilters.from_year) dbFilters.yearMin = newFilters.from_year;
      if (newFilters.to_year) dbFilters.yearMax = newFilters.to_year;
      if (newFilters.buy_now_price_from) dbFilters.priceMin = newFilters.buy_now_price_from;
      if (newFilters.buy_now_price_to) dbFilters.priceMax = newFilters.buy_now_price_to;
      if (newFilters.fuel_type) dbFilters.fuel = newFilters.fuel_type;
      if (newFilters.search) dbFilters.search = newFilters.search;

      // Extract sort parameters
      let sortBy: SortOption | FrontendSortOption = 'recently_added';
      if (newFilters.sort_by && newFilters.sort_direction) {
        // Map database sort parameters to frontend sort options
        if (newFilters.sort_by === 'price') {
          sortBy = newFilters.sort_direction === 'asc' ? 'price_low' : 'price_high';
        } else if (newFilters.sort_by === 'year') {
          sortBy = newFilters.sort_direction === 'desc' ? 'year_new' : 'year_old';
        } else if (newFilters.sort_by === 'mileage') {
          sortBy = newFilters.sort_direction === 'asc' ? 'mileage_low' : 'mileage_high';
        } else if (newFilters.sort_by === 'created_at') {
          sortBy = newFilters.sort_direction === 'desc' ? 'recently_added' : 'oldest_first';
        }
      }

      // Map frontend sort option to backend sort option
      const backendSort = mapFrontendSortToBackend(sortBy);
      
      // Calculate cursor for pagination (if not page 1)
      let cursor: string | undefined;
      if (page > 1 && state.nextCursor) {
        cursor = state.nextCursor;
      }

      console.log(`🔄 Fetching cars: page ${page}, sort: ${sortBy} (${backendSort}), filters:`, dbFilters);

      const response = await fetchCarsWithKeyset({
        filters: dbFilters,
        sort: backendSort,
        limit: pageSize,
        cursor: resetList ? undefined : cursor
      });

      const newCars = response.items.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        mileage: car.mileage,
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        location: car.location,
        images: car.images,
        image_url: car.image_url,
        title: car.title || `${car.year} ${car.make} ${car.model}`,
        created_at: car.created_at,
        price_cents: car.price_cents,
        rank_score: car.rank_score,
        // Add compatibility fields for catalog
        manufacturer: { name: car.make },
        lots: [{
          buy_now: car.price,
          images: { normal: car.images || [] },
          odometer: { km: car.mileage }
        }]
      }));

      const totalPages = Math.ceil(response.total / pageSize);
      const hasMore = !!response.nextCursor;

      setState(prev => ({
        ...prev,
        cars: resetList ? newCars : [...prev.cars, ...newCars],
        totalCount: response.total,
        currentPage: page,
        hasMorePages: hasMore,
        nextCursor: response.nextCursor,
        loading: false
      }));

      console.log(`✅ Fetched ${newCars.length} cars (${response.total} total)`);

    } catch (error) {
      console.error('❌ Error fetching cars:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cars'
      }));
    }
  }, [pageSize, state.nextCursor]);

  /**
   * Fetch all cars for global sorting (used for "Show All" functionality)
   * Compatible with useSecureAuctionAPI interface
   */
  const fetchAllCars = useCallback(async (
    filtersWithSort: any = {}
  ): Promise<Car[]> => {
    try {
      // Convert API filters to CarFilters format for database query
      const dbFilters: CarFilters = {};
      
      if (filtersWithSort.manufacturer_id) dbFilters.make = filtersWithSort.manufacturer_id;
      if (filtersWithSort.model_id) dbFilters.model = filtersWithSort.model_id;
      if (filtersWithSort.from_year) dbFilters.yearMin = filtersWithSort.from_year;
      if (filtersWithSort.to_year) dbFilters.yearMax = filtersWithSort.to_year;
      if (filtersWithSort.buy_now_price_from) dbFilters.priceMin = filtersWithSort.buy_now_price_from;
      if (filtersWithSort.buy_now_price_to) dbFilters.priceMax = filtersWithSort.buy_now_price_to;
      if (filtersWithSort.fuel_type) dbFilters.fuel = filtersWithSort.fuel_type;
      if (filtersWithSort.search) dbFilters.search = filtersWithSort.search;

      // Extract sort parameters
      let sortBy: SortOption | FrontendSortOption = 'recently_added';
      if (filtersWithSort.sort_by && filtersWithSort.sort_direction) {
        // Map database sort parameters to frontend sort options
        if (filtersWithSort.sort_by === 'price') {
          sortBy = filtersWithSort.sort_direction === 'asc' ? 'price_low' : 'price_high';
        } else if (filtersWithSort.sort_by === 'year') {
          sortBy = filtersWithSort.sort_direction === 'desc' ? 'year_new' : 'year_old';
        } else if (filtersWithSort.sort_by === 'mileage') {
          sortBy = filtersWithSort.sort_direction === 'asc' ? 'mileage_low' : 'mileage_high';
        } else if (filtersWithSort.sort_by === 'created_at') {
          sortBy = filtersWithSort.sort_direction === 'desc' ? 'recently_added' : 'oldest_first';
        }
      }
      
      const backendSort = mapFrontendSortToBackend(sortBy);
      
      console.log(`🔄 Fetching ALL cars for global sorting: ${sortBy} (${backendSort})`);

      const response = await fetchCarsWithKeyset({
        filters: dbFilters,
        sort: backendSort,
        limit: 9999 // Get all cars for global sorting
      });

      const allCars = response.items.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        mileage: car.mileage,
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        location: car.location,
        images: car.images,
        image_url: car.image_url,
        title: car.title || `${car.year} ${car.make} ${car.model}`,
        created_at: car.created_at,
        price_cents: car.price_cents,
        rank_score: car.rank_score,
        // Add compatibility fields for catalog
        manufacturer: { name: car.make },
        lots: [{
          buy_now: car.price,
          images: { normal: car.images || [] },
          odometer: { km: car.mileage }
        }]
      }));

      console.log(`✅ Fetched ${allCars.length} cars for global sorting`);
      return allCars;

    } catch (error) {
      console.error('❌ Error fetching all cars:', error);
      throw error;
    }
  }, []);

  /**
   * Load more cars (for infinite scroll)
   * Compatible with useSecureAuctionAPI interface
   */
  const loadMore = useCallback(async () => {
    if (!state.hasMorePages || state.loading) return;
    
    await fetchCars(state.currentPage + 1, filters, false);
  }, [fetchCars, state.hasMorePages, state.loading, state.currentPage, filters]);

  /**
   * Fetch manufacturers from database
   */
  const fetchManufacturers = useCallback(async () => {
    if (manufacturersCache.length > 0 && enableCaching) {
      return manufacturersCache;
    }

    try {
      const { data, error } = await supabase
        .from('car_manufacturers')
        .select('*')
        .order('name');

      if (error) throw error;

      const manufacturers = data || [];
      if (enableCaching) {
        setManufacturersCache(manufacturers);
      }
      
      return manufacturers;
    } catch (error) {
      console.error('❌ Error fetching manufacturers:', error);
      return [];
    }
  }, [manufacturersCache, enableCaching]);

  /**
   * Fetch models for a manufacturer
   */
  const fetchModels = useCallback(async (manufacturerId: string) => {
    const cacheKey = manufacturerId;
    if (modelsCache.has(cacheKey) && enableCaching) {
      return modelsCache.get(cacheKey) || [];
    }

    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('*')
        .eq('manufacturer_id', manufacturerId)
        .order('name');

      if (error) throw error;

      const models = data || [];
      if (enableCaching) {
        setModelsCache(prev => new Map(prev).set(cacheKey, models));
      }
      
      return models;
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      return [];
    }
  }, [modelsCache, enableCaching]);

  /**
   * Refresh car data (useful after sync operations)
   */
  const refreshCars = useCallback(async (
    filtersToUse: any = filters
  ) => {
    setState(prev => ({ ...prev, nextCursor: undefined }));
    await fetchCars(1, filtersToUse, true);
  }, [fetchCars, filters]);

  /**
   * Force refresh with newest cars (useful to see newly synced cars)
   */
  const refreshWithNewestCars = useCallback(async () => {
    console.log('🔄 Refreshing to show newest cars...');
    setState(prev => ({ ...prev, nextCursor: undefined }));
    await fetchCars(1, {}, true); // No filters, will show newest cars by default
  }, [fetchCars]);

  /**
   * Fetch generations for a model (placeholder for compatibility)
   */
  const fetchGenerations = useCallback(async (modelId: string) => {
    // For now, return empty array - this can be implemented later if needed
    console.log('📝 fetchGenerations called for model:', modelId);
    return [];
  }, []);

  /**
   * Fetch all generations for a manufacturer (placeholder for compatibility)
   */
  const fetchAllGenerationsForManufacturer = useCallback(async (manufacturerId: string) => {
    console.log('📝 fetchAllGenerationsForManufacturer called for manufacturer:', manufacturerId);
    return [];
  }, []);

  /**
   * Fetch filter counts (placeholder for compatibility)
   */
  const fetchFilterCounts = useCallback(async () => {
    console.log('📝 fetchFilterCounts called');
    return {};
  }, []);

  /**
   * Fetch grades (placeholder for compatibility)
   */
  const fetchGrades = useCallback(async () => {
    console.log('📝 fetchGrades called');
    return [];
  }, []);

  /**
   * Fetch trim levels (placeholder for compatibility)
   */
  const fetchTrimLevels = useCallback(async () => {
    console.log('📝 fetchTrimLevels called');
    return [];
  }, []);

  /**
   * Clear cache (useful when data might be stale)
   */
  const clearCache = useCallback(() => {
    setManufacturersCache([]);
    setModelsCache(new Map());
  }, []);

  // Auto-refresh when new cars are synced
  useAutoRefreshOnSync(refreshWithNewestCars);

  return {
    // State
    cars: state.cars,
    loading: state.loading,
    error: state.error,
    totalCount: state.totalCount,
    currentPage: state.currentPage,
    hasMorePages: state.hasMorePages,
    
    // Actions
    fetchCars,
    fetchAllCars,
    loadMore,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer,
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    refreshCars,
    refreshWithNewestCars,
    clearCache,
    
    // Utilities and compatibility
    setCars: (cars: Car[]) => setState(prev => ({ ...prev, cars })),
    setTotalCount: (count: number) => setState(prev => ({ ...prev, totalCount: count })),
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading })),
    setFilters: (newFilters: any) => {
      console.log('📝 setFilters called with:', newFilters);
      setFilters(newFilters);
    },
    filters
  };
};