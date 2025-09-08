import { describe, it, expect } from 'vitest';

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
});