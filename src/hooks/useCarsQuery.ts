import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { FilterState } from '@/hooks/useFiltersFromUrl';
import { buildQueryParams } from '@/utils/buildQueryParams';
import { fetchCarsWithPagination, Car as ApiCar, CarsApiResponse, SortOption, FrontendSortOption } from '@/services/carsApi';

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
  hasPrev: boolean;
  facets: CarsApiResponse['facets'];
}

interface Model {
  id: string;
  name: string;
  brandId: string;
}

// Convert API car to UI car format
const convertApiCarToUICar = (apiCar: ApiCar): Car => ({
  id: apiCar.id,
  make: apiCar.make,
  model: apiCar.model,
  year: apiCar.year,
  price: apiCar.price,
  mileage: apiCar.mileage,
  fuel: apiCar.fuel,
  transmission: apiCar.transmission,
  bodyType: '', // Not in API response
  color: apiCar.color,
  location: apiCar.location,
  images: apiCar.images ? (Array.isArray(apiCar.images) ? apiCar.images : []) : []
});

// Map UI sort to API sort
const mapSortToApi = (sort?: string): SortOption | FrontendSortOption => {
  // The backend now supports frontend sort options directly, so we can pass them through
  // But we'll still map some common ones for clarity
  switch (sort) {
    case 'price_asc':
    case 'price_desc':
    case 'year_desc':
    case 'year_asc':
    case 'mileage_asc':
    case 'mileage_desc':
    case 'recently_added':
    case 'oldest_first':
    case 'popular':
      return sort as SortOption | FrontendSortOption;
    default:
      return 'price_asc';
  }
};

// Backend-only pagination API function
const fetchCars = async (
  params: ReturnType<typeof buildQueryParams>,
  signal?: AbortSignal
): Promise<CarsResponse> => {
  try {
    const apiResponse = await fetchCarsWithPagination({
      filters: {
        make: params.brand,
        model: params.model,
        yearMin: params.yearMin?.toString(),
        yearMax: params.yearMax?.toString(),
        priceMin: params.priceMin?.toString(),
        priceMax: params.priceMax?.toString(),
        fuel: params.fuel,
        search: params.search
      },
      sort: mapSortToApi(params.sort),
      page: parseInt(params.page || '1'),
      pageSize: parseInt(params.pageSize || '24')
    });

    const convertedCars = apiResponse.items.map(convertApiCarToUICar);

    return {
      cars: convertedCars,
      total: apiResponse.total,
      page: apiResponse.page,
      totalPages: apiResponse.totalPages,
      hasMore: apiResponse.hasNext,
      hasPrev: apiResponse.hasPrev,
      facets: apiResponse.facets
    };
  } catch (error) {
    console.error('Error fetching cars with backend-only pagination:', error);
    
    // Fallback to mock data if API fails
    return fetchCarsFallback(params, signal);
  }
};

// Fallback function using existing mock data logic
const fetchCarsFallback = async (
  params: ReturnType<typeof buildQueryParams>,
  signal?: AbortSignal
): Promise<CarsResponse> => {
  // When no brand filter is applied, use the same secure auction API data as homepage
  if (!params.brand || params.brand === '' || params.brand === 'all') {
    const { createFallbackCars } = await import('@/hooks/useSecureAuctionAPI');
    
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
  
  // Track page-based data (NO MORE CURSOR ACCUMULATION)
  const [currentTotal, setCurrentTotal] = useState(0);
  const [currentFacets, setCurrentFacets] = useState<CarsApiResponse['facets']>({
    makes: [],
    models: [],
    fuels: [],
    year_range: { min: 2000, max: 2024 },
    price_range: { min: 0, max: 1000000 }
  });
  
  // Create query key without cursor - backend handles pagination
  const queryKey = ['cars', buildQueryParams(filters)];

  // Cancel previous request
  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Main cars query using backend-only pagination
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
        
        // Log slow queries for performance monitoring
        if (duration > 300) { // Targeting list P95 <300ms
          console.warn(`🐌 Slow query detected: ${duration.toFixed(2)}ms`, {
            filters,
            queryKey,
            duration,
            target: '300ms'
          });
        }
        
        // Update global state
        setCurrentTotal(response.total);
        setCurrentFacets(response.facets);
        
        return response;
      } finally {
        abortControllerRef.current = null;
      }
    },
    staleTime: 45000, // 45s stale time for edge caching
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

  // Prefetch adjacent pages for smooth navigation
  const prefetchAdjacentPages = useCallback(() => {
    const currentPage = filters.page || 1;
    const totalPages = carsQuery.data?.totalPages || 0;
    
    // Prefetch next page if available
    if (currentPage < totalPages) {
      const nextPageFilters = { ...filters, page: currentPage + 1 };
      const nextPageQueryKey = ['cars', buildQueryParams(nextPageFilters)];
      
      queryClient.prefetchQuery({
        queryKey: nextPageQueryKey,
        queryFn: async ({ signal }) => {
          return fetchCars(buildQueryParams(nextPageFilters), signal);
        },
        staleTime: 45000,
      });
    }
    
    // Prefetch previous page if available
    if (currentPage > 1) {
      const prevPageFilters = { ...filters, page: currentPage - 1 };
      const prevPageQueryKey = ['cars', buildQueryParams(prevPageFilters)];
      
      queryClient.prefetchQuery({
        queryKey: prevPageQueryKey,
        queryFn: async ({ signal }) => {
          return fetchCars(buildQueryParams(prevPageFilters), signal);
        },
        staleTime: 45000,
      });
    }
  }, [filters, carsQuery.data?.totalPages, queryClient]);

  // Invalidate queries when filters change significantly
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cars'] });
  }, [queryClient]);

  return {
    // Data - backend provides sorted and paginated results
    cars: carsQuery.data?.cars || [],
    total: currentTotal,
    totalPages: carsQuery.data?.totalPages || 0,
    hasMore: carsQuery.data?.hasMore || false,
    hasPrev: carsQuery.data?.hasPrev || false,
    page: carsQuery.data?.page || 1,
    facets: currentFacets,
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
    prefetchAdjacentPages,
    invalidateQueries,
    cancelPreviousRequest,
  };
};