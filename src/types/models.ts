export interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
  [key: string]: any; // Allow additional properties
}

export interface Generation {
  id: number;
  name: string;
  manufacturer_id?: number;
  model_id?: number;
  from_year?: number;
  to_year?: number;
  cars_qty?: number;
  image?: string;
}

export interface CachedCarData {
  api_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  lot_number: string;
  car_data: Record<string, any> | string; // Allow both types
  price: number;
  mileage: string;
  color: string;
  fuel: string;
  transmission: string;
}