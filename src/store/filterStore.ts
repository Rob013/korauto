import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SearchFilters, SearchSort } from '@/lib/search/types';

export interface FilterState {
  // Filter state
  filters: SearchFilters;
  sort: SearchSort;
  page: number;
  pageSize: number;
  query: string;
  
  // UI state
  isLoading: boolean;
  hasChanged: boolean;
  
  // Actions
  setFilter: (key: keyof SearchFilters, value: any) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: SearchSort) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  resetPage: () => void;
  getSearchParams: () => URLSearchParams;
  setFromUrlParams: (params: URLSearchParams) => void;
}

const defaultSort: SearchSort = {
  field: 'listed_at',
  dir: 'desc'
};

export const useFilterStore = create<FilterState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    filters: {},
    sort: defaultSort,
    page: 1,
    pageSize: 24,
    query: '',
    isLoading: false,
    hasChanged: false,
    
    // Actions
    setFilter: (key, value) => {
      set((state) => {
        const newFilters = { ...state.filters };
        
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          delete newFilters[key];
        } else {
          newFilters[key] = value;
        }
        
        return {
          filters: newFilters,
          page: 1, // Reset page when filter changes
          hasChanged: true
        };
      });
    },
    
    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
        page: 1, // Reset page when filters change
        hasChanged: true
      }));
    },
    
    clearFilters: () => {
      set({
        filters: {},
        page: 1,
        query: '',
        hasChanged: true
      });
    },
    
    setSort: (sort) => {
      set((state) => ({
        sort,
        // Keep page when sort changes (user expects to stay on same page)
        hasChanged: true
      }));
    },
    
    setPage: (page) => {
      set({ page, hasChanged: true });
    },
    
    setPageSize: (pageSize) => {
      set({ pageSize, page: 1, hasChanged: true });
    },
    
    setQuery: (query) => {
      set({ query, page: 1, hasChanged: true });
    },
    
    setLoading: (isLoading) => {
      set({ isLoading });
    },
    
    resetPage: () => {
      set({ page: 1, hasChanged: true });
    },
    
    getSearchParams: () => {
      const state = get();
      const params = new URLSearchParams();
      
      // Add query
      if (state.query) {
        params.set('q', state.query);
      }
      
      // Add filters
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','));
          }
        } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
          // Range filter
          if (value.min !== undefined || value.max !== undefined) {
            const rangeValue = [];
            if (value.min !== undefined) rangeValue.push(`min:${value.min}`);
            if (value.max !== undefined) rangeValue.push(`max:${value.max}`);
            params.set(key, rangeValue.join(','));
          }
        } else {
          params.set(key, String(value));
        }
      });
      
      // Add sort
      if (state.sort.field !== defaultSort.field || state.sort.dir !== defaultSort.dir) {
        params.set('sort', `${state.sort.field}:${state.sort.dir}`);
      }
      
      // Add page if not first page
      if (state.page > 1) {
        params.set('page', String(state.page));
      }
      
      // Add page size if not default
      if (state.pageSize !== 24) {
        params.set('pageSize', String(state.pageSize));
      }
      
      return params;
    },
    
    setFromUrlParams: (params) => {
      const filters: SearchFilters = {};
      let sort = defaultSort;
      let page = 1;
      let pageSize = 24;
      let query = '';
      
      // Parse query
      const q = params.get('q');
      if (q) {
        query = q;
      }
      
      // Parse sort
      const sortParam = params.get('sort');
      if (sortParam) {
        const [field, dir] = sortParam.split(':');
        if (field && dir && ['asc', 'desc'].includes(dir)) {
          sort = { field: field as any, dir: dir as 'asc' | 'desc' };
        }
      }
      
      // Parse page
      const pageParam = params.get('page');
      if (pageParam) {
        const parsed = parseInt(pageParam, 10);
        if (!isNaN(parsed) && parsed > 0) {
          page = parsed;
        }
      }
      
      // Parse page size
      const pageSizeParam = params.get('pageSize');
      if (pageSizeParam) {
        const parsed = parseInt(pageSizeParam, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 48) {
          pageSize = parsed;
        }
      }
      
      // Parse filters
      const filterKeys = [
        'country', 'make', 'model', 'trim', 'fuel', 'transmission', 'body', 'drive',
        'accident', 'use_type', 'exterior_color', 'interior_color', 'region', 'options'
      ];
      
      const rangeKeys = ['year', 'price_eur', 'mileage_km', 'engine_cc'];
      const numberArrayKeys = ['owners', 'seats'];
      
      // Parse array filters
      filterKeys.forEach(key => {
        const value = params.get(key);
        if (value) {
          (filters as any)[key] = value.split(',').map(v => v.trim()).filter(v => v);
        }
      });
      
      // Parse number array filters
      numberArrayKeys.forEach(key => {
        const value = params.get(key);
        if (value) {
          const numbers = value.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
          if (numbers.length > 0) {
            (filters as any)[key] = numbers;
          }
        }
      });
      
      // Parse range filters
      rangeKeys.forEach(key => {
        const value = params.get(key);
        if (value) {
          const range: { min?: number; max?: number } = {};
          const parts = value.split(',');
          
          parts.forEach(part => {
            if (part.startsWith('min:')) {
              const min = parseFloat(part.substring(4));
              if (!isNaN(min)) range.min = min;
            } else if (part.startsWith('max:')) {
              const max = parseFloat(part.substring(4));
              if (!isNaN(max)) range.max = max;
            }
          });
          
          if (range.min !== undefined || range.max !== undefined) {
            (filters as any)[key] = range;
          }
        }
      });
      
      set({
        filters,
        sort,
        page,
        pageSize,
        query,
        hasChanged: false
      });
    }
  }))
);

// Helper function to create URL-safe filter state
export function createFilterUrl(filters: SearchFilters, sort: SearchSort, page: number, pageSize: number, query?: string): string {
  const params = new URLSearchParams();
  
  if (query) {
    params.set('q', query);
  }
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      }
    } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
      if (value.min !== undefined || value.max !== undefined) {
        const rangeValue = [];
        if (value.min !== undefined) rangeValue.push(`min:${value.min}`);
        if (value.max !== undefined) rangeValue.push(`max:${value.max}`);
        params.set(key, rangeValue.join(','));
      }
    } else {
      params.set(key, String(value));
    }
  });
  
  if (sort.field !== defaultSort.field || sort.dir !== defaultSort.dir) {
    params.set('sort', `${sort.field}:${sort.dir}`);
  }
  
  if (page > 1) {
    params.set('page', String(page));
  }
  
  if (pageSize !== 24) {
    params.set('pageSize', String(pageSize));
  }
  
  return params.toString();
}