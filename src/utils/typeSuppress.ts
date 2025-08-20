// Type suppression utilities for handling complex typing issues
// This file provides temporary type fixes during development

export const suppressCarDataType = (carData: any): Record<string, any> => {
  if (typeof carData === 'string') {
    try {
      return JSON.parse(carData);
    } catch {
      return { raw: carData };
    }
  }
  return carData || {};
};

export const suppressManufacturerImage = (manufacturer: any) => {
  return {
    ...manufacturer,
    image: manufacturer.image || undefined
  };
};

export const suppressStringType = (value: string | { name: string; }): string => {
  if (typeof value === 'string') {
    return value;
  }
  return value.name || '';
};

// Global type declaration for quick fixes
declare global {
  interface Window {
    // Add any window properties if needed
  }
}

// Model with cars_qty property
export interface ModelWithCount {
  id: number;
  name: string;
  manufacturer_id: number;
  cars_qty?: number;
}

// Car data with proper lot types
export interface CarWithLots {
  id: string;
  title?: string;
  lots?: Array<{ grade_iaai?: string; [key: string]: unknown }>;
  engine?: { name?: string };
  price?: number;
  [key: string]: unknown;
}

// Any-typed workaround for complex type issues
export const anyType = (value: any) => value as any;

// Generation ID type extension
export interface ExtendedAPIFilters {
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