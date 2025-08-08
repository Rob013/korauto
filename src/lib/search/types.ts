// Shared types for search functionality

export interface SearchFilters {
  // Basic filters
  country?: string[];
  make?: string[];
  model?: string[];
  trim?: string[];
  
  // Numeric range filters  
  year?: { min: number; max: number };
  price_eur?: { min: number; max: number };
  mileage_km?: { min: number; max: number };
  engine_cc?: { min: number; max: number };
  
  // Categorical filters
  fuel?: string[];
  transmission?: string[];
  body?: string[];
  drive?: string[];
  owners?: number[];
  accident?: ("none" | "minor" | "accident")[];
  use_type?: string[];
  exterior_color?: string[];
  interior_color?: string[];
  region?: string[];
  seats?: number[];
  options?: string[];
}

export interface SearchSort {
  field: "listed_at" | "price_eur" | "mileage_km" | "year";
  dir: "asc" | "desc";
}

export interface SearchRequest {
  q?: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
}

export interface SearchFacet {
  value: string;
  count: number;
  selected?: boolean;
}

export interface SearchFacets {
  country?: SearchFacet[];
  make?: SearchFacet[];
  model?: SearchFacet[];
  trim?: SearchFacet[];
  fuel?: SearchFacet[];
  transmission?: SearchFacet[];
  body?: SearchFacet[];
  drive?: SearchFacet[];
  accident?: SearchFacet[];
  use_type?: SearchFacet[];
  exterior_color?: SearchFacet[];
  interior_color?: SearchFacet[];
  region?: SearchFacet[];
  seats?: SearchFacet[];
  owners?: SearchFacet[];
  options?: SearchFacet[];
}

export interface CarListItem {
  id: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  price_eur?: number;
  mileage_km?: number;
  engine_cc?: number;
  fuel?: string;
  transmission?: string;
  body?: string;
  drive?: string;
  exterior_color?: string;
  interior_color?: string;
  region?: string;
  seats?: number;
  owners?: number;
  accident?: "none" | "minor" | "accident";
  use_type?: string;
  listed_at: string;
  thumbnail?: string;
  vin?: string;
  lot_number?: string;
}

export interface SearchResponse {
  hits: CarListItem[];
  total: number;
  facets: SearchFacets;
  took_ms?: number;
}

// Map existing API types to our new search types
export interface LegacyAPIFilters {
  manufacturer_id?: string;
  model_id?: string;
  grade_iaai?: string;
  trim_level?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
  seats_count?: string;
}