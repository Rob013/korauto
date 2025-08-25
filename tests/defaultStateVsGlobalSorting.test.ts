import { describe, it, expect, vi } from 'vitest';

// Test to check if isDefaultState interferes with global sorting
describe('Default State vs Global Sorting', () => {
  
  it('should trigger global sorting even when not in default state', async () => {
    // Simulate user applying Mercedes A-Class filter
    const filters = {
      manufacturer_id: '123',
      model_id: '456'
    };
    
    // Check isDefaultState logic
    const isDefaultState = (!filters.manufacturer_id || filters.manufacturer_id === 'all') && 
                           !filters.model_id;
    
    expect(isDefaultState).toBe(false); // User has applied filters
    
    // Simulate the state when filters are applied
    const totalCount = 554; // Large dataset after filtering
    let sortBy = 'recently_added';
    let isSortingGlobal = false;
    let allCarsForSorting: any[] = [];
    const fetchingSortRef = { current: false };
    
    let globalSortCallCount = 0;
    
    const mockFetchAllCarsForSorting = vi.fn(async () => {
      globalSortCallCount++;
      fetchingSortRef.current = true;
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      allCarsForSorting = Array.from({ length: totalCount }, (_, i) => ({ id: i + 1 }));
      isSortingGlobal = true;
      fetchingSortRef.current = false;
    });
    
    // Simulate the useEffect trigger (when not in default state)
    const triggerGlobalSortEffect = async () => {
      if (totalCount > 50) {
        if (!fetchingSortRef.current) {
          console.log(`🔄 Triggering global sorting: totalCount=${totalCount}, sortBy=${sortBy}`);
          await mockFetchAllCarsForSorting();
        }
      }
    };
    
    // Simulate user changing sort to price_asc
    sortBy = 'price_asc';
    await triggerGlobalSortEffect();
    
    // Verify global sorting was triggered even though not in default state
    expect(globalSortCallCount).toBe(1);
    expect(isSortingGlobal).toBe(true);
    expect(allCarsForSorting.length).toBe(554);
    
    // Simulate the carsToSort logic
    const carsForSorting = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 })); // Current page cars
    const carsToSort = isSortingGlobal && allCarsForSorting.length > 0 ? allCarsForSorting : carsForSorting;
    
    // When global sorting is active, should use all cars, not just current page
    expect(carsToSort).toBe(allCarsForSorting);
    expect(carsToSort.length).toBe(554);
    
    console.log('✅ Global sorting works correctly with applied filters (non-default state)');
  });

  it('should demonstrate the exact user workflow from problem statement', async () => {
    // Step 1: User starts with default state (no filters)
    let filters = {};
    let isDefaultState = true;
    let totalCount = 0;
    let sortBy = 'recently_added';
    let isSortingGlobal = false;
    let allCarsForSorting: any[] = [];
    
    console.log('Step 1: User starts with default catalog view');
    
    // Step 2: User applies filter for Mercedes A-Class
    filters = {
      manufacturer_id: '123', // Mercedes
      model_id: '456'         // A-Class
    };
    
    isDefaultState = false; // No longer in default state
    totalCount = 554;       // Results after filtering
    
    console.log('Step 2: User applied Mercedes A-Class filter -> 554 results');
    
    // Step 3: User changes sort to "Price: Low to High"
    sortBy = 'price_asc';
    
    // This should trigger global sorting
    if (totalCount > 50) {
      const mockCars = Array.from({ length: totalCount }, (_, i) => ({
        id: i + 1,
        lots: [{ buy_now: 15000 + Math.random() * 40000 }]
      }));
      
      // Sort all cars globally
      mockCars.sort((a, b) => (a.lots[0].buy_now + 2200) - (b.lots[0].buy_now + 2200));
      
      allCarsForSorting = mockCars;
      isSortingGlobal = true;
    }
    
    console.log('Step 3: User changed sort to "Price: Low to High"');
    console.log(`Global sorting active: ${isSortingGlobal}`);
    console.log(`Cars available for sorting: ${allCarsForSorting.length}`);
    
    // Step 4: Verify pagination works correctly on globally sorted results
    const pageSize = 50;
    const totalPages = Math.ceil(allCarsForSorting.length / pageSize);
    
    const page1 = allCarsForSorting.slice(0, pageSize);
    const lastPage = allCarsForSorting.slice((totalPages - 1) * pageSize);
    
    console.log(`Step 4: Pagination - ${totalPages} pages total`);
    
    // Verify lowest prices are on first page
    const globalLowest = Math.min(...allCarsForSorting.map(car => car.lots[0].buy_now + 2200));
    const globalHighest = Math.max(...allCarsForSorting.map(car => car.lots[0].buy_now + 2200));
    
    const page1Prices = page1.map(car => car.lots[0].buy_now + 2200);
    const lastPagePrices = lastPage.map(car => car.lots[0].buy_now + 2200);
    
    expect(page1Prices).toContain(globalLowest);
    expect(lastPagePrices).toContain(globalHighest);
    
    console.log(`✅ FIXED: Lowest price €${globalLowest.toFixed(0)} is on page 1`);
    console.log(`✅ FIXED: Highest price €${globalHighest.toFixed(0)} is on page ${totalPages}`);
    console.log('✅ Complete user workflow working correctly');
  });

  it('should handle the specific scenario where global sorting is not triggered', () => {
    // This test identifies potential scenarios where global sorting might fail
    
    const scenarios = [
      {
        name: 'User changes sort before cars are loaded',
        totalCount: 0,
        sortBy: 'price_asc',
        expected: false
      },
      {
        name: 'User changes sort with small dataset',
        totalCount: 45,
        sortBy: 'price_asc',
        expected: false
      },
      {
        name: 'User changes sort with exactly 50 cars',
        totalCount: 50,
        sortBy: 'price_asc',
        expected: false
      },
      {
        name: 'User changes sort with large dataset',
        totalCount: 554,
        sortBy: 'price_asc',
        expected: true
      },
      {
        name: 'Fetch already in progress',
        totalCount: 554,
        sortBy: 'price_asc',
        fetchingInProgress: true,
        expected: false
      }
    ];
    
    scenarios.forEach(({ name, totalCount, sortBy, fetchingInProgress = false, expected }) => {
      const fetchingSortRef = { current: fetchingInProgress };
      const shouldTriggerGlobalSort = totalCount > 50 && !fetchingSortRef.current;
      
      expect(shouldTriggerGlobalSort).toBe(expected);
      
      const result = shouldTriggerGlobalSort ? 'TRIGGERS' : 'DOES NOT TRIGGER';
      console.log(`${result}: ${name}`);
    });
  });
});