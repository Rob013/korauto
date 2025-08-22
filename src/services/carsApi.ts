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

export type SortOption = 'price_asc' | 'price_desc' | 'rank_asc' | 'rank_desc';

export interface CarsApiParams {
  filters?: CarFilters;
  sort?: SortOption;
  limit?: number;
  cursor?: string;
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
  nextCursor?: string;
  total: number;
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

// Map sort option to database field and direction
function getSortParams(sort: SortOption): { field: string; direction: string } {
  switch (sort) {
    case 'price_asc':
      return { field: 'price_cents', direction: 'ASC' };
    case 'price_desc':
      return { field: 'price_cents', direction: 'DESC' };
    case 'rank_asc':
      return { field: 'rank_score', direction: 'ASC' };
    case 'rank_desc':
      return { field: 'rank_score', direction: 'DESC' };
    default:
      return { field: 'price_cents', direction: 'ASC' };
  }
}

export async function fetchCarsWithKeyset(params: CarsApiParams): Promise<CarsApiResponse> {
  const {
    filters = {},
    sort = 'price_asc',
    limit = 24,
    cursor
  } = params;

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
      const sortValue = sortField === 'price_cents' ? lastItem.price_cents : lastItem.rank_score;
      nextCursor = createCursor(sortField, sortValue, lastItem.id);
    }

    return {
      items,
      nextCursor,
      total: totalCount || 0
    };

  } catch (error) {
    console.error('Error in fetchCarsWithKeyset:', error);
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

  const sort = (searchParams.get('sort') as SortOption) || 'price_asc';
  const limit = parseInt(searchParams.get('limit') || '24');
  const cursor = searchParams.get('cursor') || undefined;

  return fetchCarsWithKeyset({ filters, sort, limit, cursor });
}