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
}

export interface Lot {
  id: number;
  grade_iaai?: string;
  [key: string]: unknown;
}

export interface Car {
  id: string;
  title?: string;
  lots?: Lot[];
  engine?: { name?: string };
  price?: number;
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

// API Filters interface with all supported properties
export interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
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
  max_accidents?: string;
  per_page?: string;
}