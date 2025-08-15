import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSortedCars, SortOption } from '../src/hooks/useSortedCars';

// Mock car data similar to the API structure
const createMockCar = (id: string, price: number, year: number, mileage: number, make: string) => ({
  id,
  manufacturer: { name: make },
  model: { name: 'Test Model' },
  year,
  lots: [{
    buy_now: price,
    odometer: { km: mileage },
    popularity_score: Math.random() * 100
  }]
});

describe('useSortedCars - Global Sorting Fix', () => {
  it('should sort cars by price_low correctly across large dataset', () => {
    // Create a dataset similar to the problem scenario (554 cars)
    const largeCarsDataset = [
      createMockCar('1', 30000, 2020, 50000, 'Mercedes-Benz'),
      createMockCar('2', 25000, 2019, 60000, 'Mercedes-Benz'),
      createMockCar('3', 35000, 2021, 40000, 'Mercedes-Benz'),
      createMockCar('4', 20000, 2018, 70000, 'Mercedes-Benz'),
      createMockCar('5', 40000, 2022, 30000, 'Mercedes-Benz'),
    ];

    const { result } = renderHook(() => useSortedCars(largeCarsDataset, 'price_low'));

    // Check that cars are sorted by price from lowest to highest
    expect(result.current[0].lots[0].buy_now).toBe(20000); // Car 4
    expect(result.current[1].lots[0].buy_now).toBe(25000); // Car 2  
    expect(result.current[2].lots[0].buy_now).toBe(30000); // Car 1
    expect(result.current[3].lots[0].buy_now).toBe(35000); // Car 3
    expect(result.current[4].lots[0].buy_now).toBe(40000); // Car 5
  });

  it('should sort cars by price_high correctly across large dataset', () => {
    const largeCarsDataset = [
      createMockCar('1', 30000, 2020, 50000, 'Mercedes-Benz'),
      createMockCar('2', 25000, 2019, 60000, 'Mercedes-Benz'),
      createMockCar('3', 35000, 2021, 40000, 'Mercedes-Benz'),
      createMockCar('4', 20000, 2018, 70000, 'Mercedes-Benz'),
      createMockCar('5', 40000, 2022, 30000, 'Mercedes-Benz'),
    ];

    const { result } = renderHook(() => useSortedCars(largeCarsDataset, 'price_high'));

    // Check that cars are sorted by price from highest to lowest
    expect(result.current[0].lots[0].buy_now).toBe(40000); // Car 5
    expect(result.current[1].lots[0].buy_now).toBe(35000); // Car 3
    expect(result.current[2].lots[0].buy_now).toBe(30000); // Car 1
    expect(result.current[3].lots[0].buy_now).toBe(25000); // Car 2
    expect(result.current[4].lots[0].buy_now).toBe(20000); // Car 4
  });

  it('should handle sorting when cars have missing price data', () => {
    const carsWithMissingData = [
      createMockCar('1', 30000, 2020, 50000, 'Mercedes-Benz'),
      { ...createMockCar('2', 0, 2019, 60000, 'Mercedes-Benz'), lots: [{}] }, // Missing price
      createMockCar('3', 35000, 2021, 40000, 'Mercedes-Benz'),
    ];

    const { result } = renderHook(() => useSortedCars(carsWithMissingData, 'price_low'));

    // Cars with missing price data should be filtered out, leaving only cars with real pricing
    expect(result.current).toHaveLength(2);
    expect(result.current[0].lots[0].buy_now).toBe(30000);
    expect(result.current[1].lots[0].buy_now).toBe(35000);
  });

  it('should sort by year correctly', () => {
    const carsDataset = [
      createMockCar('1', 30000, 2020, 50000, 'Mercedes-Benz'),
      createMockCar('2', 25000, 2022, 60000, 'Mercedes-Benz'),
      createMockCar('3', 35000, 2018, 40000, 'Mercedes-Benz'),
    ];

    const { result: resultNew } = renderHook(() => useSortedCars(carsDataset, 'year_new'));
    expect(resultNew.current[0].year).toBe(2022);
    expect(resultNew.current[1].year).toBe(2020);
    expect(resultNew.current[2].year).toBe(2018);

    const { result: resultOld } = renderHook(() => useSortedCars(carsDataset, 'year_old'));
    expect(resultOld.current[0].year).toBe(2018);
    expect(resultOld.current[1].year).toBe(2020);
    expect(resultOld.current[2].year).toBe(2022);
  });

  it('should sort by mileage correctly', () => {
    const carsDataset = [
      createMockCar('1', 30000, 2020, 50000, 'Mercedes-Benz'),
      createMockCar('2', 25000, 2019, 30000, 'Mercedes-Benz'),
      createMockCar('3', 35000, 2021, 70000, 'Mercedes-Benz'),
    ];

    const { result: resultLow } = renderHook(() => useSortedCars(carsDataset, 'mileage_low'));
    expect(resultLow.current[0].lots[0].odometer.km).toBe(30000);
    expect(resultLow.current[1].lots[0].odometer.km).toBe(50000);
    expect(resultLow.current[2].lots[0].odometer.km).toBe(70000);

    const { result: resultHigh } = renderHook(() => useSortedCars(carsDataset, 'mileage_high'));
    expect(resultHigh.current[0].lots[0].odometer.km).toBe(70000);
    expect(resultHigh.current[1].lots[0].odometer.km).toBe(50000);
    expect(resultHigh.current[2].lots[0].odometer.km).toBe(30000);
  });
});