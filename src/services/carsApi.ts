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
}

export interface Car {
  id: string;
  external_id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  price_cents: number;
  rank_score: number;
  mileage?: number;
  
  // Basic car info
  title?: string;
  vin?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
  condition?: string;
  location?: string;
  
  // Auction/Sale info
  lot_number?: string;
  current_bid?: number;
  buy_now_price?: number;
  final_bid?: number;
  sale_date?: string;
  
  // Images and media
  image_url?: string;
  images?: any;
  
  // Source tracking
  source_api?: string;
  domain_name?: string;
  
  // Status and metadata
  status?: string;
  is_live?: boolean;
  keys_available?: boolean;
  is_active?: boolean;
  is_archived?: boolean;
  
  // Hash for change detection
  data_hash?: string;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
  last_synced_at?: string;
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
    cursor
  } = params;

  // Parse sort parameters
  const { field: sortField, direction: sortDir } = getSortParams(sort);
  
  // Parse cursor
  const cursorData = cursor ? parseCursor(cursor) : null;
  
  // Prepare filters for RPC call
  const rpcFilters = { ...filters };

  try {
    // First try the RPC function for normal operation
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

    let items = cars || [];
    
    // Enhance the data by fetching from cars_cache to get complete information
    // This provides the "all possible infos same as external api" functionality
    if (items.length > 0) {
      console.log('🔄 Enhancing car data from cars_cache for complete API information...');
      
      // Get the IDs from the RPC result (which handles sorting and pagination correctly)
      const carIds = items.map(car => car.id);
      
      // Fetch complete car data from cars_cache
      const { data: enhancedCars, error: enhancedError } = await supabase
        .from('cars_cache')
        .select('*')
        .in('id', carIds);
      
      if (!enhancedError && enhancedCars) {
        // Map the enhanced data back to the original order
        const enhancedCarMap = new Map(enhancedCars.map(car => [car.id, car]));
        
        items = items.map(originalCar => {
          const enhancedCar = enhancedCarMap.get(originalCar.id);
          if (enhancedCar) {
            // Merge RPC result with enhanced data, preserving sorting fields
            return {
              ...enhancedCar,
              // Preserve computed fields from RPC
              price_cents: originalCar.price_cents,
              rank_score: originalCar.rank_score,
              // Convert cars_cache format to expected API format
              external_id: enhancedCar.api_id,
              vin: enhancedCar.vin || '',
              condition: enhancedCar.condition || '',
              lot_number: enhancedCar.lot_number || '',
              // Extract additional data from car_data JSONB field
              current_bid: enhancedCar.car_data?.lots?.[0]?.bid || 0,
              buy_now_price: enhancedCar.car_data?.lots?.[0]?.buy_now || enhancedCar.price,
              final_bid: enhancedCar.car_data?.lots?.[0]?.final_price || 0,
              sale_date: enhancedCar.car_data?.lots?.[0]?.sale_date || null,
              is_live: enhancedCar.car_data?.lots?.[0]?.status === 'active' || false,
              keys_available: enhancedCar.car_data?.lots?.[0]?.keys_available !== false,
              status: enhancedCar.car_data?.lots?.[0]?.status || 'active',
              source_api: 'cars_cache',
              domain_name: enhancedCar.car_data?.lots?.[0]?.domain?.name || 'korauto',
              is_active: true,
              is_archived: false,
              data_hash: null,
              updated_at: enhancedCar.updated_at,
              last_synced_at: enhancedCar.last_api_sync
            };
          }
          return originalCar;
        });
        
        console.log(`✅ Enhanced ${items.length} cars with complete data from cars_cache`);
      } else {
        console.log('⚠️ Could not enhance data from cars_cache, using basic RPC data');
      }
    }
    
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

  const sort = (searchParams.get('sort') as SortOption | FrontendSortOption) || 'price_asc';
  const limit = parseInt(searchParams.get('limit') || '24');
  const cursor = searchParams.get('cursor') || undefined;

  return fetchCarsWithKeyset({ filters, sort, limit, cursor });
}