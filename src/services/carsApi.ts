// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

export interface CarFilters {
  make?: string;
  model?: string;
  yearMin?: string;
  yearMax?: string;
  priceMin?: string;
  priceMax?: string;
  mileageMax?: string;
  fuel?: string;
  gearbox?: string;
  drivetrain?: string;
  city?: string;
  search?: string;
  q?: string;
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
  page?: number;
  pageSize?: number;
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

// New backend-only response format matching requirements
export interface CarsApiResponse {
  items: Car[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  facets: {
    makes: Array<{ value: string; count: number }>;
    models: Array<{ value: string; count: number }>;
    fuels: Array<{ value: string; count: number }>;
    year_range: { min: number; max: number };
    price_range: { min: number; max: number };
  };
}

// BACKEND-ONLY ARCHITECTURE - NO CLIENT-SIDE SORTING
// Map frontend sort options to backend sort options
export function mapFrontendSortToBackend(sort: SortOption | FrontendSortOption): SortOption {
  // If it's already a backend sort option, return as-is
  if (['price_asc', 'price_desc', 'rank_asc', 'rank_desc', 'year_asc', 'year_desc', 
       'mileage_asc', 'mileage_desc', 'make_asc', 'make_desc', 'created_asc', 'created_desc'].includes(sort as SortOption)) {
    return sort as SortOption;
  }

  // Map frontend options to backend options - ALL SORTING HAPPENS IN BACKEND
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
      return { field: 'mileage_km', direction: 'ASC' };
    case 'mileage_desc':
      return { field: 'mileage_km', direction: 'DESC' };
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

// Backend-only API call using new pagination format
export async function fetchCarsApi(searchParams: URLSearchParams): Promise<CarsApiResponse> {
  const baseUrl = `https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api`;
  const url = new URL(baseUrl);
  
  // Copy all search params to maintain filters and sort in URL
  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  console.log('🔄 Fetching cars from backend-only API:', url.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API Error ${response.status}: ${errorData.error || 'Failed to fetch cars'}`);
  }

  const data = await response.json();
  
  console.log('✅ Received cars data:', {
    items: data.items?.length || 0,
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
    facets: Object.keys(data.facets || {}).length
  });

  return data;
}

// Individual car API call
export async function fetchCarById(carId: string): Promise<Car> {
  const baseUrl = `https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api/${carId}`;

  console.log('🔍 Fetching individual car:', carId);

  const response = await fetch(baseUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API Error ${response.status}: ${errorData.error || 'Car not found'}`);
  }

  const data = await response.json();
  
  console.log('✅ Received individual car data:', carId);

  return data;
}

// Main API function for backend-only architecture
export async function fetchCarsWithPagination(params: CarsApiParams): Promise<CarsApiResponse> {
  const {
    filters = {},
    sort = 'price_asc',
    page = 1,
    pageSize = 24
  } = params;

  // Build URL params for backend-only API
  const searchParams = new URLSearchParams();
  
  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  // Add pagination and sort - ALL HANDLED BY BACKEND
  searchParams.append('sort', mapFrontendSortToBackend(sort));
  searchParams.append('page', String(page));
  searchParams.append('pageSize', String(pageSize));

  return fetchCarsApi(searchParams);
}

// Legacy compatibility function (DEPRECATED - use fetchCarsWithPagination)
export async function fetchCarsWithKeyset(params: CarsApiParams): Promise<CarsApiResponse> {
  console.warn('⚠️ fetchCarsWithKeyset is deprecated. Use fetchCarsWithPagination for backend-only architecture.');
  
  // Convert old keyset params to new pagination params
  const paginationParams: CarsApiParams = {
    filters: params.filters,
    sort: params.sort,
    page: 1, // Default to first page
    pageSize: params.limit || 24
  };

  const result = await fetchCarsWithPagination(paginationParams);
  
  // Convert new format back to legacy format for backward compatibility
  return {
    ...result,
    nextCursor: result.hasNext ? 'has-next' : undefined // Simplified cursor for compatibility
  };
}