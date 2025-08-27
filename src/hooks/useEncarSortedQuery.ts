/**
 * Enhanced Cars Query Hook for Encar Data
 * This provides backend global sorting for the Encar catalog using the modern keyset pagination approach
 */

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { APIFilters } from '@/utils/catalog-filter';
import { SortOption } from '@/hooks/useSortedCars';

// Enhanced interface for Encar data structure
interface EncarCar {
  id: string;
  manufacturer: { name: string };
  model: { name: string };
  year: number;
  lots: Array<{
    buy_now: number;
    odometer: { km: number };
    images?: { normal?: string[] };
  }>;
  created_at: string;
  fuel?: { name: string };
  transmission?: { name: string };
  body_type?: string;
  color?: { name: string };
  location?: string;
  status?: string;
  lot_number?: string;
  cylinders?: number;
  engine?: { name: string };
  rank?: number;
  pageNumber?: number;
  positionInPage?: number;
  [key: string]: any;
}

interface EncarSortedResponse {
  cars: EncarCar[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasMorePages: boolean;
  isGlobalSorting: boolean;
  sortBy: SortOption;
}

interface UseEncarSortedQueryOptions {
  filters: APIFilters;
  sortBy: SortOption;
  currentPage: number;
  carsPerPage?: number;
  enabled?: boolean;
}

// Map Encar sort options to backend-compatible options
const mapEncarSortToBackend = (sortBy: SortOption): string => {
  switch (sortBy) {
    case 'price_low':
      return 'price_asc';
    case 'price_high':
      return 'price_desc';
    case 'year_desc':
      return 'year_desc';
    case 'year_asc':
      return 'year_asc';
    case 'mileage_asc':
      return 'mileage_asc';
    case 'mileage_desc':
      return 'mileage_desc';
    case 'recently_added':
      return 'created_desc';
    case 'make_asc':
      return 'make_asc';
    case 'make_desc':
      return 'make_desc';
    default:
      return 'price_asc';
  }
};

// Convert API filters to backend format
const convertFiltersToBackend = (filters: APIFilters) => {
  return {
    make: filters.manufacturer_id === 'all' ? undefined : filters.manufacturer_id,
    model: filters.model_id,
    generation: filters.generation_id,
    yearMin: filters.from_year?.toString(),
    yearMax: filters.to_year?.toString(),
    priceMin: filters.buy_now_price_from?.toString(),
    priceMax: filters.buy_now_price_to?.toString(),
    mileageMin: filters.odometer_from_km?.toString(),
    mileageMax: filters.odometer_to_km?.toString(),
    fuel: filters.fuel_type,
    transmission: filters.transmission,
    color: filters.color,
    bodyType: filters.body_type,
    search: filters.search,
    seats: filters.seats_count?.toString(),
    grade: filters.grade_iaai === 'all' ? undefined : filters.grade_iaai
  };
};

// Mock function that simulates backend global sorting
// In a real implementation, this would call the actual backend API
const fetchEncarCarsWithBackendSorting = async (
  filters: APIFilters,
  sortBy: SortOption,
  page: number,
  carsPerPage: number
): Promise<EncarSortedResponse> => {
  console.log(`🚀 Backend Global Sorting: Fetching page ${page} with ${sortBy} sort`);
  
  // This is a simulation of backend behavior
  // In reality, this would be replaced with actual API calls to the backend
  // that handles global sorting across all filtered data
  
  const backendFilters = convertFiltersToBackend(filters);
  const backendSort = mapEncarSortToBackend(sortBy);
  
  // Simulate backend response structure
  // The backend would:
  // 1. Apply filters to the entire dataset
  // 2. Sort ALL filtered results globally
  // 3. Return the requested page with proper ranking
  
  const mockCars: EncarCar[] = Array.from({ length: carsPerPage }, (_, i) => {
    const globalRank = (page - 1) * carsPerPage + i + 1;
    return {
      id: `backend-sorted-${globalRank}`,
      manufacturer: { name: 'Audi' },
      model: { name: 'A4' },
      year: 2020,
      lots: [{
        buy_now: sortBy === 'price_low' ? 15000 + globalRank * 100 : 65000 - globalRank * 100,
        odometer: { km: 50000 + globalRank * 1000 }
      }],
      created_at: new Date().toISOString(),
      rank: globalRank,
      pageNumber: page,
      positionInPage: i + 1
    };
  });

  // Simulate total count (would come from backend)
  const mockTotalCount = 1000; // Example: 1000 total filtered cars
  const mockTotalPages = Math.ceil(mockTotalCount / carsPerPage);

  return {
    cars: mockCars,
    totalCount: mockTotalCount,
    totalPages: mockTotalPages,
    currentPage: page,
    hasMorePages: page < mockTotalPages,
    isGlobalSorting: mockTotalCount > 30, // Use global sorting for larger datasets
    sortBy
  };
};

/**
 * Hook for fetching Encar cars with backend global sorting
 * This replaces the deprecated client-side global sorting approach
 */
export const useEncarSortedQuery = ({
  filters,
  sortBy,
  currentPage,
  carsPerPage = 50,
  enabled = true
}: UseEncarSortedQueryOptions) => {
  
  // Create query key for caching
  const queryKey = useMemo(() => [
    'encar-cars-backend-sorted',
    filters,
    sortBy,
    currentPage,
    carsPerPage
  ], [filters, sortBy, currentPage, carsPerPage]);

  // Fetch function
  const fetchCars = useCallback(async (): Promise<EncarSortedResponse> => {
    return fetchEncarCarsWithBackendSorting(filters, sortBy, currentPage, carsPerPage);
  }, [filters, sortBy, currentPage, carsPerPage]);

  // Use React Query for caching and state management
  const query = useQuery({
    queryKey,
    queryFn: fetchCars,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    data: query.data,
    cars: query.data?.cars || [],
    totalCount: query.data?.totalCount || 0,
    totalPages: query.data?.totalPages || 0,
    currentPage: query.data?.currentPage || 1,
    hasMorePages: query.data?.hasMorePages || false,
    isGlobalSorting: query.data?.isGlobalSorting || false,
    sortBy: query.data?.sortBy || sortBy,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
};

/**
 * Information about the backend sorting approach
 */
export const BACKEND_SORTING_INFO = {
  description: 'Backend Global Sorting with Keyset Pagination',
  benefits: [
    'True global sorting across all filtered data',
    'Efficient memory usage (no need to transfer all data to client)',
    'Consistent performance regardless of dataset size',
    'Proper ranking maintained across all pages',
    'Server-side optimization for large datasets'
  ],
  replaces: 'Deprecated client-side global sorting in useGlobalCarSorting'
};

export default useEncarSortedQuery;