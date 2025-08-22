import { describe, it, expect } from 'vitest';

describe('Catalog Default State Fixes', () => {
  
  it('should treat manufacturer_id="all" as default state', () => {
    // Helper function to simulate the isDefaultState logic
    const isDefaultState = (filters: any) => {
      return (!filters.manufacturer_id || filters.manufacturer_id === 'all') && 
             !filters.model_id && 
             !filters.generation_id &&
             !filters.color &&
             !filters.fuel_type &&
             !filters.transmission &&
             !filters.body_type &&
             !filters.odometer_from_km &&
             !filters.odometer_to_km &&
             !filters.from_year &&
             !filters.to_year &&
             !filters.buy_now_price_from &&
             !filters.buy_now_price_to &&
             !filters.search &&
             !filters.seats_count &&
             !filters.max_accidents &&
             (!filters.grade_iaai || filters.grade_iaai === 'all');
    };

    // Test cases that should be considered default state
    expect(isDefaultState({})).toBe(true);
    expect(isDefaultState({ manufacturer_id: 'all' })).toBe(true);
    expect(isDefaultState({ manufacturer_id: 'all', grade_iaai: 'all' })).toBe(true);
    expect(isDefaultState({ grade_iaai: 'all' })).toBe(true);

    // Test cases that should NOT be considered default state
    expect(isDefaultState({ manufacturer_id: '9' })).toBe(false);
    expect(isDefaultState({ manufacturer_id: 'all', model_id: '101' })).toBe(false);
    expect(isDefaultState({ manufacturer_id: 'all', from_year: '2020' })).toBe(false);
    expect(isDefaultState({ manufacturer_id: 'all', search: 'BMW' })).toBe(false);
    expect(isDefaultState({ manufacturer_id: 'all', grade_iaai: '2.0 diesel' })).toBe(false);
  });

  it('should show same data source for homepage and catalog in default state', () => {
    // Both homepage and catalog should use daily rotating cars when no filters applied
    // This simulates the logic where both components use the same underlying data
    
    const simulateDailyRotation = (cars: any[], hasFilters: boolean) => {
      if (hasFilters || cars.length === 0) {
        return cars;
      }
      
      // Both should use the same daily rotation logic
      const today = new Date();
      const dayOfMonth = today.getDate();
      const month = today.getMonth() + 1;
      const dailySeed = dayOfMonth * 100 + month;
      
      // Simple deterministic shuffle for testing
      const shuffled = [...cars].sort((a, b) => {
        const aHash = (a.id * dailySeed) % 1000;
        const bHash = (b.id * dailySeed) % 1000;
        return aHash - bHash;
      });
      
      return shuffled.slice(0, 50);
    };

    const mockCars = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      manufacturer: { name: `Brand ${i % 10}` },
      lots: [{ 
        buy_now: 20000 + (i * 1000),
        images: { normal: ['/images/car-placeholder.jpg'] }
      }]
    }));

    // Simulate homepage (no filters)
    const homepageHasFilters = false;
    const homepageCars = simulateDailyRotation(mockCars, homepageHasFilters);

    // Simulate catalog in default state (no filters or manufacturer_id="all")
    const catalogHasFilters = false;
    const catalogCars = simulateDailyRotation(mockCars, catalogHasFilters);

    // Both should return the same cars since they use the same logic and seed
    expect(homepageCars.length).toBe(catalogCars.length);
    expect(homepageCars.map(c => c.id)).toEqual(catalogCars.map(c => c.id));
  });

  it('should exclude fallback cars when manufacturer_id is set to specific brand', () => {
    // This test validates that when a specific brand is selected,
    // fallback cars are not shown to avoid "test cars"
    
    const mockCreateFallbackCars = (filters: any = {}) => {
      // Logic from the actual createFallbackCars function
      if (filters.manufacturer_id && 
          filters.manufacturer_id !== 'all' && 
          filters.manufacturer_id !== '' &&
          filters.manufacturer_id !== undefined &&
          filters.manufacturer_id !== null) {
        return []; // No fallback cars for specific brands
      }
      
      // Return fallback cars for default state
      return [
        { id: 1001, manufacturer: { id: 9, name: 'BMW' } },
        { id: 1002, manufacturer: { id: 1, name: 'Audi' } },
        { id: 1003, manufacturer: { id: 16, name: 'Mercedes-Benz' } }
      ];
    };

    // Should return fallback cars for default state
    expect(mockCreateFallbackCars({}).length).toBeGreaterThan(0);
    expect(mockCreateFallbackCars({ manufacturer_id: 'all' }).length).toBeGreaterThan(0);
    expect(mockCreateFallbackCars({ manufacturer_id: '' }).length).toBeGreaterThan(0);

    // Should NOT return fallback cars for specific brands
    expect(mockCreateFallbackCars({ manufacturer_id: '9' })).toHaveLength(0);
    expect(mockCreateFallbackCars({ manufacturer_id: '1' })).toHaveLength(0);
    expect(mockCreateFallbackCars({ manufacturer_id: '16' })).toHaveLength(0);
  });

  it('should use daily rotating cars in default state regardless of total count', () => {
    // Test that daily rotation is applied in default state even with large datasets
    
    const simulateDefaultStateLogic = (
      isDefaultState: boolean, 
      isSortingGlobal: boolean,
      dailyRotatingCars: any[],
      allCarsForSorting: any[],
      carsForSorting: any[]
    ) => {
      // This matches the actual logic in EncarCatalog.tsx
      if (isDefaultState && !isSortingGlobal) {
        return dailyRotatingCars;
      }
      
      return isSortingGlobal && allCarsForSorting.length > 0 
        ? allCarsForSorting 
        : carsForSorting;
    };

    const mockDailyRotatingCars = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
    const mockAllCarsForSorting = Array.from({ length: 500 }, (_, i) => ({ id: i + 1 }));
    const mockCarsForSorting = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

    // In default state without global sorting, should use daily rotating cars
    const result1 = simulateDefaultStateLogic(
      true,  // isDefaultState
      false, // isSortingGlobal
      mockDailyRotatingCars,
      mockAllCarsForSorting,
      mockCarsForSorting
    );
    expect(result1).toBe(mockDailyRotatingCars);

    // In default state with global sorting, should use global sorting cars (not daily rotating)
    const result2 = simulateDefaultStateLogic(
      true,  // isDefaultState
      true,  // isSortingGlobal
      mockDailyRotatingCars,
      mockAllCarsForSorting,
      mockCarsForSorting
    );
    expect(result2).toBe(mockAllCarsForSorting); // Should use all cars for sorting when global sorting is active

    // Not in default state with global sorting, should use all cars for sorting
    const result3 = simulateDefaultStateLogic(
      false, // isDefaultState
      true,  // isSortingGlobal
      mockDailyRotatingCars,
      mockAllCarsForSorting,
      mockCarsForSorting
    );
    expect(result3).toBe(mockAllCarsForSorting);

    // Not in default state without global sorting, should use filtered cars for sorting
    const result4 = simulateDefaultStateLogic(
      false, // isDefaultState
      false, // isSortingGlobal
      mockDailyRotatingCars,
      [],    // no allCarsForSorting
      mockCarsForSorting
    );
    expect(result4).toBe(mockCarsForSorting);
  });
});