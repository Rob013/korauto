import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CarFilters {
  make?: string;
  model?: string;
  yearMin?: string;
  yearMax?: string;
  priceMin?: string;
  priceMax?: string;
  fuel?: string;
  search?: string;
}

export interface SortedCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  price_cents: number;
  rank_score: number;
  mileage?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  location: string;
  image_url?: string;
  images?: any;
  title: string;
  created_at: string;
  row_number: number;
}

export interface GlobalSortOptions {
  field: 'price_cents' | 'year' | 'make' | 'created_at';
  direction: 'ASC' | 'DESC';
}

export interface UseGlobalSortedCarsReturn {
  cars: SortedCar[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  fetchPage: (page: number) => Promise<void>;
  applyFilters: (filters: CarFilters) => Promise<void>;
  changeSort: (sort: GlobalSortOptions) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useGlobalSortedCars = (
  initialFilters: CarFilters = {},
  initialSort: GlobalSortOptions = { field: 'price_cents', direction: 'ASC' },
  pageSize: number = 50
): UseGlobalSortedCarsReturn => {
  const [cars, setCars] = useState<SortedCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CarFilters>(initialFilters);
  const [sort, setSort] = useState<GlobalSortOptions>(initialSort);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Fetch data from database with global sorting
  const fetchData = useCallback(async (
    page: number,
    newFilters: CarFilters = filters,
    newSort: GlobalSortOptions = sort
  ) => {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * pageSize;
      
      console.log(`🔍 Fetching globally sorted data: page ${page}, offset ${offset}`, {
        filters: newFilters,
        sort: newSort
      });

      // Get total count first
      const { data: count, error: countError } = await supabase
        .rpc('cars_filtered_count', { p_filters: newFilters as any });

      if (countError) {
        throw countError;
      }

      // Get sorted and paginated results
      const { data: result, error: dataError } = await supabase
        .rpc('cars_global_sorted', {
          p_filters: newFilters as any,
          p_sort_field: newSort.field,
          p_sort_dir: newSort.direction,
          p_offset: offset,
          p_limit: pageSize
        });

      if (dataError) {
        throw dataError;
      }

      setCars(result || []);
      setTotalCount(count || 0);
      setCurrentPage(page);

      console.log(`✅ Loaded ${result?.length || 0} cars for page ${page} (${count} total)`);

    } catch (err) {
      console.error('❌ Error fetching sorted cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      setCars([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, pageSize]);

  // Public methods
  const fetchPage = useCallback(async (page: number) => {
    await fetchData(page, filters, sort);
  }, [fetchData, filters, sort]);

  const applyFilters = useCallback(async (newFilters: CarFilters) => {
    setFilters(newFilters);
    await fetchData(1, newFilters, sort); // Reset to page 1 when filters change
  }, [fetchData, sort]);

  const changeSort = useCallback(async (newSort: GlobalSortOptions) => {
    setSort(newSort);
    await fetchData(currentPage, filters, newSort);
  }, [fetchData, currentPage, filters]);

  const refreshData = useCallback(async () => {
    await fetchData(currentPage, filters, sort);
  }, [fetchData, currentPage, filters, sort]);

  // Initial load
  useEffect(() => {
    fetchData(1, initialFilters, initialSort);
  }, []); // Only run once on mount

  return {
    cars,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    fetchPage,
    applyFilters,
    changeSort,
    refreshData
  };
};