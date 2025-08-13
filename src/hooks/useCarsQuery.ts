import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import { FilterState } from '@/hooks/useFiltersFromUrl';
import { buildQueryParams } from '@/utils/buildQueryParams';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  images?: string[];
}

interface CarsResponse {
  cars: Car[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface Model {
  id: string;
  name: string;
  brandId: string;
}

// Mock API function - replace with actual API call
const fetchCars = async (
  params: ReturnType<typeof buildQueryParams>,
  signal?: AbortSignal
): Promise<CarsResponse> => {
  const searchParams = new URLSearchParams();
  
  // Add all params to search string
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value.toString());
  });

  const response = await fetch(`/api/cars?${searchParams.toString()}`, {
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cars: ${response.statusText}`);
  }

  return response.json();
};

// Mock API function for models
const fetchModels = async (brandId: string, signal?: AbortSignal): Promise<Model[]> => {
  const response = await fetch(`/api/models?brand=${brandId}`, {
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  return response.json();
};

export const useCarsQuery = (filters: FilterState) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create query key from URL params for proper caching
  const queryKey = ['cars', buildQueryParams(filters)];

  // Cancel previous request
  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Main cars query
  const carsQuery = useQuery<CarsResponse, Error>({
    queryKey,
    queryFn: async ({ signal }) => {
      cancelPreviousRequest();
      
      abortControllerRef.current = new AbortController();
      const combinedSignal = signal || abortControllerRef.current.signal;

      const startTime = performance.now();
      
      try {
        const response = await fetchCars(buildQueryParams(filters), combinedSignal);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log slow queries (>800ms) as specified
        if (duration > 800) {
          console.warn(`🐌 Slow query detected: ${duration.toFixed(2)}ms`, {
            filters,
            queryKey,
            duration,
          });
        }
        
        return response;
      } finally {
        abortControllerRef.current = null;
      }
    },
    staleTime: 45000,
    placeholderData: (prev) => prev,
    enabled: true,
    retry: (failureCount, error) => {
      // Don't retry if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Models query for dependent filtering
  const modelsQuery = useQuery({
    queryKey: ['models', filters.brand],
    queryFn: async ({ signal }) => {
      if (!filters.brand) return [];
      return fetchModels(filters.brand, signal);
    },
    staleTime: 300000, // 5 minutes - models don't change often
    enabled: !!filters.brand,
  });

  // Prefetch next page when current data is available
  const prefetchNextPage = useCallback(() => {
    if (carsQuery.data && (carsQuery.data as CarsResponse).hasMore) {
      const nextPageFilters = { ...filters, page: (filters.page || 1) + 1 };
      const nextPageQueryKey = ['cars', buildQueryParams(nextPageFilters)];
      
      queryClient.prefetchQuery({
        queryKey: nextPageQueryKey,
        queryFn: async ({ signal }) => {
          return fetchCars(buildQueryParams(nextPageFilters), signal);
        },
        staleTime: 45000,
      });
    }
  }, [carsQuery.data, filters, queryClient]);

  // Invalidate queries when filters change significantly
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cars'] });
  }, [queryClient]);

  return {
    // Data
    cars: (carsQuery.data as CarsResponse | undefined)?.cars || [],
    total: (carsQuery.data as CarsResponse | undefined)?.total || 0,
    totalPages: (carsQuery.data as CarsResponse | undefined)?.totalPages || 0,
    hasMore: (carsQuery.data as CarsResponse | undefined)?.hasMore || false,
    models: modelsQuery.data || [],
    
    // Loading states
    isLoading: carsQuery.isLoading,
    isFetching: carsQuery.isFetching,
    isLoadingModels: modelsQuery.isLoading,
    
    // Error states
    error: carsQuery.error,
    modelsError: modelsQuery.error,
    
    // Actions
    refetch: carsQuery.refetch,
    prefetchNextPage,
    invalidateQueries,
    cancelPreviousRequest,
  };
};