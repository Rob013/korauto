import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
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
  // When no brand filter is applied, use the same secure auction API data as homepage
  if (!params.brand || params.brand === '' || params.brand === 'all') {
    const { createFallbackCars } = await import('@/hooks/useSecureAuctionAPI');
    const { useDailyRotatingCars } = await import('@/hooks/useDailyRotatingCars');
    
    // Get cars from secure auction API (same as homepage)
    const allCars = createFallbackCars({});
    
    // Apply daily rotation logic (same as homepage)
    const hasFilters = Object.entries(params).some(([key, value]) => 
      value && value !== '' && key !== 'page' && key !== 'pageSize' && key !== 'sort'
    );
    
    const dailyRotatingCars = (() => {
      if (hasFilters || allCars.length === 0) {
        return allCars;
      }

      // Get day of month as seed for daily rotation (same logic as homepage)
      const today = new Date();
      const dayOfMonth = today.getDate();
      const month = today.getMonth() + 1;
      const dailySeed = dayOfMonth * 100 + month;

      // Filter available cars
      const availableCars = allCars.filter(
        (car) =>
          car.manufacturer?.name && 
          car.lots?.[0]?.images?.normal?.[0]
      );

      // Seeded random function
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      // Shuffle with seed
      const shuffleWithSeed = (array: any[], seed: number) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(seed + i) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      return shuffleWithSeed(availableCars, dailySeed).slice(0, 50);
    })();
    
    // Convert to the expected format
    const convertedCars = dailyRotatingCars.map(car => ({
      id: car.id?.toString() || '',
      make: car.manufacturer?.name || '',
      model: car.model?.name || '',
      year: car.year || 2020,
      price: Math.round((car.lots?.[0]?.buy_now || 25000) + 2200), // Add fees like homepage
      mileage: car.lots?.[0]?.odometer?.km,
      fuel: car.fuel?.name,
      transmission: car.transmission?.name,
      bodyType: car.body_type || 'Sedan',
      color: car.color?.name,
      location: car.location || 'Seoul',
      images: car.lots?.[0]?.images?.normal || []
    }));
    
    const pageSize = parseInt(params.pageSize || '20');
    const page = parseInt(params.page || '1');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCars = convertedCars.slice(startIndex, endIndex);
    
    return {
      cars: paginatedCars,
      total: convertedCars.length,
      page: page,
      totalPages: Math.ceil(convertedCars.length / pageSize),
      hasMore: endIndex < convertedCars.length
    };
  }
  
  // For brand-specific filters, use mock data
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

  // Create a key for filters without page AND sort to track when non-sort filters change
  const filtersWithoutPageAndSort = { ...filters };
  delete filtersWithoutPageAndSort.page;
  delete filtersWithoutPageAndSort.sort;
  const nonSortFiltersKey = JSON.stringify(filtersWithoutPageAndSort);
  const nonSortFiltersKeyRef = useRef(nonSortFiltersKey);

  // Reset accumulated cars when filters change (except page and sort)
  useEffect(() => {
    if (nonSortFiltersKey !== nonSortFiltersKeyRef.current) {
      setAccumulatedCars([]);
      nonSortFiltersKeyRef.current = nonSortFiltersKey;
    }
  }, [nonSortFiltersKey]);

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

  // Simple sort function for cars
  const sortCars = useCallback((cars: Car[], sortType: string): Car[] => {
    const sorted = [...cars];
    
    switch (sortType) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'year_desc':
        return sorted.sort((a, b) => b.year - a.year);
      case 'year_asc':
        return sorted.sort((a, b) => a.year - b.year);
      case 'mileage_asc':
        return sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case 'mileage_desc':
        return sorted.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
      case 'recently_added':
      default:
        // For recently added, maintain original order or sort by ID
        return sorted.sort((a, b) => b.id.localeCompare(a.id));
    }
  }, []);

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

  // Apply sorting to accumulated cars when sort changes
  const sortedAccumulatedCars = useMemo(() => {
    return sortCars(accumulatedCars, filters.sort || 'recently_added');
  }, [accumulatedCars, filters.sort, sortCars]);

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
    // Data - return sorted accumulated cars
    cars: sortedAccumulatedCars,
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