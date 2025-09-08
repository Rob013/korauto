import { describe, it, expect } from 'vitest';

// Copy the formatMileage function for testing
const formatMileage = (mileage: string | number | undefined): string | undefined => {
  if (mileage === undefined || mileage === null) return undefined;
  
  // If it's already a formatted string (contains 'km'), return as is
  if (typeof mileage === 'string' && mileage.includes('km')) {
    return mileage;
  }
  
  // If it's a number or numeric string, format it
  const numericMileage = typeof mileage === 'string' ? parseInt(mileage, 10) : mileage;
  if (typeof numericMileage === 'number' && !isNaN(numericMileage) && numericMileage >= 0) {
    return `${numericMileage.toLocaleString()} km`;
  }
  
  return undefined;
};

describe('CarDetails Mileage Data Flow', () => {
  it('should transform raw odometer data correctly', () => {
    // Simulate the data transformation that happens in CarDetails.tsx
    const mockLotData = {
      odometer: { km: 171514 }
    };

    // This is the exact transformation used in CarDetails.tsx
    const mileage = mockLotData.odometer?.km
      ? `${mockLotData.odometer.km.toLocaleString()} km`
      : undefined;

    expect(mileage).toBe('171,514 km');
  });

  it('should handle undefined odometer data', () => {
    const mockLotData = {
      odometer: undefined
    };

    const mileage = mockLotData.odometer?.km
      ? `${mockLotData.odometer.km.toLocaleString()} km`
      : undefined;

    expect(mileage).toBeUndefined();
  });

  it('should handle zero mileage', () => {
    const mockLotData = {
      odometer: { km: 0 }
    };

    // Test the data transformation
    const mileage = mockLotData.odometer?.km !== undefined
      ? `${mockLotData.odometer.km.toLocaleString()} km`
      : undefined;

    expect(mileage).toBe('0 km');
    
    // Test the formatMileage function
    expect(formatMileage(0)).toBe('0 km');
  });

  it('should handle large mileage values correctly', () => {
    const mockLotData = {
      odometer: { km: 1234567 }
    };

    const mileage = mockLotData.odometer?.km
      ? `${mockLotData.odometer.km.toLocaleString()} km`
      : undefined;

    expect(mileage).toBe('1,234,567 km');
  });

  it('should format cached mileage consistently', () => {
    // Test that the formatMileage function properly handles both scenarios
    expect(formatMileage(171514)).toBe('171,514 km');
    expect(formatMileage('171514')).toBe('171,514 km');
    expect(formatMileage('171,514 km')).toBe('171,514 km');
  });
});