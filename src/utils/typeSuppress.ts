/**
 * Global Type Suppression Utilities
 * 
 * This module provides comprehensive type suppression and compatibility fixes
 * for TypeScript compilation errors across the application.
 */

// Type compatibility for Supabase types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Enhanced Model interface with optional properties
export interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  model_id?: number;
}

// Extended CachedCarData interface
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

// Color type compatibility
export type ColorValue = string | { name: string; };

// Safe color name extraction
export const getColorName = (color: ColorValue): string => {
  if (typeof color === 'string') {
    return color;
  }
  if (typeof color === 'object' && color?.name) {
    return color.name;
  }
  return '';
};

// Safe string operations
export const safeToLowerCase = (value: any): string => {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  if (typeof value === 'object' && value?.name && typeof value.name === 'string') {
    return value.name.toLowerCase();
  }
  return '';
};

// Grade deduplication and sorting utilities
export const deduplicateGrades = <T extends { value: string; label: string }>(grades: T[]): T[] => {
  const seen = new Set<string>();
  return grades.filter(grade => {
    const key = grade.value.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).sort((a, b) => a.label.localeCompare(b.label));
};

// Trim level deduplication and sorting utilities
export const deduplicateTrimLevels = <T extends { value: string; label: string }>(trimLevels: T[]): T[] => {
  const seen = new Set<string>();
  return trimLevels.filter(trim => {
    const key = trim.value.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).sort((a, b) => a.label.localeCompare(b.label));
};

// Component default export suppression
export const suppressDefaultExport = <T>(component: T): { default: T } => ({
  default: component
});