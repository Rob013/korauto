/**
 * Utility functions for consistent mileage formatting across the application
 */

/**
 * Formats a mileage number with thousands separators and km unit
 * @param mileage - The mileage value in kilometers (number or string)
 * @returns Formatted mileage string with thousands separators (e.g., "100,798 km")
 */
export const formatMileage = (mileage: number | string | null | undefined): string | undefined => {
  if (mileage == null) return undefined;
  
  const numericMileage = typeof mileage === 'string' ? parseFloat(mileage.replace(/[^\d]/g, '')) : mileage;
  
  if (isNaN(numericMileage) || numericMileage < 0) return undefined;
  
  return `${numericMileage.toLocaleString()} km`;
};

/**
 * Formats a mileage number with thousands separators (no unit)
 * @param mileage - The mileage value in kilometers
 * @returns Formatted mileage string with thousands separators (e.g., "100,798")
 */
export const formatMileageNumber = (mileage: number | string | null | undefined): string | undefined => {
  if (mileage == null) return undefined;
  
  const numericMileage = typeof mileage === 'string' ? parseFloat(mileage.replace(/[^\d]/g, '')) : mileage;
  
  if (isNaN(numericMileage) || numericMileage < 0) return undefined;
  
  return numericMileage.toLocaleString();
};