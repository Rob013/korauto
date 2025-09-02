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

/**
 * Generate generation name from year, make and model
 * Groups cars into logical generations based on year ranges
 */
const generateGenerationNameFromYear = (year: number, make?: string, model?: string): string | null => {
  if (!year || year < 1980 || year > new Date().getFullYear() + 1) return null;
  
  // Group into 7-year generations (common car generation cycle)
  const generationStart = Math.floor((year - 1980) / 7) * 7 + 1980;
  const generationEnd = generationStart + 6;
  
  // Create generation name
  const currentYear = new Date().getFullYear();
  if (generationEnd > currentYear) {
    return `${generationStart}-${currentYear}`;
  }
  
  return `${generationStart}-${generationEnd}`;
};

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

interface DatabaseCarFilters {
  manufacturer_id?: string;
  model_id?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  fuel_type?: string;
  search?: string;
  generation_id?: string;
  color?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  seats_count?: string;
  grade_iaai?: string;
  sort_by?: string;
  sort_direction?: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export const useDatabaseCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [filters, setFilters] = useState<DatabaseCarFilters>({});
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    totalPages: 0,
    totalCount: 0,
    hasMore: false
  });

  /**
   * Fetch cars from cars_cache table with proper error handling
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

      // Use backend global sorting for optimal performance
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

      // Get the actual total count from cars_cache for accurate pagination
      // We need to run a separate count query since the RPC doesn't return total count
      let actualTotalCount = totalCount; // Keep existing count as fallback
      
      if (page === 1 || resetCars) {
        // Only fetch total count on first page or when resetting to avoid unnecessary queries
        try {
          let countQuery = supabase
            .from('cars_cache')
            .select('*', { count: 'exact', head: true });

          // Apply the same filters to count query
          if (filters.manufacturer_id) {
            countQuery = countQuery.eq('make', filters.manufacturer_id);
          }
          if (filters.model_id) {
            countQuery = countQuery.eq('model', filters.model_id);
          }
          if (filters.from_year) {
            countQuery = countQuery.gte('year', parseInt(filters.from_year));
          }
          if (filters.to_year) {
            countQuery = countQuery.lte('year', parseInt(filters.to_year));
          }
          if (filters.buy_now_price_from) {
            countQuery = countQuery.gte('price_cents', parseInt(filters.buy_now_price_from) * 100);
          }
          if (filters.buy_now_price_to) {
            countQuery = countQuery.lte('price_cents', parseInt(filters.buy_now_price_to) * 100);
          }
          if (filters.search) {
            countQuery = countQuery.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
          }

          const { count, error: countError } = await countQuery;
          
          if (!countError && count !== null) {
            actualTotalCount = count;
            console.log(`📊 Database: Total count for current filters: ${actualTotalCount}`);
          } else {
            console.warn('⚠️ Failed to get filtered count, using previous total:', countError);
          }
        } catch (countErr) {
          console.warn('⚠️ Error fetching total count:', countErr);
        }
      }

      // Transform the data to match Car interface
      const transformedCars: Car[] = (sortedCars || []).map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: parseFloat(car.price?.toString() || '0'),
        price_cents: car.price_cents,
        mileage: parseInt(car.mileage?.toString() || '0'),
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        location: car.location,
        images: Array.isArray(car.images) ? car.images : [],
        image_url: car.image_url,
        title: car.title,
        created_at: car.created_at,
        rank_score: car.rank_score
      }));

      if (resetCars) {
        setCars(transformedCars);
      } else {
        setCars(prev => [...prev, ...transformedCars]);
      }

      // Use the actual total count from the database instead of calculating from page results
      setTotalCount(actualTotalCount);
      setHasMorePages(transformedCars.length === limit);

      setPagination({
        page,
        totalPages: Math.ceil(actualTotalCount / limit),
        totalCount: actualTotalCount,
        hasMore: transformedCars.length === limit
      });

      return {
        items: transformedCars,
        total: actualTotalCount,
        nextCursor: transformedCars.length === limit ? page + 1 : undefined
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      console.error('Database cars fetch error:', err);
      return { items: [], total: 0, nextCursor: undefined };
    } finally {
      setLoading(false);
    }
  }, [filters, totalCount]);

  /**
   * Load more cars (pagination)
   */
  const loadMore = useCallback(() => {
    if (hasMorePages && !loading) {
      const nextPage = Math.floor(cars.length / 24) + 1;
      fetchCars(nextPage);
    }
  }, [hasMorePages, loading, cars.length, fetchCars]);

  /**
   * Get available manufacturers from cars_cache
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
        .map((make, index) => ({ 
          id: index + 1, 
          name: make,
          cars_qty: 0,
          car_count: 0
        }));

      return manufacturers;
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      return [];
    }
  }, []);

  /**
   * Get available models for a manufacturer from cars_cache
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
        .map((model, index) => ({ 
          id: index + 1, 
          name: model, 
          manufacturer_id: parseInt(manufacturerId),
          cars_qty: 0,
          car_count: 0
        }));

      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }, [fetchManufacturers]);

  /**
   * Fetch generations (placeholder implementation)
   */
  const fetchGenerations = useCallback(async () => {
    // Generate some sample generations based on years
    const currentYear = new Date().getFullYear();
    const generations = [];
    
    for (let year = 1980; year <= currentYear; year += 7) {
      const endYear = Math.min(year + 6, currentYear);
      generations.push({
        id: generations.length + 1,
        name: `${year}-${endYear}`,
        cars_qty: 0
      });
    }
    
    return generations;
  }, []);

  /**
   * Get all generations for a manufacturer
   */
  const fetchAllGenerationsForManufacturer = useCallback(async (manufacturerId: string) => {
    return await fetchGenerations();
  }, [fetchGenerations]);

  /**
   * Fetch filter counts from cars_cache
   */
  const fetchFilterCounts = useCallback(async (currentFilters: any = {}) => {
    try {
      // Build query with current filters
      let query = supabase
        .from('cars_cache')
        .select('make, model, fuel, transmission, body_style, drive_type, doors, seats, year, color')
        .limit(10000); // Get enough data for accurate filter counts

      // Apply manufacturer filter if specified
      if (currentFilters.manufacturer_id) {
        const manufacturers = await fetchManufacturers();
        const manufacturer = manufacturers.find(m => m.id.toString() === currentFilters.manufacturer_id);
        if (manufacturer) {
          query = query.eq('make', manufacturer.name);
        }
      }

      // Apply model filter if specified
      if (currentFilters.model_id && currentFilters.manufacturer_id) {
        const models = await fetchModels(currentFilters.manufacturer_id);
        const model = models.find(m => m.id.toString() === currentFilters.model_id);
        if (model) {
          query = query.eq('model', model.name);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Count occurrences of each filter value
      const counts = {
        manufacturers: new Map<string, number>(),
        models: new Map<string, number>(),
        fuelTypes: new Map<string, number>(),
        transmissions: new Map<string, number>(),
        years: new Map<number, number>(),
        colors: new Map<string, number>(),
        generations: new Map<string, number>(),
        bodyTypes: new Map<string, number>(),
        driveTypes: new Map<string, number>(),
        doors: new Map<number, number>(),
        seats: new Map<number, number>(),
      };

      // Only count if we have valid data array
      if (Array.isArray(data)) {
        data.forEach(car => {
          if (car?.make) counts.manufacturers.set(car.make, (counts.manufacturers.get(car.make) || 0) + 1);
          if (car?.model) counts.models.set(car.model, (counts.models.get(car.model) || 0) + 1);
          if (car?.fuel) counts.fuelTypes.set(car.fuel, (counts.fuelTypes.get(car.fuel) || 0) + 1);
          if (car?.transmission) counts.transmissions.set(car.transmission, (counts.transmissions.get(car.transmission) || 0) + 1);
          if (car?.body_style) counts.bodyTypes.set(car.body_style, (counts.bodyTypes.get(car.body_style) || 0) + 1);
          if (car?.drive_type) counts.driveTypes.set(car.drive_type, (counts.driveTypes.get(car.drive_type) || 0) + 1);
          if (car?.doors) counts.doors.set(car.doors, (counts.doors.get(car.doors) || 0) + 1);
          if (car?.seats) counts.seats.set(car.seats, (counts.seats.get(car.seats) || 0) + 1);
          if (car?.year) {
            counts.years.set(car.year, (counts.years.get(car.year) || 0) + 1);
            // Generate generation data from years (group into generations based on year ranges)
            const generationName = generateGenerationNameFromYear(car.year, car.make, car.model);
            if (generationName) {
              counts.generations.set(generationName, (counts.generations.get(generationName) || 0) + 1);
            }
          }
          if (car?.color) counts.colors.set(car.color, (counts.colors.get(car.color) || 0) + 1);
        });
      }

      // Convert to expected format
      const filterCounts = {
        manufacturers: Object.fromEntries(counts.manufacturers),
        models: Object.fromEntries(counts.models),
        fuelTypes: Object.fromEntries(counts.fuelTypes),
        transmissions: Object.fromEntries(counts.transmissions),
        years: Object.fromEntries(counts.years),
        colors: Object.fromEntries(counts.colors),
        generations: Object.fromEntries(counts.generations),
        bodyTypes: Object.fromEntries(counts.bodyTypes),
        driveTypes: Object.fromEntries(counts.driveTypes),
        doors: Object.fromEntries(counts.doors),
        seats: Object.fromEntries(counts.seats),
      };

      return filterCounts;
    } catch (error) {
      console.error('Error fetching filter counts:', error);
      return {
        manufacturers: {},
        models: {},
        fuelTypes: {},
        transmissions: {},
        years: {},
        colors: {},
        generations: {},
        bodyTypes: {},
        driveTypes: {},
        doors: {},
        seats: {},
      };
    }
  }, [fetchManufacturers, fetchModels]);

  /**
   * Fetch available grades
   */
  const fetchGrades = useCallback(async () => {
    return [
      { id: 1, name: 'A', cars_qty: 0 },
      { id: 2, name: 'B', cars_qty: 0 },
      { id: 3, name: 'C', cars_qty: 0 },
      { id: 4, name: 'D', cars_qty: 0 },
      { id: 5, name: 'R', cars_qty: 0 },
    ];
  }, []);

  /**
   * Fetch available trim levels
   */
  const fetchTrimLevels = useCallback(async () => {
    return [
      { id: 1, name: 'Base', cars_qty: 0 },
      { id: 2, name: 'Mid', cars_qty: 0 },
      { id: 3, name: 'High', cars_qty: 0 },
      { id: 4, name: 'Premium', cars_qty: 0 },
    ];
  }, []);

  /**
   * Refresh cars (reload first page)
   */
  const refreshCars = useCallback(() => {
    fetchCars(1, undefined, true);
  }, [fetchCars]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    setCars([]);
    setTotalCount(0);
    setHasMorePages(false);
    setPagination({ page: 1, totalPages: 0, totalCount: 0, hasMore: false });
  }, []);

  /**
   * Fetch all cars (alias for fetchCars for compatibility)
   */
  const fetchAllCars = useCallback(async (
    page: number = 1,
    sortOptions?: { sort_by?: string; sort_direction?: string },
    resetCars: boolean = false
  ) => {
    return await fetchCars(page, sortOptions, resetCars);
  }, [fetchCars]);

  // Auto-refresh when sync completes
  useAutoRefreshOnSync(() => {
    if (cars.length > 0) {
      refreshCars();
    }
  });

  /**
   * Fetch complete dataset for filter consistency (compatibility with external API hook)
   */
  const fetchCompleteDatasetForFilters = useCallback(async (): Promise<any[]> => {
    try {
      console.log("📊 Database: Fetching complete dataset for filter consistency...");
      
      // For database backend, we can get all cars efficiently
      const { data, error } = await supabase
        .from('cars_cache')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Database: Complete dataset fetched (${data?.length || 0} cars)`);
      return data || [];
    } catch (error) {
      console.error('❌ Database: Error fetching complete dataset:', error);
      return [];
    }
  }, []);

  return {
    cars,
    loading,
    error,
    totalCount,
    hasMorePages,
    pagination,
    filters,
    fetchCars,
    fetchAllCars,
    fetchCompleteDatasetForFilters, // ✅ Add compatibility function
    loadMore,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer,
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    refreshCars,
    clearCache,
    setCars,
    setTotalCount,
    setLoading,
    setFilters,
  };
};