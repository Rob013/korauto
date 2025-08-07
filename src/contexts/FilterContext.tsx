import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FilterState {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  trim_level?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  seats_count?: string;
  search?: string;
  max_accidents?: string;
}

export interface FilterOptions {
  manufacturers: Array<{ id: number; name: string; cars_qty?: number; image?: string }>;
  models: Array<{ id: number; name: string; cars_qty?: number }>;
  generations: Array<{ 
    id: number; 
    name: string; 
    cars_qty?: number; 
    from_year?: number; 
    to_year?: number; 
  }>;
  grades: Array<{ value: string; label: string; count?: number }>;
  trimLevels: Array<{ value: string; label: string; count?: number }>;
}

export interface FilterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FilterContextType {
  filters: FilterState;
  filterOptions: FilterOptions;
  isLoading: boolean;
  validation: FilterValidation;
  apiCallCount: number;
  
  // Filter actions
  updateFilter: (key: keyof FilterState, value: string | undefined) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  resetToDefaults: () => void;
  
  // Filter option actions
  loadManufacturers: () => Promise<void>;
  loadModels: (manufacturerId: string) => Promise<void>;
  loadGenerations: (manufacturerId: string, modelId?: string) => Promise<void>;
  loadGrades: (manufacturerId: string, modelId?: string, generationId?: string) => Promise<void>;
  loadTrimLevels: (manufacturerId: string, modelId?: string, generationId?: string) => Promise<void>;
  
  // Validation
  validateFilters: () => FilterValidation;
  
  // State management
  saveFiltersToStorage: () => void;
  loadFiltersFromStorage: () => void;
  canMakeApiCall: () => boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const { permissions, role } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<FilterState>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    manufacturers: [],
    models: [],
    generations: [],
    grades: [],
    trimLevels: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [apiCallTimestamps, setApiCallTimestamps] = useState<number[]>([]);

  // Reset API call count every hour
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      setApiCallTimestamps(prev => prev.filter(timestamp => timestamp > oneHourAgo));
      setApiCallCount(prev => Math.max(0, prev - 1));
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const canMakeApiCall = useCallback((): boolean => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentCalls = apiCallTimestamps.filter(timestamp => timestamp > oneHourAgo);
    
    return recentCalls.length < permissions.maxFilterApiCalls;
  }, [apiCallTimestamps, permissions.maxFilterApiCalls]);

  const recordApiCall = useCallback(() => {
    const now = Date.now();
    setApiCallTimestamps(prev => [...prev, now]);
    setApiCallCount(prev => prev + 1);
  }, []);

  const validateFilters = useCallback((): FilterValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate price range
    if (filters.buy_now_price_from && filters.buy_now_price_to) {
      const from = parseFloat(filters.buy_now_price_from);
      const to = parseFloat(filters.buy_now_price_to);
      
      if (from < 0 || to < 0) {
        errors.push('Price values cannot be negative');
      }
      
      if (from > to) {
        errors.push('Minimum price cannot be greater than maximum price');
      }
      
      if (from > 1000000 || to > 1000000) {
        warnings.push('Very high price values may limit results');
      }
    }

    // Validate mileage range
    if (filters.odometer_from_km && filters.odometer_to_km) {
      const from = parseFloat(filters.odometer_from_km);
      const to = parseFloat(filters.odometer_to_km);
      
      if (from < 0 || to < 0) {
        errors.push('Mileage values cannot be negative');
      }
      
      if (from > to) {
        errors.push('Minimum mileage cannot be greater than maximum mileage');
      }
    }

    // Validate year range
    if (filters.from_year && filters.to_year) {
      const from = parseInt(filters.from_year);
      const to = parseInt(filters.to_year);
      const currentYear = new Date().getFullYear();
      
      if (from < 1900 || to < 1900) {
        errors.push('Year values must be after 1900');
      }
      
      if (from > currentYear + 1 || to > currentYear + 1) {
        errors.push('Year values cannot be in the future');
      }
      
      if (from > to) {
        errors.push('From year cannot be greater than to year');
      }
    }

    // Check role-based restrictions
    if (role === 'anonymous') {
      const restrictedFilters = [
        'grade_iaai', 'trim_level', 'buy_now_price_from', 
        'buy_now_price_to', 'max_accidents'
      ];
      
      const hasRestrictedFilters = restrictedFilters.some(key => 
        filters[key as keyof FilterState]
      );
      
      if (hasRestrictedFilters) {
        warnings.push('Some advanced filters require user authentication');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [filters, role]);

  const validation = validateFilters();

  const updateFilter = useCallback((key: keyof FilterState, value: string | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (value === undefined || value === '' || value === 'all') {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }

      // Handle cascading filter dependencies
      if (key === 'manufacturer_id') {
        delete newFilters.model_id;
        delete newFilters.generation_id;
        delete newFilters.grade_iaai;
        delete newFilters.trim_level;
      } else if (key === 'model_id') {
        delete newFilters.generation_id;
        delete newFilters.grade_iaai;
        delete newFilters.trim_level;
      } else if (key === 'generation_id') {
        delete newFilters.grade_iaai;
        delete newFilters.trim_level;
      }

      return newFilters;
    });
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setFilterOptions({
      manufacturers: filterOptions.manufacturers, // Keep manufacturers loaded
      models: [],
      generations: [],
      grades: [],
      trimLevels: [],
    });
  }, [filterOptions.manufacturers]);

  const resetToDefaults = useCallback(() => {
    const defaultFilters: FilterState = {};
    
    // Set role-based defaults
    if (role === 'user' || role === 'admin') {
      // Authenticated users might have some default preferences
    }
    
    setFilters(defaultFilters);
  }, [role]);

  const saveFiltersToStorage = useCallback(() => {
    try {
      const filterData = {
        filters,
        timestamp: Date.now(),
        role,
      };
      localStorage.setItem('korauto-filters', JSON.stringify(filterData));
    } catch (error) {
      console.error('Failed to save filters to storage:', error);
    }
  }, [filters, role]);

  const loadFiltersFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('korauto-filters');
      if (!stored) return;

      const filterData = JSON.parse(stored);
      
      // Check if stored filters are not too old (24 hours)
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (filterData.timestamp < twentyFourHoursAgo) {
        return;
      }

      // Only load filters if role matches or user is upgrading permissions
      if (filterData.role === role || 
          (filterData.role === 'anonymous' && role !== 'anonymous')) {
        setFilters(filterData.filters || {});
      }
    } catch (error) {
      console.error('Failed to load filters from storage:', error);
    }
  }, [role]);

  // Placeholder API functions - these would integrate with the existing API hooks
  const loadManufacturers = useCallback(async () => {
    if (!canMakeApiCall()) {
      toast({
        title: 'Rate limit exceeded',
        description: 'Please wait before making more filter requests',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    recordApiCall();
    
    try {
      // This would integrate with the existing useSecureAuctionAPI hook
      // For now, we'll use the existing implementation
      console.log('Loading manufacturers...');
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
      toast({
        title: 'Error loading manufacturers',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [canMakeApiCall, recordApiCall, toast]);

  const loadModels = useCallback(async (manufacturerId: string) => {
    if (!canMakeApiCall()) {
      toast({
        title: 'Rate limit exceeded',
        description: 'Please wait before making more filter requests',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    recordApiCall();
    
    try {
      console.log('Loading models for manufacturer:', manufacturerId);
      // API implementation would go here
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canMakeApiCall, recordApiCall, toast]);

  const loadGenerations = useCallback(async (manufacturerId: string, modelId?: string) => {
    if (!canMakeApiCall()) return;

    setIsLoading(true);
    recordApiCall();
    
    try {
      console.log('Loading generations for:', { manufacturerId, modelId });
      // API implementation would go here
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canMakeApiCall, recordApiCall]);

  const loadGrades = useCallback(async (manufacturerId: string, modelId?: string, generationId?: string) => {
    if (!canMakeApiCall()) return;

    setIsLoading(true);
    recordApiCall();
    
    try {
      console.log('Loading grades for:', { manufacturerId, modelId, generationId });
      // API implementation would go here
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canMakeApiCall, recordApiCall]);

  const loadTrimLevels = useCallback(async (manufacturerId: string, modelId?: string, generationId?: string) => {
    if (!canMakeApiCall()) return;

    setIsLoading(true);
    recordApiCall();
    
    try {
      console.log('Loading trim levels for:', { manufacturerId, modelId, generationId });
      // API implementation would go here
    } catch (error) {
      console.error('Failed to load trim levels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canMakeApiCall, recordApiCall]);

  // Auto-save filters when they change
  useEffect(() => {
    const timeoutId = setTimeout(saveFiltersToStorage, 1000);
    return () => clearTimeout(timeoutId);
  }, [filters, saveFiltersToStorage]);

  // Load filters on mount
  useEffect(() => {
    loadFiltersFromStorage();
  }, [loadFiltersFromStorage]);

  const value: FilterContextType = {
    filters,
    filterOptions,
    isLoading,
    validation,
    apiCallCount,
    updateFilter,
    updateFilters,
    clearFilters,
    resetToDefaults,
    loadManufacturers,
    loadModels,
    loadGenerations,
    loadGrades,
    loadTrimLevels,
    validateFilters,
    saveFiltersToStorage,
    loadFiltersFromStorage,
    canMakeApiCall,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};