/**
 * Global Sorting Edge Cases Test
 * Tests specific edge cases and scenarios that might cause issues with global sorting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalSortingService } from '@/services/globalSortingService';
import { applyChronologicalRanking, getCarsForPage } from '@/utils/chronologicalRanking';

describe('Global Sorting Edge Cases', () => {
  let globalSortingService: GlobalSortingService;

  beforeEach(() => {
    globalSortingService = new GlobalSortingService();
  });

  it('should handle exactly 31 cars (just above threshold)', () => {
    // Test the edge case where we have exactly 31 cars (just above the 30 car threshold)
    const shouldUseGlobal = globalSortingService.shouldUseGlobalSorting(31);
    expect(shouldUseGlobal).toBe(true);
    
    console.log('✅ 31 cars (just above threshold) triggers global sorting');
  });

  it('should handle exactly 30 cars (at threshold)', () => {
    // Test the edge case where we have exactly 30 cars (at the threshold)
    const shouldUseGlobal = globalSortingService.shouldUseGlobalSorting(30);
    expect(shouldUseGlobal).toBe(false); // Should be false since it's > 30, not >= 30
    
    console.log('✅ 30 cars (at threshold) does not trigger global sorting');
  });

  it('should work correctly with large filter combinations', () => {
    // Simulate scenario: user filters for specific brand + model + year range
    // This should still work with global sorting
    
    const cars = Array.from({ length: 150 }, (_, i) => ({
      id: `car-${i + 1}`,
      manufacturer: { name: i < 50 ? 'Audi' : i < 100 ? 'BMW' : 'Mercedes' },
      model: { name: i % 2 === 0 ? 'A4' : 'A6' },
      year: 2018 + (i % 7), // Years 2018-2024
      lots: [{
        buy_now: Math.floor(Math.random() * 30000) + 20000, // 20k-50k EUR
        odometer: { km: Math.floor(Math.random() * 100000) + 50000 }
      }],
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));

    // Filter for Audi A4 cars from 2020-2022 (simulate complex filter)
    const filteredCars = cars.filter(car => 
      car.manufacturer.name === 'Audi' && 
      car.model.name === 'A4' && 
      car.year >= 2020 && 
      car.year <= 2022
    );

    console.log(`🔍 Complex filter: ${filteredCars.length} cars from ${cars.length} total`);

    if (filteredCars.length > 30) {
      // Apply global sorting
      const result = applyChronologicalRanking(filteredCars, 'price_low', 50);
      
      // Verify proper ranking
      const isSequential = result.rankedCars.every((car, index) => car.rank === index + 1);
      expect(isSequential).toBe(true);
      
      // Verify all cars match filter criteria
      const allMatchFilter = result.rankedCars.every(car => 
        car.manufacturer.name === 'Audi' && 
        car.model.name === 'A4' && 
        car.year >= 2020 && 
        car.year <= 2022
      );
      expect(allMatchFilter).toBe(true);
      
      console.log(`✅ Complex filter with global sorting works: ${filteredCars.length} cars properly ranked`);
    } else {
      console.log(`ℹ️ Filtered dataset too small (${filteredCars.length} cars), global sorting not needed`);
    }
  });

  it('should handle zero cars gracefully', () => {
    // Edge case: no cars match filter
    const shouldUseGlobal = globalSortingService.shouldUseGlobalSorting(0);
    expect(shouldUseGlobal).toBe(false);
    
    const result = applyChronologicalRanking([], 'price_low', 50);
    expect(result.totalCars).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.rankedCars).toEqual([]);
    
    console.log('✅ Zero cars scenario handled gracefully');
  });

  it('should maintain consistency across different page sizes', () => {
    // Test that global sorting works with different page sizes
    const cars = Array.from({ length: 200 }, (_, i) => ({
      id: `car-${i + 1}`,
      manufacturer: { name: 'Test' },
      model: { name: 'Model' },
      year: 2020,
      lots: [{ buy_now: i * 100 + 15000 }], // Sequential prices for predictable testing
      created_at: new Date().toISOString()
    }));

    // Test with different page sizes
    const pageSizes = [25, 50, 100];
    
    pageSizes.forEach(pageSize => {
      const result = applyChronologicalRanking(cars, 'price_low', pageSize);
      
      // Verify proper pagination
      expect(result.carsPerPage).toBe(pageSize);
      expect(result.totalPages).toBe(Math.ceil(200 / pageSize));
      
      // Verify first page has cheapest cars
      const firstPage = getCarsForPage(result.rankedCars, 1, pageSize);
      const firstPagePrices = firstPage.map(car => car.lots[0].buy_now);
      const expectedFirstPagePrices = Array.from({ length: pageSize }, (_, i) => i * 100 + 15000);
      
      expect(firstPagePrices).toEqual(expectedFirstPagePrices);
      
      console.log(`✅ Page size ${pageSize}: ${result.totalPages} pages, correct ranking maintained`);
    });
  });

  it('should handle mixed data quality gracefully', () => {
    // Test with cars that have missing or invalid data
    const cars = Array.from({ length: 100 }, (_, i) => ({
      id: `car-${i + 1}`,
      manufacturer: { name: i % 10 === 0 ? '' : 'Audi' }, // Some empty manufacturer names
      model: { name: i % 15 === 0 ? '' : 'A4' }, // Some empty model names
      year: i % 20 === 0 ? 0 : 2015 + (i % 10), // Some invalid years
      lots: [{
        buy_now: i % 25 === 0 ? 0 : Math.floor(Math.random() * 40000) + 15000, // Some zero prices
        odometer: { km: Math.floor(Math.random() * 150000) + 20000 }
      }],
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));

    // Should still work with mixed data quality
    const result = applyChronologicalRanking(cars, 'price_low', 50);
    
    // Basic validation should pass
    expect(result.totalCars).toBe(100);
    expect(result.rankedCars.length).toBe(100);
    
    // All cars should have sequential ranks
    const isSequential = result.rankedCars.every((car, index) => car.rank === index + 1);
    expect(isSequential).toBe(true);
    
    console.log('✅ Mixed data quality handled gracefully');
  });

  it('should handle rapid filter changes without breaking', () => {
    // Simulate rapid filter changes that might cause race conditions
    const baseCars = Array.from({ length: 150 }, (_, i) => ({
      id: `car-${i + 1}`,
      manufacturer: { name: ['Audi', 'BMW', 'Mercedes'][i % 3] },
      model: { name: 'Model' },
      year: 2020,
      lots: [{ buy_now: Math.random() * 40000 + 15000 }],
      created_at: new Date().toISOString()
    }));

    // Simulate different filter states
    const filterScenarios = [
      { brand: 'Audi', expectedCount: 50 },
      { brand: 'BMW', expectedCount: 50 },
      { brand: 'Mercedes', expectedCount: 50 },
      { brand: null, expectedCount: 150 } // All brands
    ];

    filterScenarios.forEach(scenario => {
      const filteredCars = scenario.brand 
        ? baseCars.filter(car => car.manufacturer.name === scenario.brand)
        : baseCars;
      
      expect(filteredCars.length).toBe(scenario.expectedCount);
      
      if (filteredCars.length > 30) {
        const result = applyChronologicalRanking(filteredCars, 'price_low', 50);
        
        // Should maintain consistency
        expect(result.totalCars).toBe(filteredCars.length);
        const isSequential = result.rankedCars.every((car, index) => car.rank === index + 1);
        expect(isSequential).toBe(true);
      }
    });
    
    console.log('✅ Rapid filter changes handled consistently');
  });
});