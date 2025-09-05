import { create } from 'zustand';
import { SearchReq, DEFAULT_SORT, DEFAULT_PAGE_SIZE } from '@/lib/search/types';

export interface FilterState {
  filters: SearchReq['filters'];
  sort: SearchReq['sort'];
  page: number;
  pageSize: number;
  query: string;
}

export interface FilterActions {
  setFilter: (key: keyof SearchReq['filters'], value: any) => void;
  updateFilters: (newFilters: Partial<SearchReq['filters']>) => void;
  clearFilters: () => void;
  setSort: (sort: SearchReq['sort']) => void;
  setPage: (page: number) => void;
  setQuery: (query: string) => void;
  resetPage: () => void;
  setPageSize: (pageSize: number) => void;
  setState: (state: Partial<FilterState>) => void;
}

const initialState: FilterState = {
  filters: {},
  sort: DEFAULT_SORT,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  query: '',
};

export const useFilterStore = create<FilterState & FilterActions>((set, get) => ({
  ...initialState,

  setFilter: (key, value) => {
    set((state) => {
      const newFilters = { ...state.filters };
      
      if (value === undefined || value === null || 
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'string' && value.trim() === '')) {
        // Remove the filter if value is empty
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

  setSort: (sort) => {
    set({ sort });
    // Note: Don't reset page on sort change as per requirements
  },

  setPage: (page) => {
    set({ page });
  },

  setQuery: (query) => {
    set({ 
      query,
      page: 1, // Reset page when search query changes
    });
  },

  resetPage: () => {
    set({ page: 1 });
  },

  setPageSize: (pageSize) => {
    set({ 
      pageSize,
      page: 1, // Reset page when page size changes
    });
  },

  setState: (newState) => {
    set((state) => ({ ...state, ...newState }));
  },
}));

// Selectors for common combinations
export const useFilterStoreSelectors = () => {
  const state = useFilterStore();
  
  // Add safety checks to prevent TDZ errors during initialization
  const safeState = {
    query: state?.query || '',
    filters: state?.filters || {},
    sort: state?.sort || initialState.sort,
    page: state?.page || 1,
    pageSize: state?.pageSize || initialState.pageSize,
  };
  
  return {
    // Complete search request object
    searchRequest: (): SearchReq => ({
      q: safeState.query || undefined,
      filters: Object.keys(safeState.filters).length > 0 ? safeState.filters : undefined,
      sort: safeState.sort,
      page: safeState.page,
      pageSize: safeState.pageSize,
    }),
    
    // Check if any filters are active
    hasActiveFilters: (): boolean => {
      return Object.keys(safeState.filters).length > 0 || Boolean(safeState.query);
    },
    
    // Get current filter count
    activeFilterCount: (): number => {
      return Object.keys(safeState.filters).length + (safeState.query ? 1 : 0);
    },
    
    // Check if specific filter is active
    isFilterActive: (key: keyof SearchReq['filters']): boolean => {
      const value = safeState.filters[key];
      return value !== undefined && value !== null && 
             (!Array.isArray(value) || value.length > 0);
    },
  };
};