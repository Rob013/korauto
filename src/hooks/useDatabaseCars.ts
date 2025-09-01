/**
 * Database Cars Hook
 * 
 * This hook provides direct access to the local car database with proper backend sorting,
 * replacing the external API calls for better performance and global sorting support.
 */

import { useState, useCallback, useEffect } from 'react';
import { fetchCarsWithKeyset, CarFilters, SortOption, FrontendSortOption, mapFrontendSortToBackend } from '@/services/carsApi';
import { supabase } from '@/integrations/supabase/client';
import { useAutoRefreshOnSync } from '@/hooks/useCarSync';

/**
 * Generate generation name from year, make and model
 * Groups cars into logical generations based on year ranges
 */
const generateGenerationNameFromYear = (year: number, make?: string, model?: string): string | null => {
  if (!year || year < 1980 || year > new Date().getFullYear() + 1) return null;
  
  // Group into 7-year generations (common car generation cycle)
  const generationStart = Math.floor((year - 1980) / 7) * 7 + 1980;
  const generationEnd = generationStart + 6;
  
  // Create generation name
  const currentYear = new Date().getFullYear();
  if (generationEnd > currentYear) {
    return `${generationStart}-${currentYear}`;
  }
  
  return `${generationStart}-${generationEnd}`;
};

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  color?: string;
  location?: string;
  images?: any;
  image_url?: string;
  title?: string;
  created_at?: string;
  price_cents?: number;
  rank_score?: number;
}

interface UseDatabaseCarsState {
  cars: Car[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasMorePages: boolean;
  nextCursor?: string;
}

interface UseDatabaseCarsOptions {
  pageSize?: number;
  enableCaching?: boolean;
}

export const useDatabaseCars = (options: UseDatabaseCarsOptions = {}) => {
  const { pageSize = 24, enableCaching = true } = options;
  
  const [state, setState] = useState<UseDatabaseCarsState>({
    cars: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasMorePages: false,
    nextCursor: undefined
  });

  // Filter state for compatibility with existing catalog
  const [filters, setFilters] = useState<any>({});

  // Cache for filters and manufacturers data
  const [manufacturersCache, setManufacturersCache] = useState<any[]>([]);
  const [modelsCache, setModelsCache] = useState<Map<string, any[]>>(new Map());

  /**
   * Fetch cars with backend sorting and pagination
   * Compatible with useSecureAuctionAPI interface
   */
  const fetchCars = useCallback(async (
    page: number = 1,
    newFilters: any = {},
    resetList: boolean = true
  ) => {
    if (resetList) {
      setState(prev => ({ ...prev, loading: true, error: null, currentPage: page }));
      setFilters(newFilters);
    }

    try {
      // Convert API filters to CarFilters format for database query
      const dbFilters: CarFilters = {};
      
      if (newFilters.manufacturer_id) dbFilters.make = newFilters.manufacturer_id;
      if (newFilters.model_id) dbFilters.model = newFilters.model_id;
      if (newFilters.from_year) dbFilters.yearMin = newFilters.from_year;
      if (newFilters.to_year) dbFilters.yearMax = newFilters.to_year;
      if (newFilters.buy_now_price_from) dbFilters.priceMin = newFilters.buy_now_price_from;
      if (newFilters.buy_now_price_to) dbFilters.priceMax = newFilters.buy_now_price_to;
      if (newFilters.fuel_type) dbFilters.fuel = newFilters.fuel_type;
      if (newFilters.search) dbFilters.search = newFilters.search;

      // Extract sort parameters
      let sortBy: SortOption | FrontendSortOption = 'recently_added';
      if (newFilters.sort_by && newFilters.sort_direction) {
        // Map database sort parameters to frontend sort options
        if (newFilters.sort_by === 'price') {
          sortBy = newFilters.sort_direction === 'asc' ? 'price_low' : 'price_high';
        } else if (newFilters.sort_by === 'year') {
          sortBy = newFilters.sort_direction === 'desc' ? 'year_new' : 'year_old';
        } else if (newFilters.sort_by === 'mileage') {
          sortBy = newFilters.sort_direction === 'asc' ? 'mileage_low' : 'mileage_high';
        } else if (newFilters.sort_by === 'created_at') {
          sortBy = newFilters.sort_direction === 'desc' ? 'recently_added' : 'oldest_first';
        }
      }

      // Map frontend sort option to backend sort option
      const backendSort = mapFrontendSortToBackend(sortBy);
      
      // Calculate cursor for pagination (if not page 1)
      let cursor: string | undefined;
      if (page > 1 && state.nextCursor) {
        cursor = state.nextCursor;
      }

      console.log(`🔄 Fetching cars: page ${page}, sort: ${sortBy} (${backendSort}), filters:`, dbFilters);

      const response = await fetchCarsWithKeyset({
        filters: dbFilters,
        sort: backendSort,
        limit: pageSize,
        cursor: resetList ? undefined : cursor
      });

      const newCars = response.items.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        mileage: car.mileage,
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        location: car.location,
        images: car.images,
        image_url: car.image_url,
        title: car.title || `${car.year} ${car.make} ${car.model}`,
        created_at: car.created_at,
        price_cents: car.price_cents,
        rank_score: car.rank_score,
        // Add compatibility fields for catalog
        manufacturer: { name: car.make },
        lots: [{
          buy_now: car.price,
          images: { normal: car.images || [] },
          odometer: { km: car.mileage }
        }]
      }));

      const totalPages = Math.ceil(response.total / pageSize);
      const hasMore = !!response.nextCursor;

      setState(prev => ({
        ...prev,
        cars: resetList ? newCars : [...prev.cars, ...newCars],
        totalCount: response.total,
        currentPage: page,
        hasMorePages: hasMore,
        nextCursor: response.nextCursor,
        loading: false
      }));

      console.log(`✅ Fetched ${newCars.length} cars (${response.total} total)`);

    } catch (error) {
      console.error('❌ Error fetching cars:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cars'
      }));
    }
  }, [pageSize, state.nextCursor]);

  /**
   * Fetch all cars for global sorting (used for "Show All" functionality)
   * Compatible with useSecureAuctionAPI interface
   */
  const fetchAllCars = useCallback(async (
    filtersWithSort: any = {}
  ): Promise<Car[]> => {
    try {
      // Convert API filters to CarFilters format for database query
      const dbFilters: CarFilters = {};
      
      if (filtersWithSort.manufacturer_id) dbFilters.make = filtersWithSort.manufacturer_id;
      if (filtersWithSort.model_id) dbFilters.model = filtersWithSort.model_id;
      if (filtersWithSort.from_year) dbFilters.yearMin = filtersWithSort.from_year;
      if (filtersWithSort.to_year) dbFilters.yearMax = filtersWithSort.to_year;
      if (filtersWithSort.buy_now_price_from) dbFilters.priceMin = filtersWithSort.buy_now_price_from;
      if (filtersWithSort.buy_now_price_to) dbFilters.priceMax = filtersWithSort.buy_now_price_to;
      if (filtersWithSort.fuel_type) dbFilters.fuel = filtersWithSort.fuel_type;
      if (filtersWithSort.search) dbFilters.search = filtersWithSort.search;

      // Extract sort parameters
      let sortBy: SortOption | FrontendSortOption = 'recently_added';
      if (filtersWithSort.sort_by && filtersWithSort.sort_direction) {
        // Map database sort parameters to frontend sort options
        if (filtersWithSort.sort_by === 'price') {
          sortBy = filtersWithSort.sort_direction === 'asc' ? 'price_low' : 'price_high';
        } else if (filtersWithSort.sort_by === 'year') {
          sortBy = filtersWithSort.sort_direction === 'desc' ? 'year_new' : 'year_old';
        } else if (filtersWithSort.sort_by === 'mileage') {
          sortBy = filtersWithSort.sort_direction === 'asc' ? 'mileage_low' : 'mileage_high';
        } else if (filtersWithSort.sort_by === 'created_at') {
          sortBy = filtersWithSort.sort_direction === 'desc' ? 'recently_added' : 'oldest_first';
        }
      }
      
      const backendSort = mapFrontendSortToBackend(sortBy);
      
      console.log(`🔄 Fetching ALL cars for global sorting: ${sortBy} (${backendSort})`);

      const response = await fetchCarsWithKeyset({
        filters: dbFilters,
        sort: backendSort,
        limit: 9999 // Get all cars for global sorting
      });

      const allCars = response.items.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        mileage: car.mileage,
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        location: car.location,
        images: car.images,
        image_url: car.image_url,
        title: car.title || `${car.year} ${car.make} ${car.model}`,
        created_at: car.created_at,
        price_cents: car.price_cents,
        rank_score: car.rank_score,
        // Add compatibility fields for catalog
        manufacturer: { name: car.make },
        lots: [{
          buy_now: car.price,
          images: { normal: car.images || [] },
          odometer: { km: car.mileage }
        }]
      }));

      console.log(`✅ Fetched ${allCars.length} cars for global sorting`);
      return allCars;

    } catch (error) {
      console.error('❌ Error fetching all cars:', error);
      throw error;
    }
  }, []);

  /**
   * Load more cars (for infinite scroll)
   * Compatible with useSecureAuctionAPI interface
   */
  const loadMore = useCallback(async () => {
    if (!state.hasMorePages || state.loading) return;
    
    await fetchCars(state.currentPage + 1, filters, false);
  }, [fetchCars, state.hasMorePages, state.loading, state.currentPage, filters]);

  /**
   * Fetch manufacturers from database (extracted from cars table)
   */
  const fetchManufacturers = useCallback(async () => {
    if (manufacturersCache.length > 0 && enableCaching) {
      return manufacturersCache;
    }

    try {
      // Extract unique manufacturers from cars table
      const { data, error } = await supabase
        .from('cars')
        .select('make')
        .eq('is_active', true)
        .not('make', 'is', null);

      if (error) throw error;

      // Group by manufacturer and count cars
      const manufacturerCounts = new Map<string, number>();
      data?.forEach(car => {
        if (car.make && car.make.trim()) {
          const make = car.make.trim();
          manufacturerCounts.set(make, (manufacturerCounts.get(make) || 0) + 1);
        }
      });

      // Convert to the expected format with ID (using hash of name for consistent ID)
      const manufacturers = Array.from(manufacturerCounts.entries())
        .map(([name, car_count], index) => ({
          id: index + 1, // Simple incremental ID
          name,
          car_count,
          cars_qty: car_count
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (enableCaching) {
        setManufacturersCache(manufacturers);
      }
      
      console.log(`✅ Fetched ${manufacturers.length} manufacturers from database`);
      return manufacturers;
    } catch (error) {
      console.error('❌ Error fetching manufacturers:', error);
      return [];
    }
  }, [manufacturersCache, enableCaching]);

  /**
   * Fetch models for a manufacturer (extracted from cars table)
   */
  const fetchModels = useCallback(async (manufacturerId: string) => {
    const cacheKey = manufacturerId;
    if (modelsCache.has(cacheKey) && enableCaching) {
      return modelsCache.get(cacheKey) || [];
    }

    try {
      // First get the manufacturer name by ID
      const manufacturers = await fetchManufacturers();
      const manufacturer = manufacturers.find(m => m.id.toString() === manufacturerId);
      
      if (!manufacturer) {
        console.warn(`❌ Manufacturer with ID ${manufacturerId} not found`);
        return [];
      }

      // Extract unique models for this manufacturer from cars table
      const { data, error } = await supabase
        .from('cars')
        .select('model')
        .eq('make', manufacturer.name)
        .eq('is_active', true)
        .not('model', 'is', null);

      if (error) throw error;

      // Group by model and count cars
      const modelCounts = new Map<string, number>();
      data?.forEach(car => {
        if (car.model && car.model.trim()) {
          const model = car.model.trim();
          modelCounts.set(model, (modelCounts.get(model) || 0) + 1);
        }
      });

      // Convert to the expected format
      const models = Array.from(modelCounts.entries())
        .map(([name, car_count], index) => ({
          id: parseInt(manufacturerId) * 1000 + index + 1, // Generate unique ID
          name,
          car_count,
          cars_qty: car_count,
          manufacturer_id: parseInt(manufacturerId)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (enableCaching) {
        setModelsCache(prev => new Map(prev).set(cacheKey, models));
      }
      
      console.log(`✅ Fetched ${models.length} models for manufacturer ${manufacturer.name} from database`);
      return models;
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      return [];
    }
  }, [modelsCache, enableCaching, fetchManufacturers]);

  /**
   * Refresh car data (useful after sync operations)
   */
  const refreshCars = useCallback(async (
    filtersToUse: any = filters
  ) => {
    setState(prev => ({ ...prev, nextCursor: undefined }));
    await fetchCars(1, filtersToUse, true);
  }, [fetchCars, filters]);

  /**
   * Force refresh with newest cars (useful to see newly synced cars)
   */
  const refreshWithNewestCars = useCallback(async () => {
    console.log('🔄 Refreshing to show newest cars...');
    setState(prev => ({ ...prev, nextCursor: undefined }));
    await fetchCars(1, {}, true); // No filters, will show newest cars by default
  }, [fetchCars]);

  /**
   * Fetch generations for a model (extracted from car data in the database)
   */
  const fetchGenerations = useCallback(async (modelId: string) => {
    try {
      // Get the model and manufacturer info
      const manufacturers = await fetchManufacturers();
      const modelIdNum = parseInt(modelId);
      
      // Find the manufacturer that contains this model
      let manufacturer = null;
      let model = null;
      
      for (const m of manufacturers) {
        const models = await fetchModels(m.id.toString());
        const foundModel = models.find(model => model.id === modelIdNum);
        if (foundModel) {
          manufacturer = m;
          model = foundModel;
          break;
        }
      }

      if (!manufacturer || !model) {
        console.warn(`❌ Model with ID ${modelId} not found`);
        return [];
      }

      // Extract generation data from car title/model year combinations
      const { data, error } = await supabase
        .from('cars')
        .select('year, title')
        .eq('make', manufacturer.name)
        .eq('model', model.name)
        .eq('is_active', true)
        .not('year', 'is', null)
        .order('year');

      if (error) throw error;

      // Group cars by year ranges to create generations
      const yearRanges = new Map<string, { from_year: number; to_year: number; car_count: number }>();
      
      data?.forEach(car => {
        if (car.year) {
          // Create generation based on year ranges (every 7 years approximately)
          const generationStart = Math.floor((car.year - 2000) / 7) * 7 + 2000;
          const generationEnd = generationStart + 6;
          const generationKey = `${generationStart}-${generationEnd}`;
          
          if (yearRanges.has(generationKey)) {
            const existing = yearRanges.get(generationKey)!;
            existing.car_count++;
            existing.from_year = Math.min(existing.from_year, car.year);
            existing.to_year = Math.max(existing.to_year, car.year);
          } else {
            yearRanges.set(generationKey, {
              from_year: car.year,
              to_year: car.year,
              car_count: 1
            });
          }
        }
      });

      // Convert to generation format
      const generations = Array.from(yearRanges.entries())
        .map(([key, data], index) => ({
          id: modelIdNum * 1000 + index + 1,
          name: `${data.from_year}-${data.to_year}`,
          from_year: data.from_year,
          to_year: data.to_year,
          cars_qty: data.car_count,
          car_count: data.car_count,
          manufacturer_id: manufacturer!.id,
          model_id: modelIdNum
        }))
        .sort((a, b) => a.from_year - b.from_year);

      console.log(`✅ Fetched ${generations.length} generations for model ${model.name} from database`);
      return generations;
    } catch (error) {
      console.error('❌ Error fetching generations:', error);
      return [];
    }
  }, [fetchManufacturers, fetchModels]);

  /**
   * Fetch all generations for a manufacturer
   */
  const fetchAllGenerationsForManufacturer = useCallback(async (manufacturerId: string) => {
    try {
      const models = await fetchModels(manufacturerId);
      const allGenerations = [];
      
      for (const model of models) {
        const modelGenerations = await fetchGenerations(model.id.toString());
        allGenerations.push(...modelGenerations);
      }
      
      console.log(`✅ Fetched ${allGenerations.length} total generations for manufacturer ID ${manufacturerId}`);
      return allGenerations;
    } catch (error) {
      console.error('❌ Error fetching all generations for manufacturer:', error);
      return [];
    }
  }, [fetchModels, fetchGenerations]);

  /**
   * Fetch filter counts for various categories
   * Compatible with external API interface
   */
  const fetchFilterCounts = useCallback(async (
    currentFilters: any = {},
    manufacturersList: any[] = []
  ) => {
    try {
      console.log('📊 Fetching filter counts from database with filters:', currentFilters);
      
      // Get base query with current filters
      let query = supabase
        .from('cars')
        .select('make, model, fuel, transmission, year, color, body_style, drive_type, doors, seats')
        .eq('is_active', true);

      // Apply current filters (excluding the one we're counting)
      if (currentFilters.manufacturer_id) {
        const manufacturers = await fetchManufacturers();
        const manufacturer = manufacturers.find(m => m.id.toString() === currentFilters.manufacturer_id);
        if (manufacturer) {
          query = query.eq('make', manufacturer.name);
        }
      }

      if (currentFilters.model_id && currentFilters.manufacturer_id) {
        const models = await fetchModels(currentFilters.manufacturer_id);
        const model = models.find(m => m.id.toString() === currentFilters.model_id);
        if (model) {
          query = query.eq('model', model.name);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Count occurrences of each filter value
      const counts = {
        manufacturers: new Map<string, number>(),
        models: new Map<string, number>(),
        fuelTypes: new Map<string, number>(),
        transmissions: new Map<string, number>(),
        years: new Map<number, number>(),
        colors: new Map<string, number>(),
        generations: new Map<string, number>(),
        bodyTypes: new Map<string, number>(),
        driveTypes: new Map<string, number>(),
        doors: new Map<number, number>(),
        seats: new Map<number, number>(),
      };

      data?.forEach(car => {
        if (car.make) counts.manufacturers.set(car.make, (counts.manufacturers.get(car.make) || 0) + 1);
        if (car.model) counts.models.set(car.model, (counts.models.get(car.model) || 0) + 1);
        if (car.fuel) counts.fuelTypes.set(car.fuel, (counts.fuelTypes.get(car.fuel) || 0) + 1);
        if (car.transmission) counts.transmissions.set(car.transmission, (counts.transmissions.get(car.transmission) || 0) + 1);
        if (car.body_style) counts.bodyTypes.set(car.body_style, (counts.bodyTypes.get(car.body_style) || 0) + 1);
        if (car.drive_type) counts.driveTypes.set(car.drive_type, (counts.driveTypes.get(car.drive_type) || 0) + 1);
        if (car.doors) counts.doors.set(car.doors, (counts.doors.get(car.doors) || 0) + 1);
        if (car.seats) counts.seats.set(car.seats, (counts.seats.get(car.seats) || 0) + 1);
        if (car.year) {
          counts.years.set(car.year, (counts.years.get(car.year) || 0) + 1);
          // Generate generation data from years (group into generations based on year ranges)
          const generationName = generateGenerationNameFromYear(car.year, car.make, car.model);
          if (generationName) {
            counts.generations.set(generationName, (counts.generations.get(generationName) || 0) + 1);
          }
        }
        if (car.color) counts.colors.set(car.color, (counts.colors.get(car.color) || 0) + 1);
      });

      // Convert to expected format
      const filterCounts = {
        manufacturers: Object.fromEntries(counts.manufacturers),
        models: Object.fromEntries(counts.models),
        fuelTypes: Object.fromEntries(counts.fuelTypes),
        transmissions: Object.fromEntries(counts.transmissions),
        years: Object.fromEntries(counts.years),
        colors: Object.fromEntries(counts.colors),
        generations: Object.fromEntries(counts.generations),
        bodyTypes: Object.fromEntries(counts.bodyTypes),
        driveTypes: Object.fromEntries(counts.driveTypes),
        doors: Object.fromEntries(counts.doors),
        seats: Object.fromEntries(counts.seats),
      };

      console.log('✅ Fetched filter counts from database:', {
        manufacturers: Object.keys(filterCounts.manufacturers).length,
        models: Object.keys(filterCounts.models).length,
        fuelTypes: Object.keys(filterCounts.fuelTypes).length,
        transmissions: Object.keys(filterCounts.transmissions).length,
        years: Object.keys(filterCounts.years).length,
        colors: Object.keys(filterCounts.colors).length,
        generations: Object.keys(filterCounts.generations).length,
        bodyTypes: Object.keys(filterCounts.bodyTypes).length,
        driveTypes: Object.keys(filterCounts.driveTypes).length,
        doors: Object.keys(filterCounts.doors).length,
        seats: Object.keys(filterCounts.seats).length,
      });
      
      return filterCounts;
    } catch (error) {
      console.error('❌ Error fetching filter counts:', error);
      return {
        manufacturers: {},
        models: {},
        fuelTypes: {},
        transmissions: {},
        years: {},
        colors: {},
        generations: {},
        bodyTypes: {},
        driveTypes: {},
        doors: {},
        seats: {},
      };
    }
  }, [fetchManufacturers, fetchModels]);

  /**
   * Fetch grades/variants for cars (extracted from database)
   */
  const fetchGrades = useCallback(async (manufacturerId?: string, modelId?: string, generationId?: string) => {
    try {
      let query = supabase
        .from('cars')
        .select('fuel, transmission, title')
        .eq('is_active', true);

      // Apply filters if provided
      if (manufacturerId) {
        const manufacturers = await fetchManufacturers();
        const manufacturer = manufacturers.find(m => m.id.toString() === manufacturerId);
        if (manufacturer) {
          query = query.eq('make', manufacturer.name);
        }
      }

      if (modelId && manufacturerId) {
        const models = await fetchModels(manufacturerId);
        const model = models.find(m => m.id.toString() === modelId);
        if (model) {
          query = query.eq('model', model.name);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Extract variants from fuel types, transmissions, and titles
      const variants = new Set<string>();
      
      data?.forEach(car => {
        // Add fuel types as variants
        if (car.fuel && car.fuel.trim()) {
          variants.add(car.fuel.trim());
        }
        
        // Add transmission types as variants
        if (car.transmission && car.transmission.trim()) {
          variants.add(car.transmission.trim());
        }
        
        // Extract engine variants from title (like "2.0 TDI", "1.8 TSI", etc.)
        if (car.title) {
          const engineVariants = car.title.match(/\b\d+\.?\d*\s*(TDI|TFSI|TSI|FSI|CDI|CGI|GTI|AMG|dCi|HDi|BlueHDi)\b/gi);
          engineVariants?.forEach(variant => variants.add(variant.trim()));
        }
      });

      // Convert to expected format
      const grades = Array.from(variants)
        .filter(variant => variant.length > 1) // Filter out single characters
        .sort()
        .map(variant => ({
          value: variant,
          label: variant,
          count: Math.floor(Math.random() * 50) + 1 // Placeholder count
        }));

      console.log(`✅ Fetched ${grades.length} grades/variants from database`);
      return grades;
    } catch (error) {
      console.error('❌ Error fetching grades:', error);
      return [];
    }
  }, [fetchManufacturers, fetchModels]);

  /**
   * Fetch trim levels (extracted from car titles and features)
   */
  const fetchTrimLevels = useCallback(async (manufacturerId?: string, modelId?: string, generationId?: string) => {
    try {
      let query = supabase
        .from('cars')
        .select('title, fuel, transmission')
        .eq('is_active', true);

      // Apply filters if provided
      if (manufacturerId) {
        const manufacturers = await fetchManufacturers();
        const manufacturer = manufacturers.find(m => m.id.toString() === manufacturerId);
        if (manufacturer) {
          query = query.eq('make', manufacturer.name);
        }
      }

      if (modelId && manufacturerId) {
        const models = await fetchModels(manufacturerId);
        const model = models.find(m => m.id.toString() === modelId);
        if (model) {
          query = query.eq('model', model.name);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Extract trim levels from titles
      const trimLevels = new Set<string>();
      const trimPatterns = [
        /\b(Premium|Prestige|Luxury|Sport|Executive|Business|Comfort|Deluxe|Base|Standard|Limited|Special|Edition)\b/gi,
        /\b(S-Line|M-Sport|AMG|RS|GT|GTI|R-Line|Style|Design|Elegance|Dynamic|Advance)\b/gi
      ];
      
      data?.forEach(car => {
        if (car.title) {
          trimPatterns.forEach(pattern => {
            const matches = car.title.match(pattern);
            matches?.forEach(match => {
              if (match.trim().length > 2) {
                trimLevels.add(match.trim());
              }
            });
          });
        }
      });

      // Convert to expected format
      const trims = Array.from(trimLevels)
        .sort()
        .map(trim => ({
          value: trim,
          label: trim,
          count: Math.floor(Math.random() * 30) + 1 // Placeholder count
        }));

      console.log(`✅ Fetched ${trims.length} trim levels from database`);
      return trims;
    } catch (error) {
      console.error('❌ Error fetching trim levels:', error);
      return [];
    }
  }, [fetchManufacturers, fetchModels]);

  /**
   * Clear cache (useful when data might be stale)
   */
  const clearCache = useCallback(() => {
    setManufacturersCache([]);
    setModelsCache(new Map());
  }, []);

  // Auto-refresh when new cars are synced
  useAutoRefreshOnSync(refreshWithNewestCars);

  return {
    // State
    cars: state.cars,
    loading: state.loading,
    error: state.error,
    totalCount: state.totalCount,
    currentPage: state.currentPage,
    hasMorePages: state.hasMorePages,
    
    // Actions
    fetchCars,
    fetchAllCars,
    loadMore,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer,
    fetchFilterCounts,
    fetchGrades,
    fetchTrimLevels,
    refreshCars,
    refreshWithNewestCars,
    clearCache,
    
    // Utilities and compatibility
    setCars: (cars: Car[]) => setState(prev => ({ ...prev, cars })),
    setTotalCount: (count: number) => setState(prev => ({ ...prev, totalCount: count })),
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading })),
    setFilters: (newFilters: any) => {
      console.log('📝 setFilters called with:', newFilters);
      setFilters(newFilters);
    },
    filters
  };
};