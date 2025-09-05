/**
 * Shared car types to avoid circular dependencies
 */

export interface LeanCar {
  id: string;
  price: number;
  year: number;
  mileage?: number;
  make: string;
  model: string;
  thumbnail?: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  images?: string[];
}

export type SortKey = 
  | 'price_asc' | 'price_desc'
  | 'year_asc' | 'year_desc'
  | 'mileage_asc' | 'mileage_desc'
  | 'make_asc' | 'make_desc'
  | 'model_asc' | 'model_desc';

export interface SortedResult {
  items: LeanCar[];
  total: number;
  sortKey: SortKey;
  duration: number;
}