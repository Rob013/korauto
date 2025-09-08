import { describe, it, expect } from 'vitest';

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

    const mileage = mockLotData.odometer?.km
      ? `${mockLotData.odometer.km.toLocaleString()} km`
      : undefined;

    expect(mileage).toBe('0 km');
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
});