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
  manufacturer_id?: number;
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
  car_data: Record<string, any> | string | any;
  price: number;
  mileage: string;
  color: string;
  fuel: string;
  transmission: string;
}

export interface APIFilters {
  [key: string]: any;
  max_accidents?: number;
  generation_id?: string;
}