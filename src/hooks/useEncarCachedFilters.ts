/**
 * useEncarCachedFilters Hook
 * 
 * Dynamically extracts filter metadata (manufacturers, models, etc.) 
 * from cached Encar cars for instant filter panel population
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { useCachedFilterOptions, useCachedRange } from './useCachedFilters';
import type { Manufacturer, Model } from './useSecureAuctionAPI';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
  image?: string;
}

interface EncarCachedFilters {
  manufacturers: Manufacturer[];
  models: Model[];
  fuelTypes: FilterOption[];
  transmissions: FilterOption[];
  bodyTypes: FilterOption[];
  colors: FilterOption[];
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to extract all filter options from cached Encar cars
 * Uses efficient Map-based extraction for instant performance
 */
export function useEncarCachedFilters(manufacturerId?: string): EncarCachedFilters {
  // Fetch all cached cars (only the fields we need for filters)
  const { data: cachedCars = [], isLoading, error } = useQuery({
    queryKey: ['encar-cached-filters', manufacturerId],
    queryFn: async () => {
      console.log('🔍 Extracting filter metadata from cache');
      
      let query = supabase
        .from('encar_cars_cache')
        .select(`
          manufacturer_id,
          manufacturer_name,
          model_id,
          model_name,
          fuel_type,
          transmission,
          body_type,
          color_name,
          form_year,
          buy_now_price,
          mileage,
          is_active
        `)
        .eq('is_active', true);

      // Filter by manufacturer if specified
      if (manufacturerId && manufacturerId !== 'all') {
        query = query.eq('manufacturer_id', Number(manufacturerId));
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching cached cars for filters:', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} cached cars for filter extraction`);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - filters don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract manufacturers with counts
  const manufacturers = useCachedFilterOptions({
    data: cachedCars,
    extractValue: (car) => car.manufacturer_id,
    extractCount: () => 1,
    sortFn: (a, b) => b.count - a.count, // Sort by count descending
  });

  // Map to Manufacturer type (with number IDs)
  const manufacturersWithNames: Manufacturer[] = useMemo(() => {
    const nameMap = new Map<number, string>();
    cachedCars.forEach(car => {
      if (car.manufacturer_id && car.manufacturer_name) {
        nameMap.set(car.manufacturer_id, car.manufacturer_name);
      }
    });

    return manufacturers.map(m => ({
      id: Number(m.value),
      name: nameMap.get(Number(m.value)) || m.value,
      car_count: m.count,
      cars_qty: m.count,
    }));
  }, [manufacturers, cachedCars]);

  // Extract models with counts (filtered by manufacturer if provided)
  const models = useCachedFilterOptions({
    data: cachedCars,
    extractValue: (car) => car.model_id,
    extractCount: () => 1,
    sortFn: (a, b) => b.count - a.count,
  });

  // Map to Model type (with number IDs)
  const modelsWithNames: Model[] = useMemo(() => {
    const nameMap = new Map<number, string>();
    const manufacturerMap = new Map<number, number>();
    
    cachedCars.forEach(car => {
      if (car.model_id && car.model_name) {
        nameMap.set(car.model_id, car.model_name);
        if (car.manufacturer_id) {
          manufacturerMap.set(car.model_id, car.manufacturer_id);
        }
      }
    });

    return models.map(m => ({
      id: Number(m.value),
      name: nameMap.get(Number(m.value)) || m.value,
      car_count: m.count,
      manufacturer_id: manufacturerMap.get(Number(m.value)),
    }));
  }, [models, cachedCars]);

  // Extract fuel types
  const fuelTypes = useCachedFilterOptions({
    data: cachedCars,
    extractValue: (car) => car.fuel_type,
    extractCount: () => 1,
  });

  const fuelTypesWithNames = useMemo(() => 
    fuelTypes.map(f => ({
      id: f.value,
      name: f.value,
      count: f.count,
    })),
    [fuelTypes]
  );

  // Extract transmissions
  const transmissions = useCachedFilterOptions({
    data: cachedCars,
    extractValue: (car) => car.transmission,
    extractCount: () => 1,
  });

  const transmissionsWithNames = useMemo(() => 
    transmissions.map(t => ({
      id: t.value,
      name: t.value,
      count: t.count,
    })),
    [transmissions]
  );

  // Extract body types
  const bodyTypes = useCachedFilterOptions({
    data: cachedCars,
    extractValue: (car) => car.body_type,
    extractCount: () => 1,
  });

  const bodyTypesWithNames = useMemo(() => 
    bodyTypes.map(b => ({
      id: b.value,
      name: b.value,
      count: b.count,
    })),
    [bodyTypes]
  );

  // Extract colors
  const colors = useCachedFilterOptions({
    data: cachedCars,
    extractValue: (car) => car.color_name,
    extractCount: () => 1,
  });

  const colorsWithNames = useMemo(() => 
    colors.map(c => ({
      id: c.value,
      name: c.value,
      count: c.count,
    })),
    [colors]
  );

  // Extract year range
  const yearRange = useCachedRange(
    cachedCars,
    (car) => car.form_year ? parseInt(car.form_year) : null
  );

  // Extract price range (convert KRW to EUR)
  const priceRange = useCachedRange(
    cachedCars,
    (car) => car.buy_now_price ? Math.round(car.buy_now_price / 1400) + 2500 : null
  );

  // Extract mileage range
  const mileageRange = useCachedRange(
    cachedCars,
    (car) => car.mileage
  );

  return {
    manufacturers: manufacturersWithNames,
    models: modelsWithNames,
    fuelTypes: fuelTypesWithNames,
    transmissions: transmissionsWithNames,
    bodyTypes: bodyTypesWithNames,
    colors: colorsWithNames,
    yearRange,
    priceRange,
    mileageRange,
    isLoading,
    error: error as Error | null,
  };
}
