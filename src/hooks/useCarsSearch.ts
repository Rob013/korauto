import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SearchReq, SearchRes, FACET_FIELDS } from '@/lib/search/types';
import { createFiltersHash } from '@/lib/search/buildFilter';

const STALE_TIME = 60_000; // 60 seconds
const CACHE_TIME = 5 * 60_000; // 5 minutes

interface UseCarsSearchOptions {
  enabled?: boolean;
  keepPreviousData?: boolean;
}

/**
 * React Query hook for cars search with two-phase fetching support
 */
export const useCarsSearch = (
  request: SearchReq,
  options: UseCarsSearchOptions = {}
) => {
  const { enabled = true, keepPreviousData = true } = options;

  // Generate query key
  const queryKey = ['cars-search', {
    q: request.q,
    filters: request.filters,
    sort: request.sort,
    page: request.page,
    pageSize: request.pageSize,
    mode: request.mode || 'full',
    facets: request.facets,
  }];

  // Query function
  const queryFn = async ({ signal }: { signal?: AbortSignal }): Promise<SearchRes> => {
    console.log('🔍 Fetching cars with request:', request);
    
    const { data, error } = await supabase.functions.invoke('cars-search', {
      body: request,
      signal,
    });

    if (error) {
      console.error('❌ Cars search error:', error);
      throw new Error(error.message || 'Failed to search cars');
    }

    return data as SearchRes;
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME, // Updated from cacheTime
    keepPreviousData,
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error.message?.includes('Invalid request')) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

/**
 * Hook for results-only search (for fast filtering and pagination)
 * Optimized for no-flicker experience
 */
export const useCarsResults = (
  request: Omit<SearchReq, 'mode'>,
  options: UseCarsSearchOptions = {}
) => {
  return useCarsSearch(
    { ...request, mode: 'results' },
    { keepPreviousData: true, ...options }
  );
};

/**
 * Hook for facets-only search (for filter options)
 * Optimized for filter UI updates
 */
export const useCarsFacets = (
  request: Omit<SearchReq, 'mode' | 'page' | 'pageSize'>,
  facets: string[] = [...FACET_FIELDS],
  options: UseCarsSearchOptions = {}
) => {
  return useCarsSearch(
    { 
      ...request, 
      mode: 'facets',
      facets,
      page: 1,
      pageSize: 1, // Minimal page size for facets-only
    },
    options
  );
};

/**
 * Enhanced prefetch hook for pagination and dropdowns
 */
export const useCarsSearchPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchPage = async (request: SearchReq, page: number) => {
    const prefetchRequest = { ...request, page, mode: 'results' as const };
    
    await queryClient.prefetchQuery({
      queryKey: ['cars-search', {
        q: prefetchRequest.q,
        filters: prefetchRequest.filters,
        sort: prefetchRequest.sort,
        page: prefetchRequest.page,
        pageSize: prefetchRequest.pageSize,
        mode: prefetchRequest.mode,
        facets: prefetchRequest.facets,
      }],
      queryFn: async () => {
        const { data, error } = await supabase.functions.invoke('cars-search', {
          body: prefetchRequest,
        });

        if (error) {
          throw new Error(error.message || 'Failed to prefetch cars');
        }

        return data as SearchRes;
      },
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  const prefetchNextPage = async (currentRequest: SearchReq) => {
    if (currentRequest.page) {
      await prefetchPage(currentRequest, currentRequest.page + 1);
    }
  };

  const prefetchPrevPage = async (currentRequest: SearchReq) => {
    if (currentRequest.page && currentRequest.page > 1) {
      await prefetchPage(currentRequest, currentRequest.page - 1);
    }
  };

  const prefetchMakeResults = async (make: string, currentRequest: SearchReq) => {
    const prefetchRequest: SearchReq = {
      ...currentRequest,
      filters: {
        ...currentRequest.filters,
        make: [make],
      },
      page: 1,
      mode: 'results',
    };

    await queryClient.prefetchQuery({
      queryKey: ['cars-search', {
        q: prefetchRequest.q,
        filters: prefetchRequest.filters,
        sort: prefetchRequest.sort,
        page: prefetchRequest.page,
        pageSize: prefetchRequest.pageSize,
        mode: prefetchRequest.mode,
        facets: prefetchRequest.facets,
      }],
      queryFn: async () => {
        const { data, error } = await supabase.functions.invoke('cars-search', {
          body: prefetchRequest,
        });

        if (error) {
          throw new Error(error.message || 'Failed to prefetch cars');
        }

        return data as SearchRes;
      },
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  const prefetchFacets = async (request: Omit<SearchReq, 'mode'>, facets: string[]) => {
    const prefetchRequest: SearchReq = {
      ...request,
      mode: 'facets',
      facets,
      page: 1,
      pageSize: 1,
    };

    await queryClient.prefetchQuery({
      queryKey: ['cars-search', {
        q: prefetchRequest.q,
        filters: prefetchRequest.filters,
        sort: prefetchRequest.sort,
        page: prefetchRequest.page,
        pageSize: prefetchRequest.pageSize,
        mode: prefetchRequest.mode,
        facets: prefetchRequest.facets,
      }],
      queryFn: async () => {
        const { data, error } = await supabase.functions.invoke('cars-search', {
          body: prefetchRequest,
        });

        if (error) {
          throw new Error(error.message || 'Failed to prefetch facets');
        }

        return data as SearchRes;
      },
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  // Prefetch popular makes on dropdown hover/open
  const prefetchPopularMakes = async (currentRequest: SearchReq) => {
    const popularMakes = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche'];
    
    // Prefetch results for each popular make
    const prefetchPromises = popularMakes.map(make => 
      prefetchMakeResults(make, currentRequest).catch(err => {
        console.warn(`Failed to prefetch make ${make}:`, err);
      })
    );

    await Promise.allSettled(prefetchPromises);
  };

  return {
    prefetchPage,
    prefetchNextPage,
    prefetchPrevPage,
    prefetchMakeResults,
    prefetchFacets,
    prefetchPopularMakes,
  };
};

/**
 * Hook to get cached search results without triggering a new request
 */
export const useCachedCarsSearch = (request: SearchReq): SearchRes | undefined => {
  const queryClient = useQueryClient();
  
  const queryKey = ['cars-search', {
    q: request.q,
    filters: request.filters,
    sort: request.sort,
    page: request.page,
    pageSize: request.pageSize,
    mode: request.mode || 'full',
    facets: request.facets,
  }];

  return queryClient.getQueryData(queryKey);
};

/**
 * Hook to invalidate cars search cache
 */
export const useInvalidateCarsSearch = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['cars-search'] });
  };

  const invalidateFilters = (filters: SearchReq['filters']) => {
    const hash = createFiltersHash(filters);
    queryClient.invalidateQueries({ 
      queryKey: ['cars-search'],
      predicate: (query) => {
        const key = query.queryKey[1] as any;
        return createFiltersHash(key.filters) === hash;
      }
    });
  };

  return {
    invalidateAll,
    invalidateFilters,
  };
};