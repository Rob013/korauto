import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  price_cents?: bigint | number;
  mileage: string;
  fuel: string;
  transmission: string;
  color: string;
  condition: string;
  images: any;
  vin?: string;
  lot_number?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  sale_status?: string;
  created_at?: string;
  [key: string]: any;
}

interface Filters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  fuel?: string;
  transmission?: string;
  color?: string;
  search?: string;
}

interface UseSupabaseCarsReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  fetchCars: (page?: number, filters?: Filters) => Promise<void>;
  setFilters: (filters: Filters) => void;
  filters: Filters;
  manufacturers: Array<{ id: string; name: string; count: number }>;
  models: Array<{ id: string; name: string; count: number }>;
  fuelTypes: string[];
  transmissions: string[];
  colors: string[];
}

const CARS_PER_PAGE = 50;

export const useSupabaseCars = (): UseSupabaseCarsReturn => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  const [manufacturers, setManufacturers] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [models, setModels] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [transmissions, setTransmissions] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      // Fetch manufacturers with counts
      const { data: makesData, error: makesError } = await supabase
        .from('cars_cache')
        .select('make')
        .not('sale_status', 'in', '(archived,sold)');

      if (makesError) throw makesError;

      // Count occurrences of each make
      const makeCounts: Record<string, number> = {};
      makesData?.forEach((item) => {
        if (item.make) {
          makeCounts[item.make] = (makeCounts[item.make] || 0) + 1;
        }
      });

      const uniqueMakes = Object.entries(makeCounts)
        .map(([name, count]) => ({ id: name, name, count }))
        .sort((a, b) => b.count - a.count);

      setManufacturers(uniqueMakes);

      // Fetch models with counts
      const { data: modelsData, error: modelsError } = await supabase
        .from('cars_cache')
        .select('model')
        .not('sale_status', 'in', '(archived,sold)');

      if (modelsError) throw modelsError;

      const modelCounts: Record<string, number> = {};
      modelsData?.forEach((item) => {
        if (item.model) {
          modelCounts[item.model] = (modelCounts[item.model] || 0) + 1;
        }
      });

      const uniqueModels = Object.entries(modelCounts)
        .map(([name, count]) => ({ id: name, name, count }))
        .sort((a, b) => b.count - a.count);

      setModels(uniqueModels);

      // Fetch fuel types
      const { data: fuelData, error: fuelError } = await supabase
        .from('cars_cache')
        .select('fuel')
        .not('sale_status', 'in', '(archived,sold)')
        .not('fuel', 'is', null);

      if (fuelError) throw fuelError;

      const uniqueFuels = [...new Set(fuelData?.map((item) => item.fuel).filter(Boolean))].sort();
      setFuelTypes(uniqueFuels);

      // Fetch transmissions
      const { data: transData, error: transError } = await supabase
        .from('cars_cache')
        .select('transmission')
        .not('sale_status', 'in', '(archived,sold)')
        .not('transmission', 'is', null);

      if (transError) throw transError;

      const uniqueTrans = [...new Set(transData?.map((item) => item.transmission).filter(Boolean))].sort();
      setTransmissions(uniqueTrans);

      // Fetch colors
      const { data: colorData, error: colorError } = await supabase
        .from('cars_cache')
        .select('color')
        .not('sale_status', 'in', '(archived,sold)')
        .not('color', 'is', null);

      if (colorError) throw colorError;

      const uniqueColors = [...new Set(colorData?.map((item) => item.color).filter(Boolean))].sort();
      setColors(uniqueColors);

    } catch (err: any) {
      console.error('❌ Error fetching filter options:', err);
    }
  }, []);

  // Fetch cars with filters and pagination
  const fetchCars = useCallback(async (page: number = 1, filterParams?: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const activeFilters = filterParams || filters;
      const from = (page - 1) * CARS_PER_PAGE;
      const to = from + CARS_PER_PAGE - 1;

      console.log(`🔄 Fetching cars from Supabase - Page ${page}, Range: ${from}-${to}`);

      // Build query
      let query = supabase
        .from('cars_cache')
        .select('*', { count: 'exact' })
        .not('sale_status', 'in', '(archived,sold)')
        .gt('price_cents', 0)
        .not('price_cents', 'is', null);

      // Apply filters
      if (activeFilters.make) {
        query = query.eq('make', activeFilters.make);
      }

      if (activeFilters.model) {
        query = query.eq('model', activeFilters.model);
      }

      if (activeFilters.yearMin) {
        query = query.gte('year', activeFilters.yearMin);
      }

      if (activeFilters.yearMax) {
        query = query.lte('year', activeFilters.yearMax);
      }

      if (activeFilters.priceMin) {
        query = query.gte('price_cents', activeFilters.priceMin * 100);
      }

      if (activeFilters.priceMax) {
        query = query.lte('price_cents', activeFilters.priceMax * 100);
      }

      if (activeFilters.fuel) {
        query = query.eq('fuel', activeFilters.fuel);
      }

      if (activeFilters.transmission) {
        query = query.eq('transmission', activeFilters.transmission);
      }

      if (activeFilters.color) {
        query = query.eq('color', activeFilters.color);
      }

      if (activeFilters.search) {
        query = query.or(`make.ilike.%${activeFilters.search}%,model.ilike.%${activeFilters.search}%`);
      }

      // Apply sorting and pagination
      const { data, error: queryError, count } = await query
        .order('price_cents', { ascending: true, nullsFirst: false })
        .range(from, to);

      if (queryError) throw queryError;

      setCars(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);

      console.log(`✅ Fetched ${data?.length || 0} cars (Total: ${count || 0})`);
    } catch (err: any) {
      console.error('❌ Error fetching cars:', err);
      setError(err.message || 'Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / CARS_PER_PAGE);
  }, [totalCount]);

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch initial cars
  useEffect(() => {
    fetchCars(1);
  }, []);

  return {
    cars,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    fetchCars,
    setFilters,
    filters,
    manufacturers,
    models,
    fuelTypes,
    transmissions,
    colors,
  };
};
