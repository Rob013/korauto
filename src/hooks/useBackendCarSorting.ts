import { useState, useCallback } from 'react';
import { fetchCarsWithKeyset, SortOption as BackendSortOption } from '@/services/carsApi';
import { SortOption as FrontendSortOption } from '@/hooks/useSortedCars';
import { APIFilters } from '@/utils/catalog-filter';

interface UseBackendCarSortingProps {
  filters: APIFilters;
  onCarsUpdate: (cars: any[], totalCount: number) => void;
  onError: (error: string) => void;
}

export const useBackendCarSorting = ({ 
  filters, 
  onCarsUpdate, 
  onError 
}: UseBackendCarSortingProps) => {
  const [loading, setLoading] = useState(false);
  const [currentSort, setCurrentSort] = useState<FrontendSortOption>('price_low');

  // Map frontend sort options to backend sort options
  const mapSortOption = (frontendSort: FrontendSortOption): BackendSortOption => {
    switch (frontendSort) {
      case 'price_low': return 'price_asc';
      case 'price_high': return 'price_desc';
      default: return 'price_asc';
    }
  };

  // Convert APIFilters to backend filters format
  const convertFilters = (apiFilters: APIFilters) => {
    const backendFilters: Record<string, any> = {};
    
    if (apiFilters.manufacturer_id && apiFilters.manufacturer_id !== 'all') {
      backendFilters.make = apiFilters.manufacturer_id;
    }
    if (apiFilters.model_id) {
      backendFilters.model = apiFilters.model_id;
    }
    if (apiFilters.from_year) {
      backendFilters.yearMin = apiFilters.from_year;
    }
    if (apiFilters.to_year) {
      backendFilters.yearMax = apiFilters.to_year;
    }
    if (apiFilters.search) {
      backendFilters.search = apiFilters.search;
    }

    return backendFilters;
  };

  const fetchWithBackendSorting = useCallback(async (
    sortOption: FrontendSortOption,
    pageSize: number = 50
  ) => {
    console.log(`🔄 Backend sorting: Fetching ${sortOption} for all filtered cars`);
    setLoading(true);
    
    try {
      const backendSort = mapSortOption(sortOption);
      const backendFilters = convertFilters(filters);
      
      // Fetch a large number to get all cars for the current filters
      const response = await fetchCarsWithKeyset({
        filters: backendFilters,
        sort: backendSort,
        limit: 999 // Get all cars for this filter set
      });

      console.log(`✅ Backend sorting complete: ${response.total} cars sorted by ${sortOption}`);
      
      // Update cars and total count
      onCarsUpdate(response.items, response.total);
      setCurrentSort(sortOption);
      
    } catch (error) {
      console.error('❌ Backend sorting failed:', error);
      onError(error instanceof Error ? error.message : 'Failed to sort cars');
    } finally {
      setLoading(false);
    }
  }, [filters, onCarsUpdate, onError]);

  return {
    fetchWithBackendSorting,
    loading,
    currentSort
  };
};