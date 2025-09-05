import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { FilterState } from '@/hooks/useFiltersFromUrl';
import { buildQueryParams } from '@/utils/buildQueryParams';
import { fetchCarsWithKeyset, Car as ApiCar, CarsApiResponse, SortOption, FrontendSortOption } from '@/services/carsApi';

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
  nextCursor?: string;
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

// New API function using keyset pagination
const fetchCars = async (
  params: ReturnType<typeof buildQueryParams>,
  signal?: AbortSignal,
  cursor?: string
): Promise<CarsResponse> => {
  console.log('🔄 Fetching cars with params:', params);
  
  try {
    const apiResponse = await fetchCarsWithKeyset({
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
      limit: parseInt(params.pageSize || '24'),
      cursor
    });

    const convertedCars = apiResponse.items.map(convertApiCarToUICar);
    const pageSize = parseInt(params.pageSize || '24');
    const currentPage = parseInt(params.page || '1');

    console.log('✅ Successfully fetched', convertedCars.length, 'cars from API');

    return {
      cars: convertedCars,
      total: apiResponse.total,
      page: currentPage,
      totalPages: Math.ceil(apiResponse.total / pageSize),
      hasMore: !!apiResponse.nextCursor,
      nextCursor: apiResponse.nextCursor
    };
  } catch (error) {
    console.error('❌ API failed, using fallback data:', error);
    
    // Use fallback data if API fails
    return fetchCarsFallback(params, signal);
  }
};

  // Fallback function using existing mock data logic
  const fetchCarsFallback = async (
    params: ReturnType<typeof buildQueryParams>,
    signal?: AbortSignal
  ): Promise<CarsResponse> => {
    console.info('🔄 Using fallback cars for development/testing');
    
    // Simple fallback cars without complex imports
    const fallbackCars: Car[] = Array.from({ length: 200 }, (_, index) => ({
      id: `fallback-${index + 1}`,
      make: ['Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai', 'Kia'][index % 8],
      model: ['Camry', 'Civic', 'X3', 'C-Class', 'A4', 'Golf', 'Elantra', 'Sorento'][index % 8],
      year: 2015 + (index % 9),
      price: Math.round(15000 + (index * 567) % 50000),
      mileage: Math.round(20000 + (index * 1234) % 150000),
      fuel: ['Gasoline', 'Diesel', 'Hybrid', 'Electric'][index % 4],
      transmission: ['Automatic', 'Manual', 'CVT'][index % 3],
      bodyType: 'Sedan',
      color: ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray'][index % 6],
      location: 'Seoul',
      images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400']
    }));
    
    // Apply basic sorting
    const sortedCars = [...fallbackCars].sort((a, b) => {
      switch (params.sort) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_desc':
          return b.year - a.year;
        case 'year_asc':
          return a.year - b.year;
        default:
          return a.price - b.price;
      }
    });
    
    console.info('✅ Generated fallback cars with sorting');
    
    const pageSize = parseInt(params.pageSize || '20');
    const page = parseInt(params.page || '1');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCars = sortedCars.slice(startIndex, endIndex);
    
    return {
      cars: paginatedCars,
      total: sortedCars.length,
      page: page,
      totalPages: Math.ceil(sortedCars.length / pageSize),
      hasMore: endIndex < sortedCars.length
    };
  };

// Mock API function for models
const fetchModels = async (brandId: string, signal?: AbortSignal): Promise<Model[]> => {
  // Simple mock models without dynamic imports
  const mockModels: Record<string, string[]> = {
    Toyota: ['Camry', 'Corolla', 'RAV4', 'Prius', 'Highlander'],
    Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit'],
    BMW: ['3 Series', '5 Series', 'X3', 'X5', 'i3'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'],
    Audi: ['A3', 'A4', 'Q5', 'Q7', 'e-tron']
  };
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }
  
  const brandName = brandId.charAt(0).toUpperCase() + brandId.slice(1);
  const models = mockModels[brandName] || [];
  
  return models.map((model: string, index: number) => ({
    id: model.toLowerCase().replace(/\s+/g, '-'),
    name: model,
    brandId: brandId
  }));
};

export const useCarsQuery = (filters: FilterState) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track accumulated cars for infinite scroll
  const [accumulatedCars, setAccumulatedCars] = useState<Car[]>([]);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [currentHasMore, setCurrentHasMore] = useState(false);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>();
  
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

  // Reset accumulated cars when filters or sort change
  useEffect(() => {
    if (filtersKey !== filtersKeyRef.current) {
      setAccumulatedCars([]);
      setCurrentCursor(undefined);
      filtersKeyRef.current = filtersKey;
    }
  }, [filtersKey]);

  // Reset accumulated cars when non-sort filters change
  useEffect(() => {
    if (nonSortFiltersKey !== nonSortFiltersKeyRef.current) {
      setAccumulatedCars([]);
      setCurrentCursor(undefined);
      nonSortFiltersKeyRef.current = nonSortFiltersKey;
    }
  }, [nonSortFiltersKey]);

  // For cursor-based pagination, we need to determine the cursor to use
  const isFirstPage = (filters.page || 1) === 1;
  const cursorToUse = isFirstPage ? undefined : currentCursor;

  // Create query key that includes cursor for proper caching
  const queryKey = ['cars', buildQueryParams(filters), cursorToUse];

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
        const response = await fetchCars(buildQueryParams(filters), combinedSignal, cursorToUse);
        
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
        
        // Update cursor for next page
        if (response.nextCursor) {
          setCurrentCursor(response.nextCursor);
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
      
      if (isFirstPage) {
        // Replace cars on first page (new search/filter/sort)
        setAccumulatedCars(cars);
        setCurrentHasMore(hasMore);
      } else {
        // Append cars for subsequent pages
        setAccumulatedCars(prev => {
          const existingIds = new Set(prev.map(car => car.id));
          const newCars = cars.filter(car => !existingIds.has(car.id));
          const updatedAccumulated = [...prev, ...newCars];
          
          // Recalculate hasMore based on accumulated cars vs total
          // For cursor-based pagination, trust the API's hasMore
          // For paginated results, calculate based on accumulated count vs total
          const calculatedHasMore = hasMore && updatedAccumulated.length < total;
          setCurrentHasMore(calculatedHasMore);
          
          return updatedAccumulated;
        });
      }
    }
  }, [carsQuery.data, filters.page]);

  // Return cars as-is since sorting is now done globally on the server
  const displayCars = accumulatedCars;

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

  // Prefetch next page when current data is available with cursor
  const prefetchNextPage = useCallback(() => {
    if (currentHasMore && currentCursor) {
      const nextPageFilters = { ...filters, page: (filters.page || 1) + 1 };
      const nextPageQueryKey = ['cars', buildQueryParams(nextPageFilters), currentCursor];
      
      queryClient.prefetchQuery({
        queryKey: nextPageQueryKey,
        queryFn: async ({ signal }) => {
          return fetchCars(buildQueryParams(nextPageFilters), signal, currentCursor);
        },
        staleTime: 45000,
      });
    }
  }, [currentHasMore, currentCursor, filters, queryClient]);

  // Invalidate queries when filters change significantly
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cars'] });
    setAccumulatedCars([]);
    setCurrentCursor(undefined);
  }, [queryClient]);

  return {
    // Data - return cars with global sorting applied
    cars: displayCars,
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