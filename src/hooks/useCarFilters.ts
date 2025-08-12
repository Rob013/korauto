import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCarFilterStore } from '@/store/carFilterStore';
import { queryCars, getFilterOptions, getCarCount, type CarQueryOptions } from '@/lib/carQuery';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Hook for querying cars with filters, pagination, and caching
 */
export function useCarsQuery() {
  const {
    filters,
    sort,
    page,
    pageSize,
    isLoading,
    setLoading,
    getFiltersForQuery,
  } = useCarFilterStore();

  const queryClient = useQueryClient();

  // Debounce filters to avoid too many requests during typing
  const debouncedFilters = useDebouncedValue(getFiltersForQuery(), 300);

  // Create query options
  const queryOptions: CarQueryOptions = useMemo(() => ({
    filters: debouncedFilters,
    sort,
    page,
    pageSize,
  }), [debouncedFilters, sort, page, pageSize]);

  // Generate cache key
  const queryKey = useMemo(() => [
    'cars',
    queryOptions.filters,
    queryOptions.sort,
    queryOptions.page,
    queryOptions.pageSize,
  ], [queryOptions]);

  // Main cars query
  const {
    data: queryResult,
    error,
    isLoading: isQueryLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => queryCars(queryOptions),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  // Update loading state
  useEffect(() => {
    setLoading(isQueryLoading);
  }, [isQueryLoading, setLoading]);

  // Prefetch next page for smooth pagination
  const prefetchNextPage = useCallback(() => {
    if (queryResult?.hasMore) {
      const nextPageOptions = { ...queryOptions, page: page + 1 };
      const nextPageKey = [
        'cars',
        nextPageOptions.filters,
        nextPageOptions.sort,
        nextPageOptions.page,
        nextPageOptions.pageSize,
      ];

      queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn: () => queryCars(nextPageOptions),
        staleTime: 30000,
      });
    }
  }, [queryClient, queryOptions, queryResult?.hasMore, page]);

  // Auto-prefetch next page when current page loads
  useEffect(() => {
    if (queryResult && !isQueryLoading) {
      const timer = setTimeout(prefetchNextPage, 500);
      return () => clearTimeout(timer);
    }
  }, [queryResult, isQueryLoading, prefetchNextPage]);

  return {
    // Data
    cars: queryResult?.data || [],
    totalCount: queryResult?.count || 0,
    hasMore: queryResult?.hasMore || false,
    totalPages: queryResult?.totalPages || 0,
    
    // Loading states
    isLoading: isQueryLoading || isLoading,
    isFetching,
    
    // Error handling
    error,
    
    // Actions
    refetch,
    prefetchNextPage,
    
    // Pagination info
    currentPage: page,
    pageSize,
  };
}

/**
 * Hook for getting filter options with counts
 */
export function useFilterOptions() {
  const { filters, setAvailableOptions, getFiltersForQuery } = useCarFilterStore();
  
  // Debounce to avoid too many requests
  const debouncedFilters = useDebouncedValue(getFiltersForQuery(), 500);

  const {
    data: filterOptions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['filter-options', debouncedFilters],
    queryFn: () => getFilterOptions(debouncedFilters),
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update store when options are loaded
  useEffect(() => {
    if (filterOptions) {
      setAvailableOptions(filterOptions);
    }
  }, [filterOptions, setAvailableOptions]);

  return {
    filterOptions,
    isLoading,
    error,
  };
}

/**
 * Hook for getting live car count with filters
 */
export function useCarCount() {
  const { getFiltersForQuery } = useCarFilterStore();
  
  // Debounce to avoid too many requests
  const debouncedFilters = useDebouncedValue(getFiltersForQuery(), 500);

  const {
    data: count,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['car-count', debouncedFilters],
    queryFn: () => getCarCount(debouncedFilters),
    staleTime: 30000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    count: count || 0,
    isLoading,
    error,
  };
}

/**
 * Hook for managing filter state with URL sync
 */
export function useCarFilters() {
  const store = useCarFilterStore();
  
  // Actions with optimized callbacks
  const setFilter = useCallback((key: string, value: any) => {
    store.setFilter(key as any, value);
  }, [store]);

  const updateFilters = useCallback((newFilters: any) => {
    store.updateFilters(newFilters);
  }, [store]);

  const clearFilters = useCallback(() => {
    store.clearFilters();
  }, [store]);

  const clearFilter = useCallback((key: string) => {
    store.clearFilter(key as any);
  }, [store]);

  const setSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    store.setSort({ field: field as any, direction });
  }, [store]);

  const setPage = useCallback((page: number) => {
    store.setPage(page);
  }, [store]);

  const nextPage = useCallback(() => {
    store.setPage(store.page + 1);
  }, [store]);

  const prevPage = useCallback(() => {
    if (store.page > 1) {
      store.setPage(store.page - 1);
    }
  }, [store]);

  return {
    // State
    filters: store.filters,
    sort: store.sort,
    page: store.page,
    pageSize: store.pageSize,
    isLoading: store.isLoading,
    showAdvancedFilters: store.showAdvancedFilters,
    
    // Computed
    activeFilterCount: store.getActiveFilterCount(),
    hasActiveFilters: store.hasActiveFilters(),
    
    // Actions
    setFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    setSort,
    setPage,
    nextPage,
    prevPage,
    setPageSize: store.setPageSize,
    setShowAdvancedFilters: store.setShowAdvancedFilters,
  };
}

/**
 * Hook for managing car selection and interactions
 */
export function useCarInteractions() {
  const queryClient = useQueryClient();

  const invalidateCarQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cars'] });
    queryClient.invalidateQueries({ queryKey: ['filter-options'] });
    queryClient.invalidateQueries({ queryKey: ['car-count'] });
  }, [queryClient]);

  const prefetchCarDetails = useCallback((carId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['car-details', carId],
      queryFn: async () => {
        // This would be implemented to fetch car details
        // For now, just return a placeholder
        return { id: carId };
      },
      staleTime: 60000,
    });
  }, [queryClient]);

  return {
    invalidateCarQueries,
    prefetchCarDetails,
  };
}