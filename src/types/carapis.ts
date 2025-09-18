// Enhanced types for CarAPIs.com integration

export interface CarAPIsEngine {
  id: number;
  name: string;
  size?: string;
  cylinders?: number;
  horsepower?: number;
  torque?: number;
  displacement?: string;
  configuration?: string;
  aspiration?: string;
}

export interface CarAPIsTransmission {
  name: string;
  id: number;
  type?: 'automatic' | 'manual' | 'cvt' | 'semi-automatic';
  speeds?: number;
}

export interface CarAPIsColor {
  name: string;
  id: number;
  hex_code?: string;
  type?: 'metallic' | 'solid' | 'pearl';
}

export interface CarAPIsManufacturer {
  id: number;
  name: string;
  country?: string;
  logo_url?: string;
  established_year?: number;
}

export interface CarAPIsModel {
  id: number;
  name: string;
  manufacturer_id?: number;
  body_types?: string[];
  years_available?: number[];
  segment?: string;
}

export interface CarAPIsGeneration {
  id: number;
  name: string;
  manufacturer_id: number;
  model_id: number;
  year_start?: number;
  year_end?: number;
}

export interface CarAPIsLocation {
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CarAPIsOdometer {
  km?: number;
  mi?: number;
  status?: {
    name: string;
    id: number;
  };
}

export interface CarAPIsDamage {
  main?: string;
  second?: string;
  severity?: 'minor' | 'moderate' | 'major' | 'severe';
  description?: string;
}

export interface CarAPIsCondition {
  name: string;
  id: number;
  description?: string;
  score?: number;
}

export interface CarAPIsStatus {
  name: string;
  id: number;
  description?: string;
}

export interface CarAPIsImages {
  id: number;
  small?: string[];
  normal?: string[];
  big?: string[];
  exterior?: string[];
  interior?: string[];
  engine?: string[];
  damage?: string[];
}

export interface CarAPIsFuelEconomy {
  city?: number;
  highway?: number;
  combined?: number;
  units?: 'mpg' | 'l/100km';
}

export interface CarAPIsLot {
  id: string;
  lot?: string;
  domain?: {
    name: string;
    id: number;
  };
  external_id?: string;
  odometer?: CarAPIsOdometer;
  
  // Pricing
  estimate_repair_price?: number;
  pre_accident_price?: number;
  clean_wholesale_price?: number;
  actual_cash_value?: number;
  bid?: number;
  buy_now?: number;
  final_bid?: number;
  msrp?: number;
  book_value?: number;
  trade_in_value?: number;
  
  // Dates
  sale_date?: string;
  listing_date?: string;
  auction_date?: string;
  
  // Status and condition
  status?: CarAPIsStatus;
  condition?: CarAPIsCondition;
  grade_iaai?: string;
  
  // Seller information
  seller?: string;
  seller_type?: string;
  dealer_name?: string;
  dealer_rating?: number;
  
  // Title and documentation
  title?: string;
  detailed_title?: string;
  title_status?: 'clean' | 'salvage' | 'flood' | 'lemon' | 'rebuilt';
  
  // Damage and condition details
  damage?: CarAPIsDamage;
  keys_available?: boolean;
  airbags?: boolean;
  airbags_deployed?: boolean;
  
  // Media and documentation
  images?: CarAPIsImages;
  inspection_report?: any;
  
  // Features and equipment
  features?: string[];
  equipment?: string[];
  options?: string[];
  packages?: string[];
  
  // Specifications
  doors?: number;
  seats?: number;
  seating_configuration?: string;
  cargo_capacity?: number;
  towing_capacity?: number;
  curb_weight?: number;
  gross_weight?: number;
  
  // Performance and efficiency
  fuel_economy?: CarAPIsFuelEconomy;
  emissions?: {
    co2?: number;
    nox?: number;
    rating?: string;
  };
  performance?: {
    acceleration_0_60?: number;
    top_speed?: number;
    quarter_mile?: number;
  };
  
  // Safety and ratings
  safety_rating?: {
    overall?: number;
    frontal?: number;
    side?: number;
    rollover?: number;
    source?: 'NHTSA' | 'IIHS';
  };
  
  // History and records
  accident_history?: string;
  service_records?: string;
  maintenance_history?: any[];
  previous_owners?: number;
  rental_history?: boolean;
  fleet_history?: boolean;
  
  // Warranty and service
  warranty_info?: {
    basic?: string;
    powertrain?: string;
    remaining?: string;
    transferable?: boolean;
  };
  
  // Location
  location?: CarAPIsLocation;
}

export interface CarAPIsVehicle {
  id: string;
  year: number;
  title: string;
  vin?: string;
  
  // Basic vehicle information
  manufacturer: CarAPIsManufacturer;
  model: CarAPIsModel;
  generation?: CarAPIsGeneration;
  trim?: string;
  style?: string;
  
  // Physical characteristics
  body_type?: string;
  color?: CarAPIsColor;
  interior_color?: CarAPIsColor;
  
  // Drivetrain
  engine?: CarAPIsEngine;
  transmission?: CarAPIsTransmission;
  drive_wheel?: 'fwd' | 'rwd' | 'awd' | '4wd';
  
  // Vehicle classification
  vehicle_type?: {
    name: string;
    id: number;
  };
  fuel?: {
    name: string;
    id: number;
  };
  
  // Dimensions and capacity
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    wheelbase?: number;
  };
  
  // Market information
  market_segment?: string;
  luxury_level?: 'economy' | 'mid-range' | 'luxury' | 'super-luxury';
  
  // Lots/Listings
  lots: CarAPIsLot[];
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  source?: string;
  data_quality_score?: number;
}

export interface CarAPIsFilters {
  make?: string;
  model?: string;
  year_from?: string;
  year_to?: string;
  price_from?: string;
  price_to?: string;
  mileage_from?: string;
  mileage_to?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  color?: string;
  page?: string;
  limit?: string;
  search?: string;
  location?: string;
  condition?: string;
  damage_type?: string;
  title_status?: string;
  seller_type?: string;
}

export interface CarAPIsResponse {
  data: CarAPIsVehicle[];
  total: number;
  page: number;
  per_page: number;
  filters_applied?: CarAPIsFilters;
  search_metadata?: {
    query_time_ms: number;
    total_available: number;
    data_sources: string[];
  };
}

export interface CarAPIsMake {
  id: number;
  name: string;
  country?: string;
  logo_url?: string;
  models_count?: number;
  vehicles_count?: number;
}

export interface CarAPIsModelList {
  id: number;
  name: string;
  make_id: number;
  make_name: string;
  body_types: string[];
  years_available: number[];
  vehicles_count?: number;
}