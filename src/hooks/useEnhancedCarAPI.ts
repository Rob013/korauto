// Enhanced Car API Hook with real external data and comprehensive Encar-style filtering
import { useState, useEffect, useCallback, useMemo } from 'react';
import { externalCarAPI, type ExternalCar, type CarFilters, type FilterOptions } from '@/services/externalCarAPI';

interface UseEnhancedCarAPIReturn {
  // Car data
  cars: ExternalCar[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  
  // Filter options
  filterOptions: FilterOptions;
  loadingFilters: boolean;
  
  // Filter state
  filters: CarFilters;
  setFilters: (filters: CarFilters) => void;
  resetFilters: () => void;
  
  // Actions
  fetchCars: (page?: number, reset?: boolean) => Promise<void>;
  fetchModels: (manufacturerId: string) => Promise<void>;
  fetchGenerations: (modelId: string) => Promise<void>;
  fetchTrims: (modelId: string, generationId?: string) => Promise<void>;
  fetchGrades: (modelId: string, generationId?: string) => Promise<void>;
  
  // Pagination
  currentPage: number;
  loadMore: () => Promise<void>;
  
  // Search
  searchCars: (searchTerm: string) => Promise<void>;
}

interface CacheState {
  models: { [manufacturerId: string]: Array<{ id: string; name: string; count?: number }> };
  generations: { [modelId: string]: Array<{ id: string; name: string; from_year: number; to_year: number; count?: number }> };
  trims: { [key: string]: Array<{ id: string; name: string; count?: number }> }; // key: modelId or modelId-generationId
  grades: { [key: string]: Array<{ id: string; name: string; category?: string; count?: number }> }; // key: modelId or modelId-generationId
}

const initialFilters: CarFilters = {};

export const useEnhancedCarAPI = (): UseEnhancedCarAPIReturn => {
  // Main state
  const [cars, setCars] = useState<ExternalCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter state
  const [filters, setFiltersState] = useState<CarFilters>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    manufacturers: [],
    models: [],
    generations: [],
    trims: [],
    grades: [],
    bodyTypes: [],
    fuelTypes: [],
    transmissions: [],
    colors: [],
    locations: []
  });
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  // Cache for dependent filter options
  const [cache, setCache] = useState<CacheState>({
    models: {},
    generations: {},
    trims: {},
    grades: {}
  });

  // Fetch initial filter options
  useEffect(() => {
    const loadInitialFilters = async () => {
      setLoadingFilters(true);
      try {
        const options = await externalCarAPI.fetchFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Error loading filter options:', err);
        setError('Failed to load filter options');
      } finally {
        setLoadingFilters(false);
      }
    };

    loadInitialFilters();
  }, []);

  // Fetch cars with current filters
  const fetchCars = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (page === 1 || reset) {
      setLoading(true);
      setCars([]);
      setCurrentPage(1);
    }
    
    setError(null);

    try {
      console.log('🔄 Fetching cars with filters:', filters, 'page:', page);
      
      const response = await externalCarAPI.fetchCars(filters, page, 24);
      
      if (page === 1 || reset) {
        setCars(response.cars);
      } else {
        setCars(prev => [...prev, ...response.cars]);
      }
      
      setTotalCount(response.total);
      setHasMore(response.hasMore);
      setCurrentPage(page);
      
      console.log('✅ Fetched cars:', response.cars.length, 'total:', response.total);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load more cars (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchCars(currentPage + 1, false);
  }, [hasMore, loading, currentPage, fetchCars]);

  // Fetch models based on manufacturer
  const fetchModels = useCallback(async (manufacturerId: string) => {
    if (cache.models[manufacturerId]) {
      setFilterOptions(prev => ({
        ...prev,
        models: cache.models[manufacturerId]
      }));
      return;
    }

    setLoadingFilters(true);
    try {
      const models = await externalCarAPI.fetchModels(manufacturerId);
      
      setCache(prev => ({
        ...prev,
        models: { ...prev.models, [manufacturerId]: models }
      }));
      
      setFilterOptions(prev => ({
        ...prev,
        models,
        generations: [], // Reset dependent options
        trims: [],
        grades: []
      }));
    } catch (err) {
      console.error('Error fetching models:', err);
    } finally {
      setLoadingFilters(false);
    }
  }, [cache.models]);

  // Fetch generations based on model
  const fetchGenerations = useCallback(async (modelId: string) => {
    if (cache.generations[modelId]) {
      setFilterOptions(prev => ({
        ...prev,
        generations: cache.generations[modelId]
      }));
      return;
    }

    setLoadingFilters(true);
    try {
      const generations = await externalCarAPI.fetchGenerations(modelId);
      
      setCache(prev => ({
        ...prev,
        generations: { ...prev.generations, [modelId]: generations }
      }));
      
      setFilterOptions(prev => ({
        ...prev,
        generations,
        trims: [], // Reset dependent options
        grades: []
      }));
    } catch (err) {
      console.error('Error fetching generations:', err);
    } finally {
      setLoadingFilters(false);
    }
  }, [cache.generations]);

  // Fetch trims based on model and generation
  const fetchTrims = useCallback(async (modelId: string, generationId?: string) => {
    const cacheKey = generationId ? `${modelId}-${generationId}` : modelId;
    
    if (cache.trims[cacheKey]) {
      setFilterOptions(prev => ({
        ...prev,
        trims: cache.trims[cacheKey]
      }));
      return;
    }

    setLoadingFilters(true);
    try {
      const trims = await externalCarAPI.fetchTrims(modelId, generationId);
      
      setCache(prev => ({
        ...prev,
        trims: { ...prev.trims, [cacheKey]: trims }
      }));
      
      setFilterOptions(prev => ({
        ...prev,
        trims
      }));
    } catch (err) {
      console.error('Error fetching trims:', err);
    } finally {
      setLoadingFilters(false);
    }
  }, [cache.trims]);

  // Fetch grades based on model and generation
  const fetchGrades = useCallback(async (modelId: string, generationId?: string) => {
    const cacheKey = generationId ? `${modelId}-${generationId}` : modelId;
    
    if (cache.grades[cacheKey]) {
      setFilterOptions(prev => ({
        ...prev,
        grades: cache.grades[cacheKey]
      }));
      return;
    }

    setLoadingFilters(true);
    try {
      const grades = await externalCarAPI.fetchGrades(modelId, generationId);
      
      setCache(prev => ({
        ...prev,
        grades: { ...prev.grades, [cacheKey]: grades }
      }));
      
      setFilterOptions(prev => ({
        ...prev,
        grades
      }));
    } catch (err) {
      console.error('Error fetching grades:', err);
    } finally {
      setLoadingFilters(false);
    }
  }, [cache.grades]);

  // Enhanced filter setter with automatic dependent data loading
  const setFilters = useCallback(async (newFilters: CarFilters) => {
    const prevFilters = filters;
    setFiltersState(newFilters);

    // Handle manufacturer change
    if (newFilters.manufacturer_id !== prevFilters.manufacturer_id) {
      if (newFilters.manufacturer_id) {
        await fetchModels(newFilters.manufacturer_id);
      } else {
        setFilterOptions(prev => ({
          ...prev,
          models: [],
          generations: [],
          trims: [],
          grades: []
        }));
      }
    }

    // Handle model change
    if (newFilters.model_id !== prevFilters.model_id) {
      if (newFilters.model_id) {
        await fetchGenerations(newFilters.model_id);
        await fetchTrims(newFilters.model_id);
        await fetchGrades(newFilters.model_id);
      } else {
        setFilterOptions(prev => ({
          ...prev,
          generations: [],
          trims: [],
          grades: []
        }));
      }
    }

    // Handle generation change
    if (newFilters.generation_id !== prevFilters.generation_id && newFilters.model_id) {
      if (newFilters.generation_id) {
        await fetchTrims(newFilters.model_id, newFilters.generation_id);
        await fetchGrades(newFilters.model_id, newFilters.generation_id);
      }
    }
  }, [filters, fetchModels, fetchGenerations, fetchTrims, fetchGrades]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setFilterOptions(prev => ({
      ...prev,
      models: [],
      generations: [],
      trims: [],
      grades: []
    }));
  }, []);

  // Search cars
  const searchCars = useCallback(async (searchTerm: string) => {
    const searchFilters = {
      ...filters,
      search: searchTerm
    };
    setFiltersState(searchFilters);
  }, [filters]);

  // Auto-fetch cars when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCars(1, true);
    }, 300); // Debounce filter changes

    return () => clearTimeout(timer);
  }, [filters]);

  // Computed values
  const isFiltered = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    );
  }, [filters]);

  return {
    // Car data
    cars,
    loading,
    error,
    totalCount,
    hasMore,
    
    // Filter options
    filterOptions,
    loadingFilters,
    
    // Filter state
    filters,
    setFilters,
    resetFilters,
    
    // Actions
    fetchCars,
    fetchModels,
    fetchGenerations,
    fetchTrims,
    fetchGrades,
    
    // Pagination
    currentPage,
    loadMore,
    
    // Search
    searchCars
  };
};