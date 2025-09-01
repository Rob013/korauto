import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CarFilters, SortOption, FrontendSortOption, getSortParams } from '@/services/carsApi';

interface BackendSortingState {
  sortBy: string;
  isLoading: boolean;
  error: string | null;
  total: number;
}

interface BackendSortingOptions {
  filters: CarFilters;
  onSortChange?: (cars: any[], total: number) => void;
}

export const useBackendSorting = ({ filters, onSortChange }: BackendSortingOptions) => {
  const [state, setState] = useState<BackendSortingState>({
    sortBy: 'price_low',
    isLoading: false,
    error: null,
    total: 0
  });

  const applySorting = useCallback(async (sortBy: SortOption | FrontendSortOption) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, sortBy }));
    
    try {
      const { field, direction } = getSortParams(sortBy);
      
      console.log(`🔄 Applying backend global sorting: ${field} ${direction}`);
      
      // Use the global sorting function to get all cars with proper sorting
      const { data: cars, error } = await supabase.rpc('cars_global_sorted', {
        p_filters: filters as any,
        p_sort_field: field,
        p_sort_dir: direction,
        p_offset: 0,
        p_limit: 1000 // Get a large batch for frontend display
      });

      if (error) {
        console.error('Backend sorting error:', error);
        throw error;
      }

      const sortedCars = cars || [];
      
      // Get total count for this filter set
      const { data: totalCount, error: countError } = await supabase.rpc('cars_filtered_count', {
        p_filters: filters as any
      });

      if (countError) {
        console.warn('Could not get total count:', countError);
      }

      const total = totalCount || sortedCars.length;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        total
      }));

      // Notify parent component of sorted results
      if (onSortChange) {
        onSortChange(sortedCars, total);
      }

      console.log(`✅ Backend sorting complete: ${sortedCars.length} cars sorted by ${field} ${direction}`);
      
      return { cars: sortedCars, total };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Backend sorting failed';
      console.error('Backend sorting failed:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      // If backend sorting fails, return empty results
      return { cars: [], total: 0 };
    }
  }, [filters, onSortChange]);

  // Auto-apply default sorting when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      applySorting(state.sortBy as SortOption | FrontendSortOption);
    }
  }, [filters, applySorting]);

  return {
    ...state,
    applySorting,
    isBackendSortingEnabled: true,
    supportedSorts: [
      'price_low',
      'price_high', 
      'year_new',
      'year_old',
      'recently_added',
      'popular'
    ] as (SortOption | FrontendSortOption)[]
  };
};