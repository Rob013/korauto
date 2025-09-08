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

describe('Mileage Formatting', () => {
  it('should format numbers with toLocaleString() correctly', () => {
    const testNumber = 171514;
    const formatted = testNumber.toLocaleString();
    
    // This should format the number with commas
    expect(formatted).toBe('171,514');
  });

  it('should format mileage with km unit correctly', () => {
    const testNumber = 171514;
    const mileage = `${testNumber.toLocaleString()} km`;
    
    expect(mileage).toBe('171,514 km');
  });

  it('should handle large mileage values correctly', () => {
    const largeMileage = 1234567;
    const formatted = `${largeMileage.toLocaleString()} km`;
    
    expect(formatted).toBe('1,234,567 km');
  });

  it('should handle zero and small values correctly', () => {
    expect((0).toLocaleString()).toBe('0');
    expect((123).toLocaleString()).toBe('123');
    expect((1234).toLocaleString()).toBe('1,234');
  });

  describe('formatMileage function', () => {
    it('should format raw numbers correctly', () => {
      expect(formatMileage(171514)).toBe('171,514 km');
      expect(formatMileage(1234567)).toBe('1,234,567 km');
      expect(formatMileage(0)).toBe('0 km');
      expect(formatMileage(123)).toBe('123 km');
    });

    it('should return already formatted strings as-is', () => {
      expect(formatMileage('171,514 km')).toBe('171,514 km');
      expect(formatMileage('0 km')).toBe('0 km');
    });

    it('should format numeric strings', () => {
      expect(formatMileage('171514')).toBe('171,514 km');
      expect(formatMileage('0')).toBe('0 km');
    });

    it('should handle undefined and invalid values', () => {
      expect(formatMileage(undefined)).toBeUndefined();
      expect(formatMileage(null as any)).toBeUndefined();
      expect(formatMileage(-1)).toBeUndefined();
      expect(formatMileage('invalid')).toBeUndefined();
    });
  });
});