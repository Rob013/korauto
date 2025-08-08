import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFilterStore } from '@/store/filterStore';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Hook that synchronizes filter state with URL query parameters
 * - Reads filters from URL on mount
 * - Debounces URL updates by 300ms
 * - Resets page=1 when non-page filters change
 */
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useFilterStore();
  const isInitialized = useRef(false);
  const lastUrlParams = useRef<string>('');

  // Debounced function to update URL
  const debouncedUpdateUrl = useDebouncedCallback((params: URLSearchParams) => {
    const newParamsString = params.toString();
    const currentParamsString = searchParams.toString();
    
    // Only update if params actually changed
    if (newParamsString !== currentParamsString) {
      setSearchParams(params, { replace: true });
      lastUrlParams.current = newParamsString;
    }
  }, 300);

  // Initialize from URL on mount
  useEffect(() => {
    if (!isInitialized.current) {
      const currentParamsString = searchParams.toString();
      if (currentParamsString !== lastUrlParams.current) {
        store.setFromUrlParams(searchParams);
        lastUrlParams.current = currentParamsString;
      }
      isInitialized.current = true;
    }
  }, []); // Only run once on mount

  // Subscribe to store changes and update URL
  useEffect(() => {
    if (!isInitialized.current) return; // Don't update URL during initialization

    const unsubscribe = useFilterStore.subscribe(
      (state) => ({
        filters: state.filters,
        sort: state.sort,
        page: state.page,
        pageSize: state.pageSize,
        query: state.query,
        hasChanged: state.hasChanged
      }),
      (state, prevState) => {
        // Only update URL if state actually changed and after initialization
        if (state.hasChanged && isInitialized.current) {
          const params = store.getSearchParams();
          debouncedUpdateUrl(params);
          
          // Reset the hasChanged flag
          useFilterStore.setState({ hasChanged: false });
        }
      },
      {
        fireImmediately: false,
        equalityFn: (a, b) => {
          // Custom equality check to avoid unnecessary updates
          return (
            JSON.stringify(a.filters) === JSON.stringify(b.filters) &&
            JSON.stringify(a.sort) === JSON.stringify(b.sort) &&
            a.page === b.page &&
            a.pageSize === b.pageSize &&
            a.query === b.query
          );
        }
      }
    );

    return unsubscribe;
  }, [store, debouncedUpdateUrl]);

  // Listen to URL changes from browser navigation
  useEffect(() => {
    const currentParamsString = searchParams.toString();
    
    // Only update store if URL params actually changed
    if (currentParamsString !== lastUrlParams.current && isInitialized.current) {
      store.setFromUrlParams(searchParams);
      lastUrlParams.current = currentParamsString;
    }
  }, [searchParams, store]);

  return {
    // Re-export store methods for convenience
    setFilter: store.setFilter,
    setFilters: store.setFilters,
    clearFilters: store.clearFilters,
    setSort: store.setSort,
    setPage: store.setPage,
    setPageSize: store.setPageSize,
    setQuery: store.setQuery,
    resetPage: store.resetPage,
    
    // State getters
    filters: store.filters,
    sort: store.sort,
    page: store.page,
    pageSize: store.pageSize,
    query: store.query,
    isLoading: store.isLoading
  };
}

/**
 * Hook to get current filter state as URL search params
 */
export function useFilterParams(): URLSearchParams {
  const store = useFilterStore();
  return store.getSearchParams();
}

/**
 * Hook to navigate with filters while preserving other state
 */
export function useNavigateWithFilters() {
  const [, setSearchParams] = useSearchParams();
  const store = useFilterStore();

  const navigateWithFilters = (
    newFilters: Partial<typeof store.filters> = {},
    resetPage = true
  ) => {
    // Update store first
    store.setFilters(newFilters);
    
    if (resetPage) {
      store.resetPage();
    }
    
    // Get updated params and navigate
    const params = store.getSearchParams();
    setSearchParams(params, { replace: true });
  };

  return navigateWithFilters;
}

/**
 * Hook to check if current filters are applied
 */
export function useHasActiveFilters(): boolean {
  const { filters, query } = useFilterStore();
  
  return (
    !!query ||
    Object.keys(filters).length > 0
  );
}

/**
 * Hook to get filter count for UI badges
 */
export function useActiveFilterCount(): number {
  const { filters, query } = useFilterStore();
  
  let count = 0;
  
  if (query) count++;
  
  Object.values(filters).forEach(value => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        count++;
      } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
        if (value.min !== undefined || value.max !== undefined) {
          count++;
        }
      } else if (value !== '') {
        count++;
      }
    }
  });
  
  return count;
}