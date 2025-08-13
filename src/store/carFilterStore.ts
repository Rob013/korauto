// @ts-nocheck
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Filter types optimized for Supabase cars_cache table
export interface CarFilters {
  // Text search
  query?: string;
  
  // Exact match filters
  make?: string;
  model?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  
  // Range filters
  year?: { min?: number; max?: number };
  price?: { min?: number; max?: number };
  mileage?: { min?: number; max?: number };
  
  // Multi-select arrays (for future enhancement)
  makes?: string[];
  models?: string[];
  fuels?: string[];
  transmissions?: string[];
  colors?: string[];
  conditions?: string[];
}

export interface SortOption {
  field: 'created_at' | 'price' | 'year' | 'mileage' | 'make' | 'model';
  direction: 'asc' | 'desc';
}

export interface CarFilterState {
  // Filter state
  filters: CarFilters;
  sort: SortOption;
  
  // Pagination
  page: number;
  pageSize: number;
  
  // UI state
  isLoading: boolean;
  showAdvancedFilters: boolean;
  
  // Available filter options (for dropdowns)
  availableOptions: {
    makes: Array<{ value: string; label: string; count?: number }>;
    models: Array<{ value: string; label: string; count?: number; makeId?: string }>;
    fuels: Array<{ value: string; label: string; count?: number }>;
    transmissions: Array<{ value: string; label: string; count?: number }>;
    colors: Array<{ value: string; label: string; count?: number }>;
    conditions: Array<{ value: string; label: string; count?: number }>;
    yearRange: { min: number; max: number };
    priceRange: { min: number; max: number };
    mileageRange: { min: number; max: number };
  };
}

export interface CarFilterActions {
  // Filter actions
  setFilter: <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => void;
  updateFilters: (newFilters: Partial<CarFilters>) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof CarFilters) => void;
  
  // Sort actions
  setSort: (sort: SortOption) => void;
  
  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetPage: () => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setShowAdvancedFilters: (show: boolean) => void;
  
  // Available options actions
  setAvailableOptions: (options: Partial<CarFilterState['availableOptions']>) => void;
  
  // Computed getters
  getActiveFilterCount: () => number;
  hasActiveFilters: () => boolean;
  getFiltersForQuery: () => CarFilters;
}

// Default state
const defaultSort: SortOption = { field: 'created_at', direction: 'desc' };
const defaultPageSize = 20;

const defaultAvailableOptions: CarFilterState['availableOptions'] = {
  makes: [],
  models: [],
  fuels: [],
  transmissions: [],
  colors: [],
  conditions: [],
  yearRange: { min: 2000, max: new Date().getFullYear() },
  priceRange: { min: 0, max: 100000 },
  mileageRange: { min: 0, max: 500000 },
};

export const useCarFilterStore = create<CarFilterState & CarFilterActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      filters: {},
      sort: defaultSort,
      page: 1,
      pageSize: defaultPageSize,
      isLoading: false,
      showAdvancedFilters: false,
      availableOptions: defaultAvailableOptions,

      // Filter actions
      setFilter: (key, value) => {
        set((state) => {
          const newFilters = { ...state.filters };
          
          if (value === undefined || value === null || 
              (typeof value === 'string' && value.trim() === '') ||
              (Array.isArray(value) && value.length === 0) ||
              (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0)) {
            // Remove empty filters including empty objects
            delete newFilters[key];
          } else {
            newFilters[key] = value;
          }

          return {
            filters: newFilters,
            page: 1, // Reset page when filters change
          };
        });
      },

      updateFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          page: 1, // Reset page when filters change
        }));
      },

      clearFilters: () => {
        set({
          filters: {},
          page: 1,
        });
      },

      clearFilter: (key) => {
        set((state) => {
          const newFilters = { ...state.filters };
          delete newFilters[key];
          return {
            filters: newFilters,
            page: 1,
          };
        });
      },

      // Sort actions
      setSort: (sort) => {
        set({ sort });
      },

      // Pagination actions
      setPage: (page) => {
        set({ page });
      },

      setPageSize: (pageSize) => {
        set({ pageSize, page: 1 });
      },

      resetPage: () => {
        set({ page: 1 });
      },

      // UI actions
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setShowAdvancedFilters: (showAdvancedFilters) => {
        set({ showAdvancedFilters });
      },

      // Available options actions
      setAvailableOptions: (options) => {
        set((state) => ({
          availableOptions: { ...state.availableOptions, ...options },
        }));
      },

      // Computed getters
      getActiveFilterCount: () => {
        const { filters } = get();
        let count = 0;
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'string' && value.trim() !== '') {
              count++;
            } else if (Array.isArray(value) && value.length > 0) {
              count++;
            } else if (typeof value === 'object' && value !== null) {
              // For range objects, count if they have min or max
              const range = value as { min?: number; max?: number };
              if (range.min !== undefined || range.max !== undefined) {
                count++;
              }
            } else if (typeof value === 'number') {
              count++;
            }
          }
        });
        
        return count;
      },

      hasActiveFilters: () => {
        return get().getActiveFilterCount() > 0;
      },

      getFiltersForQuery: () => {
        const { filters } = get();
        // Return a clean copy of filters for query building
        const cleanFilters: CarFilters = {};
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'string' && value.trim() !== '') {
              cleanFilters[key as keyof CarFilters] = value.trim();
            } else if (Array.isArray(value) && value.length > 0) {
              cleanFilters[key as keyof CarFilters] = value;
            } else if (typeof value === 'object' && value !== null) {
              // For range objects, only include if they have meaningful values
              const range = value as { min?: number; max?: number };
              if (range.min !== undefined || range.max !== undefined) {
                cleanFilters[key as keyof CarFilters] = range;
              }
            } else if (typeof value === 'number') {
              cleanFilters[key as keyof CarFilters] = value;
            }
          }
        });
        
        return cleanFilters;
      },
    }),
    {
      name: 'car-filter-store',
      partialize: (state) => ({
        filters: state.filters,
        sort: state.sort,
        page: state.page,
        pageSize: state.pageSize,
        showAdvancedFilters: state.showAdvancedFilters,
      }),
    }
  )
);

// Selectors for common use cases
export const useCarFilterSelectors = () => {
  const state = useCarFilterStore();
  
  return {
    // Filtered models based on selected make
    getFilteredModels: () => {
      const { filters, availableOptions } = state;
      if (!filters.make) return availableOptions.models;
      
      return availableOptions.models.filter(
        model => model.makeId === filters.make
      );
    },
    
    // Check if specific filter is active
    isFilterActive: (key: keyof CarFilters) => {
      const value = state.filters[key];
      return value !== undefined && value !== null && 
             (typeof value !== 'string' || value.trim() !== '') &&
             (!Array.isArray(value) || value.length > 0);
    },
    
    // Get display value for filter
    getFilterDisplayValue: (key: keyof CarFilters) => {
      const value = state.filters[key];
      if (!value) return null;
      
      if (typeof value === 'object' && 'min' in value && 'max' in value) {
        const range = value as { min?: number; max?: number };
        if (range.min !== undefined && range.max !== undefined) {
          return `${range.min} - ${range.max}`;
        } else if (range.min !== undefined) {
          return `≥ ${range.min}`;
        } else if (range.max !== undefined) {
          return `≤ ${range.max}`;
        }
      }
      
      return String(value);
    },
  };
};