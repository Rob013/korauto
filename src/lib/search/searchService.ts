import { supabase } from '@/integrations/supabase/client';
import { SearchRequest, SearchResponse, CarListItem, SearchFacets } from './types';
import { buildFilter, convertLegacyFilters } from './buildFilter';
import { z } from 'zod';

// Zod schema for search request validation
const SearchRequestSchema = z.object({
  q: z.string().optional(),
  filters: z.object({
    country: z.array(z.string()).optional(),
    make: z.array(z.string()).optional(),
    model: z.array(z.string()).optional(),
    trim: z.array(z.string()).optional(),
    year: z.object({
      min: z.number().int().min(1900).max(2030),
      max: z.number().int().min(1900).max(2030)
    }).optional(),
    price_eur: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional(),
    mileage_km: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional(),
    engine_cc: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional(),
    fuel: z.array(z.string()).optional(),
    transmission: z.array(z.string()).optional(),
    body: z.array(z.string()).optional(),
    drive: z.array(z.string()).optional(),
    owners: z.array(z.number().int().min(0)).optional(),
    accident: z.array(z.enum(["none", "minor", "accident"])).optional(),
    use_type: z.array(z.string()).optional(),
    exterior_color: z.array(z.string()).optional(),
    interior_color: z.array(z.string()).optional(),
    region: z.array(z.string()).optional(),
    seats: z.array(z.number().int().min(1).max(20)).optional(),
    options: z.array(z.string()).optional()
  }).optional(),
  sort: z.object({
    field: z.enum(["listed_at", "price_eur", "mileage_km", "year"]),
    dir: z.enum(["asc", "desc"])
  }).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(24)
});

// Cache for identical search requests
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Main search function that validates input and calls the appropriate backend
 */
export async function searchCars(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
  const startTime = Date.now();
  
  // Validate and coerce input with Zod
  const validatedRequest = SearchRequestSchema.parse(request);
  
  // Create cache key
  const cacheKey = JSON.stringify(validatedRequest);
  
  // Check cache first
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Use existing Supabase integration to search cars
    const result = await searchWithSupabase(validatedRequest, signal);
    
    // Add timing info
    result.took_ms = Date.now() - startTime;
    
    // Cache the result
    searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    // Clean up old cache entries
    cleanupCache();
    
    return result;
  } catch (error) {
    if (signal?.aborted) {
      throw new Error('Search request was aborted');
    }
    throw error;
  }
}

/**
 * Search using existing Supabase edge function
 */
async function searchWithSupabase(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
  // Convert new search filters to legacy format for existing API
  const legacyFilters = convertNewFiltersToLegacy(request);
  
  // Call existing secure-cars-api edge function
  const { data, error } = await supabase.functions.invoke('secure-cars-api', {
    body: {
      endpoint: 'cars',
      filters: {
        ...legacyFilters,
        page: request.page?.toString() || '1',
        per_page: request.pageSize?.toString() || '24',
        simple_paginate: '0'
      }
    }
  });

  if (error) {
    throw new Error(error.message || 'Search failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  // Transform response to new format
  const cars = data?.data || [];
  const total = data?.meta?.total || 0;
  
  // Convert cars to new format
  const hits: CarListItem[] = cars.map((car: any) => transformCarToListItem(car));
  
  // Generate facets based on current results and filters
  const facets = await generateFacets(hits, request.filters);
  
  return {
    hits,
    total,
    facets
  };
}

/**
 * Convert new search filters to legacy API format
 */
function convertNewFiltersToLegacy(request: SearchRequest): any {
  const legacyFilters: any = {};
  
  if (!request.filters) return legacyFilters;
  
  // Map make to manufacturer_id
  if (request.filters.make && request.filters.make.length > 0) {
    legacyFilters.manufacturer_id = request.filters.make[0]; // Take first for now
  }
  
  // Map model
  if (request.filters.model && request.filters.model.length > 0) {
    legacyFilters.model_id = request.filters.model[0];
  }
  
  // Map trim
  if (request.filters.trim && request.filters.trim.length > 0) {
    legacyFilters.grade_iaai = request.filters.trim[0];
  }
  
  // Map color
  if (request.filters.exterior_color && request.filters.exterior_color.length > 0) {
    legacyFilters.color = request.filters.exterior_color[0];
  }
  
  // Map fuel
  if (request.filters.fuel && request.filters.fuel.length > 0) {
    legacyFilters.fuel_type = request.filters.fuel[0];
  }
  
  // Map transmission  
  if (request.filters.transmission && request.filters.transmission.length > 0) {
    legacyFilters.transmission = request.filters.transmission[0];
  }
  
  // Map body
  if (request.filters.body && request.filters.body.length > 0) {
    legacyFilters.body_type = request.filters.body[0];
  }
  
  // Map year range
  if (request.filters.year) {
    if (request.filters.year.min) {
      legacyFilters.from_year = request.filters.year.min.toString();
    }
    if (request.filters.year.max) {
      legacyFilters.to_year = request.filters.year.max.toString();
    }
  }
  
  // Map price range
  if (request.filters.price_eur) {
    if (request.filters.price_eur.min) {
      legacyFilters.buy_now_price_from = request.filters.price_eur.min.toString();
    }
    if (request.filters.price_eur.max) {
      legacyFilters.buy_now_price_to = request.filters.price_eur.max.toString();
    }
  }
  
  // Map mileage range
  if (request.filters.mileage_km) {
    if (request.filters.mileage_km.min) {
      legacyFilters.odometer_from_km = request.filters.mileage_km.min.toString();
    }
    if (request.filters.mileage_km.max) {
      legacyFilters.odometer_to_km = request.filters.mileage_km.max.toString();
    }
  }
  
  // Map seats
  if (request.filters.seats && request.filters.seats.length > 0) {
    legacyFilters.seats_count = request.filters.seats[0].toString();
  }
  
  // Map search query
  if (request.q) {
    legacyFilters.search = request.q;
  }
  
  return legacyFilters;
}

/**
 * Transform legacy car format to new list item format
 */
function transformCarToListItem(car: any): CarListItem {
  const lot = car.lots?.[0];
  
  return {
    id: car.id || car.lot_number || '',
    make: car.manufacturer?.name || 'Unknown',
    model: car.model?.name || 'Unknown',
    trim: car.grade_iaai || lot?.grade_iaai,
    year: car.year || 0,
    price_eur: lot?.buy_now ? Math.round(lot.buy_now * 0.85) : undefined, // Rough USD to EUR conversion
    mileage_km: lot?.odometer?.km,
    engine_cc: car.engine?.cc || car.cylinders ? car.cylinders * 500 : undefined,
    fuel: car.fuel?.name,
    transmission: car.transmission?.name,
    body: car.body_type?.name,
    exterior_color: car.color?.name,
    interior_color: car.interior_color?.name,
    seats: car.seats_count,
    owners: car.owners_count,
    accident: car.accident_history ? 'accident' : 'none',
    use_type: car.use_type,
    listed_at: car.created_at || new Date().toISOString(),
    thumbnail: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
    vin: car.vin,
    lot_number: car.lot_number || lot?.lot
  };
}

/**
 * Generate facets based on current results and filters
 */
async function generateFacets(hits: CarListItem[], filters?: any): Promise<SearchFacets> {
  // For now, generate simple facets from the current result set
  // In a real implementation, this would query the backend for accurate counts
  
  const facets: SearchFacets = {};
  
  // Count occurrences of each facet value
  const countMap = new Map<string, Map<string, number>>();
  
  hits.forEach(car => {
    // Count makes
    if (car.make) {
      if (!countMap.has('make')) countMap.set('make', new Map());
      const makeMap = countMap.get('make')!;
      makeMap.set(car.make, (makeMap.get(car.make) || 0) + 1);
    }
    
    // Count models
    if (car.model) {
      if (!countMap.has('model')) countMap.set('model', new Map());
      const modelMap = countMap.get('model')!;
      modelMap.set(car.model, (modelMap.get(car.model) || 0) + 1);
    }
    
    // Count fuel types
    if (car.fuel) {
      if (!countMap.has('fuel')) countMap.set('fuel', new Map());
      const fuelMap = countMap.get('fuel')!;
      fuelMap.set(car.fuel, (fuelMap.get(car.fuel) || 0) + 1);
    }
    
    // Count transmissions
    if (car.transmission) {
      if (!countMap.has('transmission')) countMap.set('transmission', new Map());
      const transMap = countMap.get('transmission')!;
      transMap.set(car.transmission, (transMap.get(car.transmission) || 0) + 1);
    }
    
    // Count body types
    if (car.body) {
      if (!countMap.has('body')) countMap.set('body', new Map());
      const bodyMap = countMap.get('body')!;
      bodyMap.set(car.body, (bodyMap.get(car.body) || 0) + 1);
    }
    
    // Count colors
    if (car.exterior_color) {
      if (!countMap.has('exterior_color')) countMap.set('exterior_color', new Map());
      const colorMap = countMap.get('exterior_color')!;
      colorMap.set(car.exterior_color, (colorMap.get(car.exterior_color) || 0) + 1);
    }
  });
  
  // Convert to facet format
  countMap.forEach((valueMap, facetName) => {
    const facetValues = Array.from(valueMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    (facets as any)[facetName] = facetValues;
  });
  
  return facets;
}

/**
 * Clean up old cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  searchCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_TTL) {
      entriesToDelete.push(key);
    }
  });
  
  entriesToDelete.forEach(key => searchCache.delete(key));
}

/**
 * Get available facet values for dependent facets
 */
export async function getFacetValues(facetName: string, filters?: any): Promise<{ value: string; count: number }[]> {
  // This would typically query the backend for available facet values
  // For now, return empty array as placeholder
  return [];
}

/**
 * Clear the search cache
 */
export function clearSearchCache(): void {
  searchCache.clear();
}