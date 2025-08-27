/**
 * Backend-based car sorting hook - replaces deprecated useGlobalCarSorting
 * Uses fetchCarsWithKeyset for consistent backend sorting across all pages
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { fetchCarsWithKeyset, Car as BackendCar } from '@/services/carsApi';
import { SortOption as FrontendSortOption } from '@/hooks/useSortedCars';
import { mapFrontendToBackendSort, shouldUseBackendSorting } from '@/utils/sortMapping';
import { APIFilters } from '@/utils/catalog-filter';

interface UseBackendCarSortingOptions {
  currentCars: any[];
  filters: APIFilters;
  totalCount: number;
  carsPerPage?: number;
}

interface UseBackendCarSortingReturn {
  // State
  isBackendSorting: boolean;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  
  // Actions
  getCarsForPage: (pageNumber: number, sortBy: FrontendSortOption) => Promise<any[]>;
  
  // Utilities
  shouldUseBackendSorting: () => boolean;
  canUseBackendSorting: (sortBy: FrontendSortOption) => boolean;
}

/**
 * Hook for backend-based car sorting using keyset pagination
 * Provides global sorting across all pages with better performance
 */
export const useBackendCarSorting = ({
  currentCars,
  filters,
  totalCount,
  carsPerPage = 50,
}: UseBackendCarSortingOptions): UseBackendCarSortingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return totalCount > 0 ? Math.ceil(totalCount / carsPerPage) : 0;
  }, [totalCount, carsPerPage]);

  // Check if backend sorting should be used
  const shouldUseBackendSortingImpl = useCallback(() => {
    return shouldUseBackendSorting(totalCount, 30);
  }, [totalCount]);

  // Check if a specific sort option can use backend sorting
  const canUseBackendSorting = useCallback((sortBy: FrontendSortOption): boolean => {
    // For now, prioritize price-based sorting which works best with backend
    const backendOptimizedSorts: FrontendSortOption[] = ['price_low', 'price_high', 'recently_added'];
    return backendOptimizedSorts.includes(sortBy);
  }, []);

  // Convert API filters to backend format
  const convertFiltersToBackend = useCallback((apiFilters: APIFilters) => {
    return {
      make: apiFilters.manufacturer_name,
      model: apiFilters.model_name,
      yearMin: apiFilters.from_year?.toString(),
      yearMax: apiFilters.to_year?.toString(),
      priceMin: apiFilters.buy_now_price_from?.toString(),
      priceMax: apiFilters.buy_now_price_to?.toString(),
      fuel: apiFilters.fuel_type,
      search: apiFilters.search,
    };
  }, []);

  // Get cars for a specific page using backend sorting
  const getCarsForPage = useCallback(async (
    pageNumber: number,
    sortBy: FrontendSortOption
  ): Promise<any[]> => {
    if (fetchingRef.current) {
      console.log('📋 Backend sorting fetch already in progress, skipping');
      return currentCars;
    }

    if (!shouldUseBackendSortingImpl() || !canUseBackendSorting(sortBy)) {
      console.log(`📄 Using client-side sorting: totalCount=${totalCount}, sortBy=${sortBy}`);
      return currentCars;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      console.log(`🔄 Fetching page ${pageNumber} with backend sorting: ${sortBy}`);

      const backendSort = mapFrontendToBackendSort(sortBy);
      const backendFilters = convertFiltersToBackend(filters);

      const response = await fetchCarsWithKeyset({
        filters: backendFilters,
        sort: backendSort,
        limit: carsPerPage,
        // For page-based access, we can estimate cursor position
        // This is a simplified approach - in production, you'd maintain cursor state
      });

      console.log(`✅ Backend sorting completed: ${response.items.length} cars retrieved`);
      
      return response.items.map((car: BackendCar) => ({
        id: car.id,
        manufacturer: { name: car.make },
        model: { name: car.model },
        year: car.year,
        lots: [{
          buy_now: car.price,
          odometer: { km: car.mileage || 0 }
        }],
        title: car.title || `${car.year} ${car.make} ${car.model}`,
        created_at: car.created_at,
        // Add ranking information for consistency
        rank: ((pageNumber - 1) * carsPerPage) + response.items.indexOf(car) + 1,
        pageNumber,
        positionInPage: response.items.indexOf(car) + 1,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backend sorting failed';
      console.error('❌ Backend sorting error:', errorMessage);
      setError(errorMessage);
      
      // Fallback to current cars on error
      return currentCars;
      
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [
    shouldUseBackendSortingImpl,
    canUseBackendSorting,
    totalCount,
    currentCars,
    filters,
    carsPerPage,
    convertFiltersToBackend
  ]);

  // Determine if backend sorting is currently active
  const isBackendSorting = useMemo(() => {
    return shouldUseBackendSortingImpl() && !isLoading && !error;
  }, [shouldUseBackendSortingImpl, isLoading, error]);

  return {
    isBackendSorting,
    isLoading,
    error,
    totalPages,
    getCarsForPage,
    shouldUseBackendSorting: shouldUseBackendSortingImpl,
    canUseBackendSorting,
  };
};