// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

export interface CarFilters {
  make?: string;
  model?: string;
  yearMin?: string;
  yearMax?: string;
  priceMin?: string;
  priceMax?: string;
  fuel?: string;
  search?: string;
}

export type SortOption = 'price_asc' | 'price_desc' | 'rank_asc' | 'rank_desc' | 
  'year_asc' | 'year_desc' | 'mileage_asc' | 'mileage_desc' | 'make_asc' | 'make_desc' |
  'created_asc' | 'created_desc';

// Frontend sort option mapping to backend sort options
export type FrontendSortOption = 'recently_added' | 'oldest_first' | 'price_low' | 'price_high' | 
  'year_new' | 'year_old' | 'mileage_low' | 'mileage_high' | 'make_az' | 'make_za' | 'popular';

export interface CarsApiParams {
  filters?: CarFilters;
  sort?: SortOption | FrontendSortOption;
  limit?: number;
  cursor?: string;
  // New LIMIT/OFFSET parameters
  page?: number;
  pageSize?: number;
  useLimitOffset?: boolean; // Flag to use LIMIT/OFFSET instead of cursor
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  price_cents: number;
  rank_score: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  color?: string;
  location?: string;
  image_url?: string;
  images?: any;
  title?: string;
  created_at: string;
}

export interface CarsApiResponse {
  items: Car[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string; // Keep for backward compatibility
}

// Parse cursor string "value|id" 
function parseCursor(cursor: string): { value: string; id: string } | null {
  if (!cursor) return null;
  
  try {
    const decoded = atob(cursor);
    const [value, id] = decoded.split('|');
    if (!value || !id) return null;
    return { value, id };
  } catch {
    return null;
  }
}

// Create cursor string from last item
function createCursor(sortField: string, sortValue: any, id: string): string {
  const cursorValue = `${sortValue}|${id}`;
  return btoa(cursorValue);
}

// Map frontend sort options to backend sort options
export function mapFrontendSortToBackend(sort: SortOption | FrontendSortOption): SortOption {
  // If it's already a backend sort option, return as-is
  if (['price_asc', 'price_desc', 'rank_asc', 'rank_desc', 'year_asc', 'year_desc', 
       'mileage_asc', 'mileage_desc', 'make_asc', 'make_desc', 'created_asc', 'created_desc'].includes(sort as SortOption)) {
    return sort as SortOption;
  }

  // Map frontend options to backend options
  switch (sort as FrontendSortOption) {
    case 'price_low':
      return 'price_asc';
    case 'price_high':
      return 'price_desc';
    case 'year_new':
      return 'year_desc';
    case 'year_old':
      return 'year_asc';
    case 'mileage_low':
      return 'mileage_asc';
    case 'mileage_high':
      return 'mileage_desc';
    case 'make_az':
      return 'make_asc';
    case 'make_za':
      return 'make_desc';
    case 'recently_added':
      return 'created_desc';
    case 'oldest_first':
      return 'created_asc';
    case 'popular':
      return 'rank_desc';
    default:
      return 'price_asc';
  }
}

// Map sort option to database field and direction
export function getSortParams(sort: SortOption | FrontendSortOption): { field: string; direction: string } {
  const backendSort = mapFrontendSortToBackend(sort);
  
  switch (backendSort) {
    case 'price_asc':
      return { field: 'price_cents', direction: 'ASC' };
    case 'price_desc':
      return { field: 'price_cents', direction: 'DESC' };
    case 'rank_asc':
      return { field: 'rank_score', direction: 'ASC' };
    case 'rank_desc':
      return { field: 'rank_score', direction: 'DESC' };
    case 'year_asc':
      return { field: 'year', direction: 'ASC' };
    case 'year_desc':
      return { field: 'year', direction: 'DESC' };
    case 'mileage_asc':
      return { field: 'mileage', direction: 'ASC' };
    case 'mileage_desc':
      return { field: 'mileage', direction: 'DESC' };
    case 'make_asc':
      return { field: 'make', direction: 'ASC' };
    case 'make_desc':
      return { field: 'make', direction: 'DESC' };
    case 'created_asc':
      return { field: 'created_at', direction: 'ASC' };
    case 'created_desc':
      return { field: 'created_at', direction: 'DESC' };
    default:
      return { field: 'price_cents', direction: 'ASC' };
  }
}

export async function fetchCarsWithKeyset(params: CarsApiParams): Promise<CarsApiResponse> {
  const {
    filters = {},
    sort = 'price_asc',
    limit = 24,
    cursor,
    page = 1,
    pageSize = 24,
    useLimitOffset = false
  } = params;

  // Use LIMIT/OFFSET pagination if requested, otherwise use cursor-based
  if (useLimitOffset) {
    return fetchCarsWithLimitOffset({
      filters,
      sort,
      page,
      pageSize
    });
  }

  // Parse sort parameters
  const { field: sortField, direction: sortDir } = getSortParams(sort);
  
  // Parse cursor
  const cursorData = cursor ? parseCursor(cursor) : null;
  
  // Prepare filters for RPC call
  const rpcFilters = { ...filters };

  try {
    // Get total count (for pagination info)
    const { data: totalCount, error: countError } = await supabase
      .rpc('cars_filtered_count', { p_filters: rpcFilters });

    if (countError) {
      console.error('Error getting car count:', countError);
      throw countError;
    }

    // Get paginated results using keyset pagination
    const { data: cars, error: carsError } = await supabase
      .rpc('cars_keyset_page', {
        p_filters: rpcFilters,
        p_sort_field: sortField,
        p_sort_dir: sortDir,
        p_cursor_value: cursorData?.value || null,
        p_cursor_id: cursorData?.id || null,
        p_limit: limit
      });

    if (carsError) {
      console.error('Error fetching cars:', carsError);
      throw carsError;
    }

    const items = cars || [];
    
    // Create next cursor if we have a full page (indicating more data)
    let nextCursor: string | undefined;
    if (items.length === limit) {
      const lastItem = items[items.length - 1];
      let sortValue;
      
      // Get the appropriate sort value based on the sort field
      switch (sortField) {
        case 'price_cents':
          sortValue = lastItem.price_cents;
          break;
        case 'rank_score':
          sortValue = lastItem.rank_score;
          break;
        case 'year':
          sortValue = lastItem.year;
          break;
        case 'mileage':
          sortValue = lastItem.mileage;
          break;
        case 'make':
          sortValue = lastItem.make;
          break;
        case 'created_at':
          sortValue = lastItem.created_at;
          break;
        default:
          sortValue = lastItem.price_cents;
      }
      
      nextCursor = createCursor(sortField, sortValue, lastItem.id);
    }

    // Calculate pagination info for cursor-based approach
    const estimatedPage = Math.floor((totalCount || 0) / limit) + 1;
    const hasNext = !!nextCursor;
    const hasPrev = !!cursorData; // If we have a cursor, we're not on the first page

    return {
      items,
      total: totalCount || 0,
      page: estimatedPage,
      pageSize: limit,
      hasNext,
      hasPrev,
      nextCursor
    };

  } catch (error) {
    console.error('Error in fetchCarsWithKeyset:', error);
    throw error;
  }
}

// New function for LIMIT/OFFSET pagination as requested in problem statement
export async function fetchCarsWithLimitOffset(params: {
  filters?: CarFilters;
  sort?: SortOption | FrontendSortOption;
  page?: number;
  pageSize?: number;
}): Promise<CarsApiResponse> {
  const {
    filters = {},
    sort = 'price_asc',
    page = 1,
    pageSize = 24
  } = params;

  // Parse sort parameters
  const { field: sortField, direction: sortDir } = getSortParams(sort);
  
  // Prepare filters for RPC call
  const rpcFilters = { ...filters };

  try {
    // Get total count (for pagination info)
    const { data: totalCount, error: countError } = await supabase
      .rpc('cars_filtered_count', { p_filters: rpcFilters });

    if (countError) {
      console.error('Error getting car count:', countError);
      throw countError;
    }

    // Get paginated results using LIMIT/OFFSET pagination
    const { data: cars, error: carsError } = await supabase
      .rpc('cars_limit_offset_page', {
        p_filters: rpcFilters,
        p_sort_field: sortField,
        p_sort_dir: sortDir,
        p_page: page,
        p_page_size: pageSize
      });

    if (carsError) {
      console.error('Error fetching cars:', carsError);
      throw carsError;
    }

    const items = cars || [];
    const total = totalCount || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    // Calculate pagination flags
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      items,
      total,
      page,
      pageSize,
      hasNext,
      hasPrev
    };

  } catch (error) {
    console.error('Error in fetchCarsWithLimitOffset:', error);
    throw error;
  }
}

// Compatibility function that matches the expected API format for GET /api/cars
export async function fetchCarsApi(searchParams: URLSearchParams): Promise<CarsApiResponse> {
  const filters: CarFilters = {};
  
  // Extract filters from URL search params
  if (searchParams.has('make')) filters.make = searchParams.get('make')!;
  if (searchParams.has('model')) filters.model = searchParams.get('model')!;
  if (searchParams.has('yearMin')) filters.yearMin = searchParams.get('yearMin')!;
  if (searchParams.has('yearMax')) filters.yearMax = searchParams.get('yearMax')!;
  if (searchParams.has('priceMin')) filters.priceMin = searchParams.get('priceMin')!;
  if (searchParams.has('priceMax')) filters.priceMax = searchParams.get('priceMax')!;
  if (searchParams.has('fuel')) filters.fuel = searchParams.get('fuel')!;
  if (searchParams.has('search')) filters.search = searchParams.get('search')!;

  const sort = (searchParams.get('sort') as SortOption | FrontendSortOption) || 'price_asc';
  const limit = parseInt(searchParams.get('limit') || '24');
  const cursor = searchParams.get('cursor') || undefined;
  
  // Support both pagination methods
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '24');
  const useLimitOffset = searchParams.has('page') || searchParams.get('useLimitOffset') === 'true';

  return fetchCarsWithKeyset({ 
    filters, 
    sort, 
    limit, 
    cursor, 
    page, 
    pageSize, 
    useLimitOffset 
  });
}