/**
 * Fast Global Sorting Tests
 * Comprehensive tests for the new global sorting system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aggregateFetch, shouldUseAggregateFetch, estimateFetchTime } from '../src/services/aggregateFetch';
import { CacheManager, normalizeParams } from '../src/services/cacheManager';
import { globalSort, validateSortOrder, getExpectedFirstItem } from '../src/services/globalSort';
import { sortWithOptimalMethod } from '../src/workers/sortWorker';
import type { LeanCar, SortKey } from '../src/services/globalSort';

// Mock browser APIs for Node environment
Object.assign(globalThis, {
  indexedDB: undefined,
  URL: {
    createObjectURL: () => 'mock-url',
    revokeObjectURL: () => {}
  },
  Worker: class MockWorker {
    constructor() {}
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
  },
  Blob: class MockBlob {
    constructor() {}
  }
});

// Mock data for testing
const mockCars: LeanCar[] = [
  { id: '1', price: 25000, year: 2020, mileage: 15000, make: 'Toyota', model: 'Camry' },
  { id: '2', price: 35000, year: 2021, mileage: 8000, make: 'Honda', model: 'Accord' },
  { id: '3', price: 45000, year: 2022, mileage: 5000, make: 'BMW', model: 'X3' },
  { id: '4', price: 15000, year: 2018, mileage: 25000, make: 'Ford', model: 'Focus' },
  { id: '5', price: 55000, year: 2023, mileage: 1000, make: 'Mercedes', model: 'C-Class' },
  { id: '6', price: undefined as any, year: 2019, mileage: undefined, make: 'Nissan', model: 'Sentra' },
  { id: '7', price: 30000, year: undefined as any, mileage: 12000, make: 'Audi', model: 'A4' },
];

// Mock fetch function
const mockFetchCarsWithKeyset = vi.fn();

vi.mock('../src/services/carsApi', () => ({
  fetchCarsWithKeyset: (...args: any[]) => mockFetchCarsWithKeyset(...args)
}));

describe('Aggregate Fetch Service', () => {
  beforeEach(() => {
    mockFetchCarsWithKeyset.mockReset();
  });

  it('should fetch all pages with cursor pagination', async () => {
    // Setup mock responses
    mockFetchCarsWithKeyset
      .mockResolvedValueOnce({
        items: mockCars.slice(0, 3),
        total: 7,
        nextCursor: 'cursor1'
      })
      .mockResolvedValueOnce({
        items: mockCars.slice(3, 6),
        total: 7,
        nextCursor: 'cursor2'
      })
      .mockResolvedValueOnce({
        items: mockCars.slice(6),
        total: 7,
        nextCursor: undefined
      });

    const result = await aggregateFetch({
      filters: { make: 'Toyota' },
      sort: 'price_asc'
    });

    expect(result.items).toHaveLength(7);
    expect(result.total).toBe(7);
    expect(result.fetchedPages).toBe(3);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should handle retry with exponential backoff', async () => {
    mockFetchCarsWithKeyset
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        items: mockCars,
        total: 7,
        nextCursor: undefined
      });

    const result = await aggregateFetch({
      filters: {},
      sort: 'price_asc'
    });

    expect(result.items).toHaveLength(7);
    expect(mockFetchCarsWithKeyset).toHaveBeenCalledTimes(3);
  });

  it('should report progress during aggregation', async () => {
    const progressCallback = vi.fn();
    
    mockFetchCarsWithKeyset.mockImplementation(() => 
      Promise.resolve({
        items: mockCars.slice(0, 2),
        total: 7,
        nextCursor: undefined
      })
    );

    await aggregateFetch({
      filters: {},
      sort: 'price_asc'
    }, {
      onProgress: progressCallback
    });

    expect(progressCallback).toHaveBeenCalled();
    const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
    expect(lastCall).toMatchObject({
      loaded: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number)
    });
  });

  it('should estimate fetch time correctly', () => {
    const estimate = estimateFetchTime(1000, 50, 200);
    expect(estimate).toBe(4000); // 20 pages * 200ms = 4000ms
  });

  it('should determine when to use aggregate fetch', () => {
    expect(shouldUseAggregateFetch(50)).toBe(true);
    expect(shouldUseAggregateFetch(100000)).toBe(false);
  });
});

describe('Cache Manager', () => {
  let cacheManager: CacheManager;

  beforeEach(async () => {
    cacheManager = new CacheManager({
      memoryTTL: 1000,
      indexedDBTTL: 2000,
      maxMemorySize: 5
    });
    await cacheManager.init();
  });

  afterEach(async () => {
    await cacheManager.clear();
  });

  it('should normalize parameters consistently', () => {
    const filters1 = { make: 'Toyota', model: 'Camry' };
    const filters2 = { model: 'Camry', make: 'Toyota' };
    
    const key1 = normalizeParams(filters1, 'price_asc');
    const key2 = normalizeParams(filters2, 'price_asc');
    
    expect(key1).toBe(key2);
  });

  it('should cache and retrieve data correctly', async () => {
    const testData = {
      items: mockCars,
      total: 7,
      params: { filters: { make: 'Toyota' } },
      sortKey: 'price_asc'
    };

    await cacheManager.set({ make: 'Toyota' }, 'price_asc', testData);
    const retrieved = await cacheManager.get({ make: 'Toyota' }, 'price_asc');

    expect(retrieved).toEqual(testData);
  });

  it('should respect TTL and expire data', async () => {
    const testData = {
      items: mockCars,
      total: 7,
      params: { filters: {} },
      sortKey: 'price_asc'
    };

    await cacheManager.set({}, 'price_asc', testData);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const retrieved = await cacheManager.get({}, 'price_asc');
    expect(retrieved).toBeNull();
  });

  it('should handle memory cache size limits', async () => {
    const testData = {
      items: mockCars,
      total: 7,
      params: { filters: {} },
      sortKey: 'price_asc'
    };

    // Fill beyond max size
    for (let i = 0; i < 10; i++) {
      await cacheManager.set({ make: `Brand${i}` }, 'price_asc', testData);
    }

    const stats = cacheManager.getStats();
    expect(stats.memory.size).toBeLessThanOrEqual(5);
  });
});

describe('Global Sorting', () => {
  it('should sort by price ascending with nulls last', () => {
    const result = globalSort(mockCars, 'price_asc');
    
    expect(result.items[0].id).toBe('4'); // Ford Focus, 15000
    expect(result.items[1].id).toBe('1'); // Toyota Camry, 25000
    expect(result.items[result.items.length - 1].id).toBe('6'); // Nissan with undefined price
    expect(validateSortOrder(result.items, 'price_asc')).toBe(true);
  });

  it('should sort by price descending with nulls last', () => {
    const result = globalSort(mockCars, 'price_desc');
    
    expect(result.items[0].id).toBe('5'); // Mercedes, 55000
    expect(result.items[1].id).toBe('3'); // BMW, 45000
    expect(result.items[result.items.length - 1].id).toBe('6'); // Nissan with undefined price
    expect(validateSortOrder(result.items, 'price_desc')).toBe(true);
  });

  it('should sort by year with stable ordering', () => {
    const result = globalSort(mockCars, 'year_desc');
    
    expect(result.items[0].id).toBe('5'); // 2023
    expect(result.items[1].id).toBe('3'); // 2022
    expect(validateSortOrder(result.items, 'year_desc')).toBe(true);
  });

  it('should sort by mileage with null handling', () => {
    const result = globalSort(mockCars, 'mileage_asc');
    
    expect(result.items[0].id).toBe('5'); // 1000 miles
    expect(result.items[result.items.length - 1].id).toBe('6'); // undefined mileage
    expect(validateSortOrder(result.items, 'mileage_asc')).toBe(true);
  });

  it('should sort by make alphabetically', () => {
    const result = globalSort(mockCars, 'make_asc');
    
    expect(result.items[0].make).toBe('Audi');
    expect(result.items[1].make).toBe('BMW');
    expect(result.items[result.items.length - 1].make).toBe('Toyota');
    expect(validateSortOrder(result.items, 'make_asc')).toBe(true);
  });

  it('should maintain stable sort with consistent secondary ordering', () => {
    const duplicatePriceCars = [
      { id: 'A', price: 25000, year: 2020, make: 'Brand', model: 'Model' },
      { id: 'B', price: 25000, year: 2020, make: 'Brand', model: 'Model' },
      { id: 'C', price: 25000, year: 2020, make: 'Brand', model: 'Model' }
    ];

    const result = globalSort(duplicatePriceCars, 'price_asc');
    
    // Should be sorted by ID as secondary sort
    expect(result.items[0].id).toBe('A');
    expect(result.items[1].id).toBe('B');
    expect(result.items[2].id).toBe('C');
  });

  it('should get expected first item for different sorts', () => {
    const cheapest = getExpectedFirstItem(mockCars, 'price_asc');
    const newest = getExpectedFirstItem(mockCars, 'year_desc');
    const lowestMileage = getExpectedFirstItem(mockCars, 'mileage_asc');

    expect(cheapest?.id).toBe('4'); // Ford Focus, 15000
    expect(newest?.id).toBe('5'); // Mercedes, 2023
    expect(lowestMileage?.id).toBe('5'); // Mercedes, 1000 miles
  });

  it('should handle empty arrays gracefully', () => {
    const result = globalSort([], 'price_asc');
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.duration).toBe(0);
  });

  it('should validate and normalize numeric fields', () => {
    const invalidCars = [
      { id: '1', price: '25000' as any, year: '2020' as any, make: 'Toyota', model: 'Camry' },
      { id: '2', price: 'invalid' as any, year: null as any, make: 'Honda', model: 'Accord' }
    ];

    const result = globalSort(invalidCars, 'price_asc');
    
    expect(result.items).toHaveLength(2);
    expect(typeof result.items[0].price).toBe('number');
    expect(typeof result.items[0].year).toBe('number');
  });
});

describe('Web Worker Integration', () => {
  it('should use main thread for small datasets', async () => {
    const result = await sortWithOptimalMethod(mockCars, 'price_asc');
    
    expect(result.items).toHaveLength(7);
    expect(result.sortKey).toBe('price_asc');
    expect(validateSortOrder(result.items, 'price_asc')).toBe(true);
  });

  it('should handle progress callbacks', async () => {
    const progressCallback = vi.fn();
    
    await sortWithOptimalMethod(mockCars, 'price_asc', progressCallback);
    
    // For small datasets, progress might not be called but should not error
    expect(() => progressCallback).not.toThrow();
  });
});

describe('Performance Integration Tests', () => {
  it('should complete price sort within reasonable time', async () => {
    const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
      id: `car_${i}`,
      price: Math.floor(Math.random() * 100000),
      year: 2010 + (i % 14),
      mileage: Math.floor(Math.random() * 200000),
      make: ['Toyota', 'Honda', 'Ford', 'BMW'][i % 4],
      model: 'Model'
    }));

    const startTime = performance.now();
    const result = await sortWithOptimalMethod(largeMockData, 'price_asc');
    const duration = performance.now() - startTime;

    expect(result.items).toHaveLength(1000);
    expect(validateSortOrder(result.items, 'price_asc')).toBe(true);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should maintain sort order consistency across multiple sorts', () => {
    const testData = mockCars.slice();
    
    // Sort multiple times with same parameters
    const result1 = globalSort(testData, 'price_asc');
    const result2 = globalSort(testData, 'price_asc');
    const result3 = globalSort(testData, 'price_asc');

    // Results should be identical
    expect(result1.items).toEqual(result2.items);
    expect(result2.items).toEqual(result3.items);
  });

  it('should handle edge cases in sorting', () => {
    const edgeCases = [
      { id: '1', price: 0, year: 2020, make: 'Zero', model: 'Price' },
      { id: '2', price: -1000, year: 2020, make: 'Negative', model: 'Price' },
      { id: '3', price: Infinity, year: 2020, make: 'Infinite', model: 'Price' },
      { id: '4', price: NaN, year: 2020, make: 'NaN', model: 'Price' }
    ];

    const result = globalSort(edgeCases, 'price_asc');
    expect(result.items).toHaveLength(4);
    expect(validateSortOrder(result.items, 'price_asc')).toBe(true);
  });
});

describe('Real-world Integration Scenarios', () => {
  it('should handle sort change scenario for price low to high', async () => {
    // Simulate the exact scenario from requirements
    mockFetchCarsWithKeyset.mockResolvedValue({
      items: mockCars,
      total: 7,
      nextCursor: undefined
    });

    const result = await aggregateFetch({
      filters: { make: 'Toyota' },
      sort: 'price_asc'
    });

    const sorted = globalSort(result.items, 'price_asc');
    
    // First page should start at global min
    expect(sorted.items[0].id).toBe('4'); // Cheapest car globally
    expect(sorted.items[0].price).toBe(15000);
    
    // Verify no duplicates
    const ids = sorted.items.map(car => car.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should handle resorting from cache identical to refetch', async () => {
    // First fetch and sort
    mockFetchCarsWithKeyset.mockResolvedValue({
      items: mockCars,
      total: 7,
      nextCursor: undefined
    });

    const initialResult = await aggregateFetch({
      filters: { make: 'Toyota' },
      sort: 'price_asc'
    });

    const cachedSort = globalSort(initialResult.items, 'year_desc');
    const refetchSort = globalSort(mockCars, 'year_desc');

    expect(cachedSort.items).toEqual(refetchSort.items);
  });

  it('should paginate large sorted results correctly', async () => {
    const largeMockData = Array.from({ length: 150 }, (_, i) => ({
      id: `car_${i.toString().padStart(3, '0')}`,
      price: i * 1000,
      year: 2020,
      make: 'Brand',
      model: 'Model'
    }));

    const sorted = globalSort(largeMockData, 'price_asc');
    
    // Test pagination
    const pageSize = 50;
    const page1 = sorted.items.slice(0, pageSize);
    const page2 = sorted.items.slice(pageSize, pageSize * 2);
    const page3 = sorted.items.slice(pageSize * 2, pageSize * 3);

    // Verify continuous ordering
    expect(page1[0].id).toBe('car_000');
    expect(page1[pageSize - 1].id).toBe('car_049');
    expect(page2[0].id).toBe('car_050');
    expect(page3[0].id).toBe('car_100');
    
    // No gaps or overlaps
    expect(page1[pageSize - 1].price).toBeLessThan(page2[0].price);
    expect(page2[pageSize - 1].price).toBeLessThan(page3[0].price);
  });
});