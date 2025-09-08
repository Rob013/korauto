export interface SearchReq {
  q?: string;
  filters?: {
    country?: string[];
    make?: string[];
    model?: string[];
    trim?: string[];
    fuel?: string[];
    transmission?: string[];
    body?: string[];
    drive?: string[];
    owners?: number[];
    accident?: ('none' | 'minor' | 'accident')[];
    use_type?: string[];
    exterior_color?: string[];
    interior_color?: string[];
    region?: string[];
    seats?: number[];
    options?: string[];
    year?: { min: number; max: number };
    price_eur?: { min: number; max: number };
    mileage_km?: { min: number; max: number };
    engine_cc?: { min: number; max: number };
  };
  sort?: {
    field: 'listed_at' | 'price_eur' | 'mileage_km' | 'year';
    dir: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
  mode?: 'full' | 'results' | 'facets';
  facets?: string[]; // which facets to compute when mode='facets'
}

export interface SearchRes {
  hits?: CarListing[];
  total?: number;
  facets?: FacetCounts;
}

export interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number;
  price_eur: number;
  mileage_km: number;
  thumbnail: string;
  listed_at: string;
}

export interface FacetCounts {
  [facetName: string]: {
    [value: string]: number;
  };
}

export interface SortOption {
  field: 'listed_at' | 'price_eur' | 'mileage_km' | 'year';
  dir: 'asc' | 'desc';
  label: string;
}

export interface FilterState {
  filters: SearchReq['filters'];
  sort: SearchReq['sort'];
  page: number;
  pageSize: number;
}

export const LISTING_FIELDS = [
  'id',
  'make', 
  'model',
  'year',
  'price_eur',
  'mileage_km',
  'thumbnail',
  'listed_at'
] as const;

export const DEFAULT_SORT: SearchReq['sort'] = {
  field: 'listed_at',
  dir: 'desc'
};

export const DEFAULT_PAGE_SIZE = 500;

export const FACET_FIELDS = [
  'model',
  'trim', 
  'fuel',
  'transmission',
  'body',
  'drive',
  'region'
] as const;