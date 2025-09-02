export interface Manufacturer {
  id: number;
  name: string;
  cars_qty?: number;
  car_count?: number;
  image?: string;
}

export interface Model {
  id: number;
  name: string;
  manufacturer_id: number;
  cars_qty?: number;
  car_count?: number;
}

export interface Lot {
  id: number;
  grade_iaai?: string;
  [key: string]: unknown;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  price_cents?: number;
  mileage: string | number;
  fuel: string;
  transmission: string;
  color: string;
  images: string[] | any[];
  title?: string;
  created_at?: string;
  lot_number?: string;
  lots?: Lot[];
  engine?: { name?: string };
  manufacturer?: { name: string };
  location?: string;
  rank_score?: number;
  status?: string;
  image_url?: string;
  currency?: string;
  odometer?: number;
  [key: string]: unknown;
}

export interface CachedCarData {
  api_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  lot_number: string;
  car_data: Record<string, any>;
  price: number;
  mileage: string;
  color: string;
  fuel: string;
  transmission: string;
}