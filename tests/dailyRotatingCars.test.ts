import { describe, it, expect } from 'vitest';
import { useDailyRotatingCars } from '../src/hooks/useDailyRotatingCars';
import { renderHook } from '@testing-library/react';

// Mock cars data for testing
const mockCars = Array.from({ length: 100 }, (_, i) => ({
  id: `car-${i}`,
  manufacturer: { name: `Brand-${i % 10}` },
  model: { name: `Model-${i % 5}` },
  year: 2015 + (i % 8), // Years 2015-2022
  vin: `KMHJ381${String(i).padStart(7, '0')}ABC`, // Valid VIN format without 'test'
  lot_number: `LOT${String(i).padStart(6, '0')}`,
  title: `Brand-${i % 10} Model-${i % 5} ${2015 + (i % 8)}`,
  lots: [{
    buy_now: 15000 + (i * 1000), // Prices from 15,000 to 114,000
    images: {
      normal: [`image-${i}.jpg`],
      big: [`big-image-${i}.jpg`]
    }
  }]
}));

describe('Daily Rotating Cars', () => {
  it('should return same cars for same day (consistent daily rotation)', () => {
    const { result: result1 } = renderHook(() => 
      useDailyRotatingCars(mockCars, false, 50)
    );
    
    const { result: result2 } = renderHook(() => 
      useDailyRotatingCars(mockCars, false, 50)
    );
    
    // Both should return same cars since it's the same day
    expect(result1.current).toEqual(result2.current);
    expect(result1.current.length).toBe(50);
  });

  it('should return all cars when filters are applied', () => {
    const { result } = renderHook(() => 
      useDailyRotatingCars(mockCars, true, 50)
    );
    
    // When hasFilters is true, should return original cars
    expect(result.current).toEqual(mockCars);
  });

  it('should limit cars to specified amount', () => {
    const { result } = renderHook(() => 
      useDailyRotatingCars(mockCars, false, 25)
    );
    
    console.log('Mock cars sample:', mockCars.slice(0, 2));
    console.log('Result:', result.current);
    console.log('Result length:', result.current.length);
    
    expect(result.current.length).toBe(25);
  });

  it('should filter out cars without manufacturer or images', () => {
    const carsWithSomeInvalid = [
      ...mockCars.slice(0, 10),
      { id: 'invalid-1', manufacturer: null, lots: [{ images: { normal: ['img.jpg'] } }] },
      { id: 'invalid-2', manufacturer: { name: 'Brand' }, lots: [{ images: { normal: [] } }] },
      { id: 'invalid-3', manufacturer: { name: 'Brand' }, lots: [] },
    ];

    const { result } = renderHook(() => 
      useDailyRotatingCars(carsWithSomeInvalid, false, 50)
    );
    
    // Should only include the valid 10 cars
    expect(result.current.length).toBe(10);
    expect(result.current.every(car => car.manufacturer?.name && car.lots?.[0]?.images?.normal?.[0])).toBe(true);
  });
});