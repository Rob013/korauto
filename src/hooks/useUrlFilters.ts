import { useEffect, useCallback, useRef } from 'react';
import { useThrottledUrlUpdate } from './useThrottledUrlUpdate';
import { useFilterStore } from '@/store/filterStore';
import { SearchReq, DEFAULT_SORT, DEFAULT_PAGE_SIZE } from '@/lib/search/types';
import { normalizeFilters } from '@/lib/search/buildFilter';

const DEBOUNCE_MS = 300;

/**
 * Hook to synchronize filter state with URL search parameters
 * Uses compact JSON format for filters in URL
 */
export const useUrlFilters = () => {
  const { searchParams, updateUrl } = useThrottledUrlUpdate();
  const { setState } = useFilterStore();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Parse URL parameters and hydrate store on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    try {
      const urlState = parseUrlParams(searchParams);
      setState(urlState);
      isInitializedRef.current = true;
      console.log('🔗 Hydrated state from URL:', urlState);
    } catch (error) {
      console.warn('⚠️ Failed to parse URL parameters:', error);
      isInitializedRef.current = true;
    }
  }, []); // Only run on mount

  // Debounced function to update URL
  const updateUrlParams = useCallback((state: {
    filters: SearchReq['filters'];
    sort: SearchReq['sort'];
    page: number;
    pageSize: number;
    query: string;
  }) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const params = stateToUrlParams(state);
        updateUrl(params);
        console.log('🔗 Updated URL with params:', Object.fromEntries(params.entries()));
      } catch (error) {
        console.warn('⚠️ Failed to update URL:', error);
      }
    }, DEBOUNCE_MS);
  }, [updateUrl]);

  // Subscribe to store changes
  const store = useFilterStore();
  
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    updateUrlParams({
      filters: store.filters,
      sort: store.sort,
      page: store.page,
      pageSize: store.pageSize,
      query: store.query,
    });
  }, [store.filters, store.sort, store.page, store.pageSize, store.query, updateUrlParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isInitialized: isInitializedRef.current,
  };
};

/**
 * Parse URL search parameters into filter state
 */
function parseUrlParams(searchParams: URLSearchParams): {
  filters: SearchReq['filters'];
  sort: SearchReq['sort'];
  page: number;
  pageSize: number;
  query: string;
} {
  const state = {
    filters: {} as SearchReq['filters'],
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    query: '',
  };

  // Parse page
  const pageParam = searchParams.get('page');
  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (page > 0) state.page = page;
  }

  // Parse pageSize
  const pageSizeParam = searchParams.get('pageSize');
  if (pageSizeParam) {
    const pageSize = parseInt(pageSizeParam, 10);
    if (pageSize > 0 && pageSize <= 100) state.pageSize = pageSize;
  }

  // Parse query
  const queryParam = searchParams.get('q');
  if (queryParam) state.query = queryParam;

  // Parse sort
  const sortParam = searchParams.get('sort');
  if (sortParam) {
    const [field, dir] = sortParam.split(':');
    if (field && dir && ['asc', 'desc'].includes(dir)) {
      if (['listed_at', 'price_eur', 'mileage_km', 'year'].includes(field)) {
        state.sort = { field: field as any, dir: dir as 'asc' | 'desc' };
      }
    }
  }

  // Parse filters (compact JSON format)
  const filtersParam = searchParams.get('filters');
  if (filtersParam) {
    try {
      const rawFilters = JSON.parse(decodeURIComponent(filtersParam));
      state.filters = normalizeFilters(rawFilters);
    } catch (error) {
      console.warn('Failed to parse filters from URL:', error);
    }
  }

  // Also support expanded params format for backwards compatibility
  const expandedFilters = parseExpandedParams(searchParams);
  if (Object.keys(expandedFilters).length > 0) {
    state.filters = { ...state.filters, ...expandedFilters };
  }

  return state;
}

/**
 * Parse expanded URL parameters (e.g., make=BMW&fuel=Petrol&year_min=2020)
 */
function parseExpandedParams(searchParams: URLSearchParams): SearchReq['filters'] {
  const filters: SearchReq['filters'] = {};

  // Simple array fields
  const arrayFields = [
    'country', 'make', 'model', 'trim', 'fuel', 'transmission',
    'body', 'drive', 'use_type', 'exterior_color', 'interior_color',
    'region', 'options', 'accident'
  ];

  arrayFields.forEach(field => {
    const values = searchParams.getAll(field);
    if (values.length > 0) {
      filters[field] = values;
    }
  });

  // Numeric array fields
  const numericArrayFields = ['owners', 'seats'];
  numericArrayFields.forEach(field => {
    const values = searchParams.getAll(field);
    if (values.length > 0) {
      const numericValues = values.map(Number).filter(n => !isNaN(n));
      if (numericValues.length > 0) {
        filters[field] = numericValues;
      }
    }
  });

  // Range fields
  const rangeFields = ['year', 'price_eur', 'mileage_km', 'engine_cc'];
  rangeFields.forEach(field => {
    const min = searchParams.get(`${field}_min`);
    const max = searchParams.get(`${field}_max`);
    
    if (min || max) {
      const range: { min?: number; max?: number } = {};
      if (min && !isNaN(Number(min))) range.min = Number(min);
      if (max && !isNaN(Number(max))) range.max = Number(max);
      
      if (range.min !== undefined || range.max !== undefined) {
        filters[field] = range;
      }
    }
  });

  return filters;
}

/**
 * Convert filter state to URL search parameters
 */
function stateToUrlParams(state: {
  filters: SearchReq['filters'];
  sort: SearchReq['sort'];
  page: number;
  pageSize: number;
  query: string;
}): URLSearchParams {
  const params = new URLSearchParams();

  // Add page if not 1
  if (state.page > 1) {
    params.set('page', state.page.toString());
  }

  // Add pageSize if not default
  if (state.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('pageSize', state.pageSize.toString());
  }

  // Add query if present
  if (state.query) {
    params.set('q', state.query);
  }

  // Add sort if not default
  if (state.sort && (state.sort.field !== DEFAULT_SORT.field || state.sort.dir !== DEFAULT_SORT.dir)) {
    params.set('sort', `${state.sort.field}:${state.sort.dir}`);
  }

  // Add filters if present (compact JSON format)
  if (state.filters && Object.keys(state.filters).length > 0) {
    const filtersJson = JSON.stringify(state.filters);
    params.set('filters', encodeURIComponent(filtersJson));
  }

  return params;
}