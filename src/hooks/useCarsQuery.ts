import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useState, useEffect } from 'react';
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
  // Use mock data for development/testing
  const { mockFetchCars } = await import('@/utils/mockCarsData');
  const mockResponse = await mockFetchCars(params, signal);
  
  return {
    cars: mockResponse.cars,
    total: mockResponse.total,
    page: mockResponse.page,
    totalPages: mockResponse.totalPages,
    hasMore: mockResponse.hasMore
  };
  
  /* Original API call - uncomment when API is available
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
  */
};

// Mock API function for models
const fetchModels = async (brandId: string, signal?: AbortSignal): Promise<Model[]> => {
  // Use mock data for development/testing
  const { carModels } = await import('@/utils/mockCarsData');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }
  
  const brandName = brandId.charAt(0).toUpperCase() + brandId.slice(1);
  const models = (carModels as any)[brandName] || [];
  
  return models.map((model: string, index: number) => ({
    id: model.toLowerCase().replace(/\s+/g, '-'),
    name: model,
    brandId: brandId
  }));
  
  /* Original API call - uncomment when API is available
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
  */
};

export const useCarsQuery = (filters: FilterState) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track accumulated cars for infinite scroll
  const [accumulatedCars, setAccumulatedCars] = useState<Car[]>([]);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [currentHasMore, setCurrentHasMore] = useState(false);
  
  // Create a key for filters without page to track when filters change
  const filtersWithoutPage = { ...filters };
  delete filtersWithoutPage.page;
  const filtersKey = JSON.stringify(filtersWithoutPage);
  const filtersKeyRef = useRef(filtersKey);

  // Reset accumulated cars when filters change (except page)
  useEffect(() => {
    if (filtersKey !== filtersKeyRef.current) {
      setAccumulatedCars([]);
      filtersKeyRef.current = filtersKey;
    }
  }, [filtersKey]);

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

  // Update accumulated cars when new data comes in
  useEffect(() => {
    if (carsQuery.data) {
      const { cars, total, hasMore } = carsQuery.data;
      const isFirstPage = (filters.page || 1) === 1;
      
      setCurrentTotal(total);
      setCurrentHasMore(hasMore);
      
      if (isFirstPage) {
        // Replace cars on first page (new search/filter/sort)
        setAccumulatedCars(cars);
      } else {
        // Append cars for subsequent pages
        setAccumulatedCars(prev => {
          const existingIds = new Set(prev.map(car => car.id));
          const newCars = cars.filter(car => !existingIds.has(car.id));
          return [...prev, ...newCars];
        });
      }
    }
  }, [carsQuery.data, filters.page]);

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
    if (currentHasMore) {
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
  }, [currentHasMore, filters, queryClient]);

  // Invalidate queries when filters change significantly
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cars'] });
    setAccumulatedCars([]);
  }, [queryClient]);

  return {
    // Data
    cars: accumulatedCars,
    total: currentTotal,
    totalPages: Math.ceil(currentTotal / (filters.pageSize || 20)),
    hasMore: currentHasMore,
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