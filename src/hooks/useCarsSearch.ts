import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchCars } from '@/lib/search/searchService';
import { SearchRequest, SearchResponse } from '@/lib/search/types';
import { useMemo, useRef } from 'react';

interface UseCarsSearchOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * React Query hook for searching cars with optimizations
 */
export function useCarsSearch(
  request: SearchRequest,
  options: UseCarsSearchOptions = {}
) {
  const {
    enabled = true,
    staleTime = 60_000, // 1 minute
    refetchOnWindowFocus = false
  } = options;

  // AbortController ref to cancel previous requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create query key that includes all search parameters
  const queryKey = useMemo(() => [
    'cars-search',
    request.q,
    request.filters,
    request.sort,
    request.page,
    request.pageSize
  ], [request]);

  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Use the provided signal or our own abort controller
      const effectiveSignal = signal || abortControllerRef.current.signal;

      try {
        const result = await searchCars(request, effectiveSignal);
        return result;
      } catch (error) {
        if (effectiveSignal.aborted) {
          throw new Error('Request cancelled');
        }
        throw error;
      }
    },
    enabled,
    staleTime,
    refetchOnWindowFocus,
    placeholderData: keepPreviousData, // Keep previous data while loading new results
    retry: (failureCount, error) => {
      // Don't retry if request was cancelled
      if (error.message === 'Request cancelled' || error.message === 'Search request was aborted') {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    meta: {
      errorMessage: 'Failed to search cars'
    }
  });

  // Derived data for easier consumption
  const derivedData = useMemo(() => {
    const data = query.data;
    
    return {
      hits: data?.hits || [],
      total: data?.total || 0,
      facets: data?.facets || {},
      took_ms: data?.took_ms,
      
      // Pagination helpers
      totalPages: Math.ceil((data?.total || 0) / (request.pageSize || 24)),
      hasNextPage: (request.page || 1) < Math.ceil((data?.total || 0) / (request.pageSize || 24)),
      hasPreviousPage: (request.page || 1) > 1,
      
      // Loading states
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: query.error,
      
      // Data freshness
      isStale: query.isStale,
      dataUpdatedAt: query.dataUpdatedAt,
      
      // Query controls
      refetch: query.refetch,
      remove: query.remove
    };
  }, [query, request.page, request.pageSize]);

  // Cancel function to abort current request
  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return {
    ...derivedData,
    cancel,
    
    // Raw query object for advanced use cases
    query
  };
}

/**
 * Hook for prefetching next page of results
 */
export function usePrefetchNextPage(request: SearchRequest) {
  const queryClient = useMemo(() => {
    // Get the query client from React Query context
    // This would need to be imported from your React Query setup
    return null; // Placeholder
  }, []);

  const prefetchNextPage = async () => {
    if (!queryClient) return;

    const nextPageRequest = {
      ...request,
      page: (request.page || 1) + 1
    };

    const queryKey = [
      'cars-search',
      nextPageRequest.q,
      nextPageRequest.filters,
      nextPageRequest.sort,
      nextPageRequest.page,
      nextPageRequest.pageSize
    ];

    // Prefetch next page
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => searchCars(nextPageRequest),
      staleTime: 60_000
    });
  };

  return { prefetchNextPage };
}

/**
 * Hook for optimistic search with instant feedback
 */
export function useOptimisticSearch(baseRequest: SearchRequest) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = async (newRequest: SearchRequest): Promise<SearchResponse | null> => {
    // Cancel previous optimistic search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const result = await searchCars(newRequest, abortControllerRef.current.signal);
      return result;
    } catch (error) {
      if (abortControllerRef.current.signal.aborted) {
        return null; // Request was cancelled, don't throw
      }
      throw error;
    }
  };

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return { search, cancel };
}

/**
 * Hook to get search performance metrics
 */
export function useSearchMetrics(request: SearchRequest) {
  const { data, isLoading, isFetching, dataUpdatedAt } = useCarsSearch(request);

  return useMemo(() => ({
    searchTime: data?.took_ms,
    resultCount: data?.total || 0,
    isSearching: isLoading || isFetching,
    lastUpdated: dataUpdatedAt,
    
    // Performance indicators
    isSlowSearch: (data?.took_ms || 0) > 1000,
    isFastSearch: (data?.took_ms || 0) < 200,
    
    // Cache indicators
    isFromCache: !isLoading && !isFetching && dataUpdatedAt && (Date.now() - dataUpdatedAt < 5000)
  }), [data, isLoading, isFetching, dataUpdatedAt]);
}