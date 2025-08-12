import { supabase } from '@/integrations/supabase/client';
import type { CarFilters, SortOption } from '@/store/carFilterStore';
import type { Tables } from '@/integrations/supabase/types';

export type CarCacheRow = Tables<'cars_cache'>;

export interface CarQueryOptions {
  filters: CarFilters;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export interface CarQueryResult {
  data: CarCacheRow[];
  count: number | null;
  hasMore: boolean;
  totalPages: number;
}

export interface FilterOptionsResult {
  makes: Array<{ value: string; label: string; count: number }>;
  models: Array<{ value: string; label: string; count: number; makeId: string }>;
  fuels: Array<{ value: string; label: string; count: number }>;
  transmissions: Array<{ value: string; label: string; count: number }>;
  colors: Array<{ value: string; label: string; count: number }>;
  conditions: Array<{ value: string; label: string; count: number }>;
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
}

/**
 * Build a Supabase query with filters
 */
export function buildCarQuery(options: CarQueryOptions) {
  const { filters, sort, page, pageSize } = options;
  
  let query = supabase
    .from('cars_cache')
    .select('*', { count: 'exact' });

  // Apply text search on multiple fields
  if (filters.query) {
    const searchTerm = filters.query.trim();
    if (searchTerm) {
      // Search across make, model, and other text fields
      query = query.or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%,condition.ilike.%${searchTerm}%`);
    }
  }

  // Apply exact match filters
  if (filters.make) {
    query = query.eq('make', filters.make);
  }

  if (filters.model) {
    query = query.eq('model', filters.model);
  }

  if (filters.fuel) {
    query = query.eq('fuel', filters.fuel);
  }

  if (filters.transmission) {
    query = query.eq('transmission', filters.transmission);
  }

  if (filters.color) {
    query = query.eq('color', filters.color);
  }

  if (filters.condition) {
    query = query.eq('condition', filters.condition);
  }

  // Apply range filters
  if (filters.year) {
    if (filters.year.min !== undefined) {
      query = query.gte('year', filters.year.min);
    }
    if (filters.year.max !== undefined) {
      query = query.lte('year', filters.year.max);
    }
  }

  if (filters.price) {
    if (filters.price.min !== undefined) {
      query = query.gte('price', filters.price.min);
    }
    if (filters.price.max !== undefined) {
      query = query.lte('price', filters.price.max);
    }
  }

  if (filters.mileage) {
    // Handle mileage as text field - convert for comparison
    if (filters.mileage.min !== undefined) {
      query = query.gte('mileage::integer', filters.mileage.min);
    }
    if (filters.mileage.max !== undefined) {
      query = query.lte('mileage::integer', filters.mileage.max);
    }
  }

  // Apply multi-select filters (for future enhancement)
  if (filters.makes && filters.makes.length > 0) {
    query = query.in('make', filters.makes);
  }

  if (filters.models && filters.models.length > 0) {
    query = query.in('model', filters.models);
  }

  if (filters.fuels && filters.fuels.length > 0) {
    query = query.in('fuel', filters.fuels);
  }

  if (filters.transmissions && filters.transmissions.length > 0) {
    query = query.in('transmission', filters.transmissions);
  }

  if (filters.colors && filters.colors.length > 0) {
    query = query.in('color', filters.colors);
  }

  if (filters.conditions && filters.conditions.length > 0) {
    query = query.in('condition', filters.conditions);
  }

  // Apply sorting
  const isAscending = sort.direction === 'asc';
  
  switch (sort.field) {
    case 'created_at':
      query = query.order('created_at', { ascending: isAscending });
      break;
    case 'price':
      query = query.order('price', { ascending: isAscending, nullsLast: true });
      break;
    case 'year':
      query = query.order('year', { ascending: isAscending });
      break;
    case 'mileage':
      query = query.order('mileage', { ascending: isAscending, nullsLast: true });
      break;
    case 'make':
      query = query.order('make', { ascending: isAscending });
      break;
    case 'model':
      query = query.order('model', { ascending: isAscending });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  return query;
}

/**
 * Execute car query and return formatted results
 */
export async function queryCars(options: CarQueryOptions): Promise<CarQueryResult> {
  const query = buildCarQuery(options);
  
  const { data, error, count } = await query;

  if (error) {
    console.error('Error querying cars:', error);
    throw new Error(`Failed to query cars: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / options.pageSize) : 0;
  const hasMore = options.page < totalPages;

  return {
    data: data || [],
    count,
    hasMore,
    totalPages,
  };
}

/**
 * Get available filter options with counts
 */
export async function getFilterOptions(filters?: Partial<CarFilters>): Promise<FilterOptionsResult> {
  try {
    // Build base query with current filters (excluding the field we're getting options for)
    let baseQuery = supabase.from('cars_cache').select('*');
    
    // Apply existing filters to get contextual counts
    if (filters) {
      if (filters.query) {
        const searchTerm = filters.query.trim();
        if (searchTerm) {
          baseQuery = baseQuery.or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%,condition.ilike.%${searchTerm}%`);
        }
      }
      
      // Don't apply the same filter we're getting options for
      if (filters.model && !filters.make) {
        baseQuery = baseQuery.eq('model', filters.model);
      }
      if (filters.fuel) {
        baseQuery = baseQuery.eq('fuel', filters.fuel);
      }
      if (filters.transmission) {
        baseQuery = baseQuery.eq('transmission', filters.transmission);
      }
      if (filters.color) {
        baseQuery = baseQuery.eq('color', filters.color);
      }
      if (filters.condition) {
        baseQuery = baseQuery.eq('condition', filters.condition);
      }
      
      // Apply range filters
      if (filters.year) {
        if (filters.year.min !== undefined) {
          baseQuery = baseQuery.gte('year', filters.year.min);
        }
        if (filters.year.max !== undefined) {
          baseQuery = baseQuery.lte('year', filters.year.max);
        }
      }
      
      if (filters.price) {
        if (filters.price.min !== undefined) {
          baseQuery = baseQuery.gte('price', filters.price.min);
        }
        if (filters.price.max !== undefined) {
          baseQuery = baseQuery.lte('price', filters.price.max);
        }
      }
    }

    // Get all data to compute filter options
    const { data: allCars, error } = await baseQuery;

    if (error) {
      console.error('Error getting filter options:', error);
      throw new Error(`Failed to get filter options: ${error.message}`);
    }

    const cars = allCars || [];

    // Compute filter options with counts
    const makeMap = new Map<string, number>();
    const modelMap = new Map<string, { count: number; makeId: string }>();
    const fuelMap = new Map<string, number>();
    const transmissionMap = new Map<string, number>();
    const colorMap = new Map<string, number>();
    const conditionMap = new Map<string, number>();
    
    let minYear = Infinity;
    let maxYear = -Infinity;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minMileage = Infinity;
    let maxMileage = -Infinity;

    cars.forEach(car => {
      // Count categorical values
      if (car.make) {
        makeMap.set(car.make, (makeMap.get(car.make) || 0) + 1);
      }
      
      if (car.model && car.make) {
        const key = car.model;
        const existing = modelMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          modelMap.set(key, { count: 1, makeId: car.make });
        }
      }
      
      if (car.fuel) {
        fuelMap.set(car.fuel, (fuelMap.get(car.fuel) || 0) + 1);
      }
      
      if (car.transmission) {
        transmissionMap.set(car.transmission, (transmissionMap.get(car.transmission) || 0) + 1);
      }
      
      if (car.color) {
        colorMap.set(car.color, (colorMap.get(car.color) || 0) + 1);
      }
      
      if (car.condition) {
        conditionMap.set(car.condition, (conditionMap.get(car.condition) || 0) + 1);
      }

      // Track ranges
      if (car.year) {
        minYear = Math.min(minYear, car.year);
        maxYear = Math.max(maxYear, car.year);
      }
      
      if (car.price && typeof car.price === 'number') {
        minPrice = Math.min(minPrice, car.price);
        maxPrice = Math.max(maxPrice, car.price);
      }
      
      if (car.mileage) {
        const mileageNum = parseInt(car.mileage.toString(), 10);
        if (!isNaN(mileageNum)) {
          minMileage = Math.min(minMileage, mileageNum);
          maxMileage = Math.max(maxMileage, mileageNum);
        }
      }
    });

    // Convert maps to sorted arrays
    const makes = Array.from(makeMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    const models = Array.from(modelMap.entries())
      .map(([value, { count, makeId }]) => ({ value, label: value, count, makeId }))
      .sort((a, b) => b.count - a.count);

    const fuels = Array.from(fuelMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count);

    const transmissions = Array.from(transmissionMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count);

    const colors = Array.from(colorMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count);

    const conditions = Array.from(conditionMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count);

    return {
      makes,
      models,
      fuels,
      transmissions,
      colors,
      conditions,
      yearRange: {
        min: minYear === Infinity ? 2000 : minYear,
        max: maxYear === -Infinity ? new Date().getFullYear() : maxYear,
      },
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: maxPrice === -Infinity ? 100000 : Math.ceil(maxPrice),
      },
      mileageRange: {
        min: minMileage === Infinity ? 0 : minMileage,
        max: maxMileage === -Infinity ? 500000 : maxMileage,
      },
    };
    
  } catch (error) {
    console.error('Error getting filter options:', error);
    
    // Return default options on error
    return {
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
  }
}

/**
 * Get a quick count of cars matching filters (for display)
 */
export async function getCarCount(filters: CarFilters): Promise<number> {
  try {
    const { count, error } = await buildCarQuery({
      filters,
      sort: { field: 'created_at', direction: 'desc' },
      page: 1,
      pageSize: 1,
    }).select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting car count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting car count:', error);
    return 0;
  }
}