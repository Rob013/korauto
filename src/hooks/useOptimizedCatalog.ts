import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSecureAuctionAPI } from '@/hooks/useSecureAuctionAPI';
import { useSortedCars, SortOption } from '@/hooks/useSortedCars';
import { useFavoritesBatch } from '@/hooks/useFavoritesBatch';

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
  seats_count?: string;
}

export const useOptimizedCatalog = (highlightCarId?: string | null) => {
  const { cars, loading, error, totalCount, hasMorePages, fetchCars, fetchManufacturers, fetchModels, fetchGenerations, fetchFilterCounts, loadMore } = useSecureAuctionAPI();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('price_low');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState<APIFilters>(() => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      ...params,
      manufacturer_id: params.manufacturer_id || undefined,
      model_id: params.model_id || undefined,
      generation_id: params.generation_id || undefined,
      search: params.search || undefined,
    };
  });

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const [filterCounts, setFilterCounts] = useState<any>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Memoize car IDs for batch favorites checking
  const carIds = useMemo(() => cars.map(car => car.id), [cars]);
  const { isFavorite } = useFavoritesBatch(carIds);

  // Type conversion and sorting
  const carsForSorting = useMemo(() => cars.map(car => ({
    ...car,
    status: String(car.status || ''),
    lot_number: String(car.lot_number || ''),
    cylinders: Number(car.cylinders || 0)
  })), [cars]);
  
  const sortedCars = useSortedCars(carsForSorting, sortBy);

  // Optimized filter change handler
  const handleFiltersChange = useCallback((newFilters: APIFilters) => {
    setFilters(newFilters);
    fetchCars(1, newFilters, true);

    const nonEmpty = Object.entries(newFilters).filter(([_, v]) => v !== undefined && v !== '');
    setSearchParams(Object.fromEntries(nonEmpty));
  }, [fetchCars, setSearchParams]);

  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setModels([]);
    setGenerations([]);
    fetchCars(1, {}, true);
    setSearchParams({});
  }, [fetchCars, setSearchParams]);

  // Manufacturer change handler
  const handleManufacturerChange = useCallback(async (manufacturerId: string) => {
    const modelData = manufacturerId ? await fetchModels(manufacturerId) : [];
    setModels(modelData);

    const newFilters: APIFilters = {
      ...filters,
      manufacturer_id: manufacturerId || undefined,
      model_id: undefined,
      generation_id: undefined
    };
    setFilters(newFilters);
    setSearchParams(Object.fromEntries(Object.entries(newFilters).filter(([_, v]) => v)));
    setGenerations([]);
  }, [filters, fetchModels, setSearchParams]);

  // Model change handler
  const handleModelChange = useCallback(async (modelId: string) => {
    const generationData = modelId ? await fetchGenerations(modelId) : [];
    setGenerations(generationData);

    const newFilters: APIFilters = {
      ...filters,
      model_id: modelId || undefined,
      generation_id: undefined
    };
    setFilters(newFilters);
    setSearchParams(Object.fromEntries(Object.entries(newFilters).filter(([_, v]) => v)));
  }, [filters, fetchGenerations, setSearchParams]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    loadMore(filters);
  }, [loadMore, filters]);

  // Highlight effect for specific car
  useEffect(() => {
    if (highlightCarId && cars.length > 0) {
      const timer = setTimeout(() => {
        let carElement = document.getElementById(`car-lot-${highlightCarId}`);
        if (!carElement) {
          carElement = document.getElementById(`car-${highlightCarId}`);
        }
        
        if (carElement) {
          carElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          carElement.style.border = '3px solid #3b82f6';
          carElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
          
          setTimeout(() => {
            carElement.style.border = '';
            carElement.style.boxShadow = '';
          }, 3000);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [highlightCarId, cars]);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      const manufacturerData = await fetchManufacturers();
      setManufacturers(manufacturerData);

      if (filters.manufacturer_id) {
        const models = await fetchModels(filters.manufacturer_id);
        setModels(models);
      }

      if (filters.model_id) {
        const generations = await fetchGenerations(filters.model_id);
        setGenerations(generations);
      }

      fetchCars(1, filters, true);
    };

    init();
  }, []);

  // Optimized filter counts fetching
  useEffect(() => {
    const loadFilterCounts = async () => {
      if (manufacturers.length > 0) {
        setLoadingCounts(true);
        try {
          const counts = await fetchFilterCounts(filters, manufacturers);
          setFilterCounts(counts);
        } finally {
          setLoadingCounts(false);
        }
      }
    };

    const debounceTimer = setTimeout(loadFilterCounts, 300);
    return () => clearTimeout(debounceTimer);
  }, [filters, manufacturers, fetchFilterCounts]);

  return {
    // Data
    cars: sortedCars,
    loading,
    error,
    totalCount,
    hasMorePages,
    
    // UI State
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    
    // Filters
    filters,
    searchTerm,
    setSearchTerm,
    showAdvancedFilters,
    setShowAdvancedFilters,
    
    // Filter data
    manufacturers,
    models,
    generations,
    filterCounts,
    loadingCounts,
    
    // Handlers
    handleFiltersChange,
    handleClearFilters,
    handleManufacturerChange,
    handleModelChange,
    handleLoadMore,
    
    // Utilities
    isFavorite
  };
};