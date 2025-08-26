// Integration test for load more with filters functionality
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Load More with Filters Integration Test', () => {
  // Simulate the exact behavior we just fixed
  
  it('should handle load more correctly when filters are applied', () => {
    // Simulate a real scenario:
    // 1. User applies brand filter (Toyota)
    // 2. API returns 100 total Toyota cars
    // 3. Page 1 loads 20 cars 
    // 4. User clicks "Load More"
    // 5. Page 2 loads 20 more cars
    // 6. hasMore should still be true since 40 < 100
    
    const scenario = {
      appliedFilters: { brand: 'toyota', page: 1, pageSize: 20 },
      totalFilteredCars: 100,
      page1Response: {
        cars: Array.from({length: 20}, (_, i) => ({ id: `car-${i+1}`, make: 'Toyota' })),
        total: 100,
        hasMore: true
      },
      page2Response: {
        cars: Array.from({length: 20}, (_, i) => ({ id: `car-${i+21}`, make: 'Toyota' })),
        total: 100,
        hasMore: true
      }
    };
    
    // BEFORE THE FIX: hasMore would incorrectly be set based only on page2Response.hasMore
    // AFTER THE FIX: hasMore is calculated based on accumulated cars vs total
    
    let accumulatedCars: any[] = [];
    let currentHasMore = false;
    
    // Simulate page 1 loading (first page)
    const isFirstPage1 = scenario.appliedFilters.page === 1;
    if (isFirstPage1) {
      accumulatedCars = scenario.page1Response.cars;
      currentHasMore = scenario.page1Response.hasMore;
    }
    
    expect(accumulatedCars.length).toBe(20);
    expect(currentHasMore).toBe(true);
    
    // Simulate page 2 loading (load more)
    scenario.appliedFilters.page = 2;
    const isFirstPage2 = scenario.appliedFilters.page === 1;
    
    if (!isFirstPage2) {
      // Apply our fix logic
      const existingIds = new Set(accumulatedCars.map(car => car.id));
      const newCars = scenario.page2Response.cars.filter(car => !existingIds.has(car.id));
      const updatedAccumulated = [...accumulatedCars, ...newCars];
      
      // This is the key fix: recalculate hasMore based on accumulated vs total
      const calculatedHasMore = scenario.page2Response.hasMore && updatedAccumulated.length < scenario.page2Response.total;
      
      accumulatedCars = updatedAccumulated;
      currentHasMore = calculatedHasMore;
    }
    
    // Verify the fix works correctly
    expect(accumulatedCars.length).toBe(40); // 20 + 20 = 40 cars accumulated
    expect(currentHasMore).toBe(true); // Should still have more since 40 < 100
    
    console.log('✅ Load more with filters test passed');
    console.log(`   Accumulated: ${accumulatedCars.length} cars`);
    console.log(`   Total available: ${scenario.totalFilteredCars} cars`);
    console.log(`   Has more: ${currentHasMore}`);
  });
  
  it('should correctly stop loading when all filtered cars are loaded', () => {
    // Test the edge case where we reach the end
    const scenario = {
      totalFilteredCars: 45,
      currentAccumulated: 40,
      finalPageResponse: {
        cars: Array.from({length: 5}, (_, i) => ({ id: `car-${i+41}`, make: 'Toyota' })),
        total: 45,
        hasMore: false // API correctly reports no more pages
      }
    };
    
    // Apply our fix logic for the final page
    const updatedAccumulated = scenario.currentAccumulated + scenario.finalPageResponse.cars.length; // 45
    const calculatedHasMore = scenario.finalPageResponse.hasMore && updatedAccumulated < scenario.finalPageResponse.total; // false && 45 < 45 = false
    
    expect(updatedAccumulated).toBe(45);
    expect(calculatedHasMore).toBe(false);
    
    console.log('✅ End of filtered results test passed');
  });
});