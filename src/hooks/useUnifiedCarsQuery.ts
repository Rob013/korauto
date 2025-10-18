import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { FilterState } from '@/hooks/useFiltersFromUrl';
import { buildQueryParams } from '@/utils/buildQueryParams';
import { useUnifiedCars, UnifiedCar, UnifiedCarsFilters } from './useUnifiedCars';

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
  source_api?: string;
  lot_number?: string;
  title?: string;
  vin?: string;
  condition?: string;
  is_live?: boolean;
  keys_available?: boolean;
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

// Convert unified car to UI car format
const convertUnifiedCarToUICar = (unifiedCar: UnifiedCar): Car => ({
  id: unifiedCar.id,
  make: unifiedCar.make,
  model: unifiedCar.model,
  year: unifiedCar.year,
  price: unifiedCar.price,
  mileage: unifiedCar.mileage,
  fuel: unifiedCar.fuel,
  transmission: unifiedCar.transmission,
  bodyType: '', // Not in unified response
  color: unifiedCar.color,
  location: unifiedCar.location,
  images: unifiedCar.images ? (Array.isArray(unifiedCar.images) ? unifiedCar.images : []) : [],
  source_api: unifiedCar.source_api,
  lot_number: unifiedCar.lot_number,
  title: unifiedCar.title,
  vin: unifiedCar.vin,
  condition: unifiedCar.condition,
  is_live: unifiedCar.is_live,
  keys_available: unifiedCar.keys_available
});

// Map UI sort to unified sort
const mapSortToUnified = (sort?: string): { sortBy: string; sortOrder: 'asc' | 'desc' } => {
  switch (sort) {
    case 'price_asc':
      return { sortBy: 'price', sortOrder: 'asc' };
    case 'price_desc':
      return { sortBy: 'price', sortOrder: 'desc' };
    case 'year_asc':
      return { sortBy: 'year', sortOrder: 'asc' };
    case 'year_desc':
      return { sortBy: 'year', sortOrder: 'desc' };
    case 'mileage_asc':
      return { sortBy: 'mileage', sortOrder: 'asc' };
    case 'mileage_desc':
      return { sortBy: 'mileage', sortOrder: 'desc' };
    case 'make_asc':
      return { sortBy: 'make', sortOrder: 'asc' };
    case 'make_desc':
      return { sortBy: 'make', sortOrder: 'desc' };
    case 'model_asc':
      return { sortBy: 'model', sortOrder: 'asc' };
    case 'model_desc':
      return { sortBy: 'model', sortOrder: 'desc' };
    case 'recently_added':
      return { sortBy: 'last_synced_at', sortOrder: 'desc' };
    default:
      return { sortBy: 'last_synced_at', sortOrder: 'desc' };
  }
};

// Build unified filters from URL params
const buildUnifiedFilters = (params: ReturnType<typeof buildQueryParams>): UnifiedCarsFilters => {
  const { sortBy, sortOrder } = mapSortToUnified(params.sort);
  
  return {
    make: params.brand ? [params.brand] : undefined,
    model: params.model ? [params.model] : undefined,
    yearMin: params.yearMin,
    yearMax: params.yearMax,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    fuel: params.fuel ? [params.fuel] : undefined,
    transmission: params.transmission ? [params.transmission] : undefined,
    color: params.color ? [params.color] : undefined,
    condition: params.condition ? [params.condition] : undefined,
    location: params.location ? [params.location] : undefined,
    source_api: params.source_api ? [params.source_api] : undefined,
    search: params.search,
    sortBy,
    sortOrder,
    page: parseInt(params.page || '1'),
    pageSize: parseInt(params.pageSize || '24')
  };
};

// Fetch cars using unified system
const fetchUnifiedCars = async (
  params: ReturnType<typeof buildQueryParams>,
  signal?: AbortSignal
): Promise<CarsResponse> => {
  try {
    const filters = buildUnifiedFilters(params);
    
    // Use the unified cars hook logic here
    // This would be implemented to work with the unified system
    const response = await fetch('/api/unified-cars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
      signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      cars: data.cars.map(convertUnifiedCarToUICar),
      total: data.total,
      page: data.page,
      totalPages: data.totalPages,
      hasMore: data.hasMore,
      nextCursor: data.nextCursor
    };
  } catch (error) {
    console.error('Error fetching unified cars:', error);
    
    // Fallback to mock data if API fails
    return fetchCarsFallback(params, signal);
  }
};

// Fallback function using existing mock data logic
const fetchCarsFallback = async (
  params: ReturnType<typeof buildQueryParams>,
  signal?: AbortSignal
): Promise<CarsResponse> => {
  // This would use the existing fallback logic
  // For now, return empty response
  return {
    cars: [],
    total: 0,
    page: 1,
    totalPages: 0,
    hasMore: false
  };
};

export const useUnifiedCarsQuery = (filters: FilterState) => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('recently_added');
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build query parameters
  const queryParams = useMemo(() => buildQueryParams(filters), [filters]);

  // Use unified cars hook
  const {
    cars: unifiedCars,
    total,
    page,
    totalPages,
    hasMore: hasMoreData,
    loading,
    error: unifiedError
  } = useUnifiedCars(buildUnifiedFilters(queryParams));

  // Convert unified cars to UI format
  const cars = useMemo(() => {
    return unifiedCars.map(convertUnifiedCarToUICar);
  }, [unifiedCars]);

  // Update state when unified data changes
  useEffect(() => {
    setAllCars(cars);
    setHasMore(hasMoreData);
    setError(unifiedError);
  }, [cars, hasMoreData, unifiedError]);

  // Load more cars
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      // This would load more cars from the unified system
      // For now, just set loading to false
      setIsLoadingMore(false);
    } catch (err) {
      console.error('Error loading more cars:', err);
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  // Refresh cars
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['unified-cars'] });
  }, [queryClient]);

  // Reset to first page
  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllCars([]);
    setHasMore(true);
    setNextCursor(undefined);
  }, []);

  return {
    cars: allCars,
    total,
    page: currentPage,
    totalPages,
    hasMore,
    nextCursor,
    loading: loading || isLoadingMore,
    error,
    loadMore,
    refresh,
    reset,
    sortBy,
    setSortBy
  };
};

export default useUnifiedCarsQuery;
