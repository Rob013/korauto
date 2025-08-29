import { useState, useCallback, useEffect } from 'react';
import { fetchCarsWithKeyset, CarsApiResponse, CarFilters, SortOption, FrontendSortOption } from '@/services/carsApi';
import { useToast } from '@/hooks/use-toast';

interface UseGlobalSortingParams {
  initialFilters?: CarFilters;
  initialSort?: SortOption | FrontendSortOption;
  pageSize?: number;
}

interface UseGlobalSortingReturn {
  cars: any[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasNextPage: boolean;
  currentSort: SortOption | FrontendSortOption;
  nextCursor: string | null;
  
  // Actions
  applySort: (sort: SortOption | FrontendSortOption) => void;
  applyFilters: (filters: CarFilters) => void;
  loadNextPage: () => void;
  reset: () => void;
}

export function useGlobalSorting({
  initialFilters = {},
  initialSort = 'price_asc',
  pageSize = 24
}: UseGlobalSortingParams = {}): UseGlobalSortingReturn {
  const { toast } = useToast();
  
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<SortOption | FrontendSortOption>(initialSort);
  const [currentFilters, setCurrentFilters] = useState<CarFilters>(initialFilters);

  const fetchCars = useCallback(async (
    filters: CarFilters, 
    sort: SortOption | FrontendSortOption, 
    cursor?: string,
    append = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response: CarsApiResponse = await fetchCarsWithKeyset({
        filters,
        sort,
        limit: pageSize,
        cursor
      });

      if (append) {
        setCars(prev => [...prev, ...response.items]);
      } else {
        setCars(response.items);
      }
      
      setTotalCount(response.total);
      setNextCursor(response.nextCursor || null);
      
      console.log(`🎯 Global sorting applied: ${sort} - ${response.items.length} cars loaded (${response.total} total)`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      console.error('Error in global sorting:', err);
      
      toast({
        title: "Error loading cars",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pageSize, toast]);

  // Apply new sort - this triggers global sorting
  const applySort = useCallback((sort: SortOption | FrontendSortOption) => {
    console.log(`🔄 Applying global sort: ${sort}`);
    setCurrentSort(sort);
    setCars([]); // Clear current cars
    fetchCars(currentFilters, sort);
  }, [currentFilters, fetchCars]);

  // Apply new filters - this also triggers global sorting with current sort
  const applyFilters = useCallback((filters: CarFilters) => {
    console.log(`🔄 Applying filters with global sort: ${currentSort}`, filters);
    setCurrentFilters(filters);
    setCars([]); // Clear current cars
    fetchCars(filters, currentSort);
  }, [currentSort, fetchCars]);

  // Load next page with same sort and filters
  const loadNextPage = useCallback(() => {
    if (!nextCursor || loading) return;
    
    console.log(`📄 Loading next page with cursor: ${nextCursor}`);
    fetchCars(currentFilters, currentSort, nextCursor, true);
  }, [currentFilters, currentSort, nextCursor, loading, fetchCars]);

  // Reset to initial state
  const reset = useCallback(() => {
    setCars([]);
    setError(null);
    setTotalCount(0);
    setNextCursor(null);
    setCurrentSort(initialSort);
    setCurrentFilters(initialFilters);
  }, [initialFilters, initialSort]);

  // Initial load
  useEffect(() => {
    fetchCars(initialFilters, initialSort);
  }, []); // Only run once on mount

  return {
    cars,
    loading,
    error,
    totalCount,
    hasNextPage: !!nextCursor,
    currentSort,
    nextCursor,
    
    applySort,
    applyFilters,
    loadNextPage,
    reset
  };
}