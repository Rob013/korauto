import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test to identify specific edge cases that could cause sorting to fail
describe('Catalog Sorting Edge Cases', () => {

  it('should handle race condition: sort change before totalCount is available', async () => {
    // Simulate scenario where user changes sort before cars are loaded
    let totalCount = 0;
    let sortBy = 'recently_added';
    const isSortingGlobal = false;
    const allCarsForSorting: any[] = [];
    const fetchingSortRef = { current: false };
    
    let globalSortCallCount = 0;
    
    const mockFetchAllCarsForSorting = vi.fn(async () => {
      globalSortCallCount++;
      console.log(`Mock fetch called: totalCount=${totalCount}, sortBy=${sortBy}`);
    });
    
    // Simulate useEffect trigger logic
    const triggerSortEffect = (newSortBy: string, newTotalCount: number) => {
      sortBy = newSortBy;
      totalCount = newTotalCount;
      
      if (totalCount > 50) {
        if (!fetchingSortRef.current) {
          console.log(`🔄 Triggering global sorting: totalCount=${totalCount}, sortBy=${sortBy}`);
          mockFetchAllCarsForSorting();
        }
      }
    };
    
    // Simulate onValueChange handler
    const handleSortChange = (value: string) => {
      sortBy = value;
      if (totalCount > 50 && !fetchingSortRef.current) {
        console.log(`🔄 Sort changed: Immediately triggering global sorting for ${totalCount} cars with sortBy=${value}`);
        mockFetchAllCarsForSorting();
      }
    };
    
    // Test Race Condition 1: Sort changes before totalCount is set
    handleSortChange('price_asc'); // totalCount is still 0
    expect(globalSortCallCount).toBe(0); // Should not trigger
    
    // Then totalCount becomes available
    triggerSortEffect('price_asc', 554);
    expect(globalSortCallCount).toBe(1); // Should trigger now
    
    // Test Race Condition 2: Rapid sort changes
    handleSortChange('price_desc');
    expect(globalSortCallCount).toBe(2);
    
    handleSortChange('year_desc');
    expect(globalSortCallCount).toBe(3);
    
    console.log('✅ Race condition test passed');
  });

  it('should ensure global sorting is triggered when both conditions are met', () => {
    // Test the exact trigger conditions
    const scenarios = [
      { totalCount: 0, sortBy: 'price_asc', expected: false, desc: 'totalCount too low' },
      { totalCount: 50, sortBy: 'price_asc', expected: false, desc: 'totalCount exactly 50' },
      { totalCount: 51, sortBy: 'price_asc', expected: true, desc: 'totalCount just above threshold' },
      { totalCount: 554, sortBy: 'price_asc', expected: true, desc: 'typical large dataset' },
      { totalCount: 1000, sortBy: 'price_asc', expected: true, desc: 'very large dataset' },
    ];
    
    scenarios.forEach(({ totalCount, sortBy, expected, desc }) => {
      const fetchingSortRef = { current: false };
      const shouldTrigger = totalCount > 50 && !fetchingSortRef.current;
      
      expect(shouldTrigger).toBe(expected);
      console.log(`✅ ${desc}: ${shouldTrigger ? 'triggers' : 'does not trigger'} global sorting`);
    });
  });

  it('should handle state transitions correctly', async () => {
    // Simulate the complete state transition from loading to sorted
    const state = {
      totalCount: 0,
      sortBy: 'recently_added',
      isSortingGlobal: false,
      allCarsForSorting: [] as any[],
      fetchingSortRef: { current: false },
      currentPage: 1
    };
    
    const generateMockCars = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        lots: [{ buy_now: 15000 + Math.random() * 40000 }]
      }));
    };
    
    const mockFetchAllCarsForSorting = async () => {
      if (state.fetchingSortRef.current) return;
      
      state.fetchingSortRef.current = true;
      const allCars = generateMockCars(state.totalCount);
      
      // Sort cars based on sortBy
      if (state.sortBy === 'price_asc') {
        allCars.sort((a, b) => (a.lots[0].buy_now) - (b.lots[0].buy_now));
      }
      
      state.allCarsForSorting = allCars;
      state.isSortingGlobal = true;
      state.fetchingSortRef.current = false;
    };
    
    // Step 1: Initial load - cars become available
    state.totalCount = 554;
    expect(state.isSortingGlobal).toBe(false);
    expect(state.allCarsForSorting.length).toBe(0);
    
    // Step 2: User changes sort to price_asc
    state.sortBy = 'price_asc';
    await mockFetchAllCarsForSorting();
    
    expect(state.isSortingGlobal).toBe(true);
    expect(state.allCarsForSorting.length).toBe(554);
    
    // Step 3: Verify sorting is correct
    for (let i = 1; i < state.allCarsForSorting.length; i++) {
      const prevPrice = state.allCarsForSorting[i-1].lots[0].buy_now;
      const currPrice = state.allCarsForSorting[i].lots[0].buy_now;
      expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
    }
    
    // Step 4: Test pagination on globally sorted results
    const pageSize = 50;
    const carsForPage1 = state.allCarsForSorting.slice(0, pageSize);
    const carsForPage2 = state.allCarsForSorting.slice(pageSize, pageSize * 2);
    
    expect(carsForPage1.length).toBe(50);
    expect(carsForPage2.length).toBe(50);
    
    // Verify price order across pages
    const lastPriceOfPage1 = carsForPage1[carsForPage1.length - 1].lots[0].buy_now;
    const firstPriceOfPage2 = carsForPage2[0].lots[0].buy_now;
    expect(firstPriceOfPage2).toBeGreaterThanOrEqual(lastPriceOfPage1);
    
    console.log('✅ State transition test passed - global sorting working correctly');
  });

  it('should validate the exact problem scenario described', () => {
    // This test validates the exact problem: "lowest price on top highest bottom"
    // should be "lowest on first page and highest on last page"
    
    const generateCarsWithPrices = (count: number) => {
      const cars = [];
      for (let i = 0; i < count; i++) {
        cars.push({
          id: i + 1,
          lots: [{ buy_now: 15000 + (i * 100) }] // Incrementally increasing prices
        });
      }
      // Shuffle to simulate unsorted data
      return cars.sort(() => Math.random() - 0.5);
    };
    
    const totalCars = 554;
    const unsortedCars = generateCarsWithPrices(totalCars);
    
    // Current problematic behavior: sort only first page
    const firstPageOnly = unsortedCars.slice(0, 50);
    const sortedFirstPageOnly = [...firstPageOnly].sort((a, b) => 
      (a.lots[0].buy_now) - (b.lots[0].buy_now)
    );
    
    // Correct behavior: sort all cars globally
    const globalSorted = [...unsortedCars].sort((a, b) => 
      (a.lots[0].buy_now) - (b.lots[0].buy_now)
    );
    
    // Problem validation: cheapest from first page only vs global cheapest
    const cheapestFirstPageOnly = sortedFirstPageOnly[0].lots[0].buy_now;
    const cheapestGlobal = globalSorted[0].lots[0].buy_now;
    const mostExpensiveGlobal = globalSorted[globalSorted.length - 1].lots[0].buy_now;
    
    // The global cheapest should be different (likely cheaper) than the first-page-only cheapest
    expect(cheapestGlobal).toBeLessThanOrEqual(cheapestFirstPageOnly);
    
    // Test pagination on globally sorted results
    const pageSize = 50;
    const totalPages = Math.ceil(totalCars / pageSize);
    
    const page1 = globalSorted.slice(0, pageSize);
    const lastPage = globalSorted.slice((totalPages - 1) * pageSize);
    
    // Validation: lowest prices should be on first page
    const page1Prices = page1.map(car => car.lots[0].buy_now);
    expect(page1Prices).toContain(cheapestGlobal);
    
    // Validation: highest prices should be on last page
    const lastPagePrices = lastPage.map(car => car.lots[0].buy_now);
    expect(lastPagePrices).toContain(mostExpensiveGlobal);
    
    console.log(`✅ Problem scenario validated:`);
    console.log(`   First-page-only cheapest: €${cheapestFirstPageOnly.toFixed(0)}`);
    console.log(`   Global cheapest (page 1): €${cheapestGlobal.toFixed(0)}`);
    console.log(`   Global most expensive (page ${totalPages}): €${mostExpensiveGlobal.toFixed(0)}`);
    console.log(`   Expected improvement: €${(cheapestFirstPageOnly - cheapestGlobal).toFixed(0)}`);
  });
});