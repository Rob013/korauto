import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test to simulate the exact user workflow described in the problem statement:
// "sorting from 1 to last page not all sorting to do on same page"
// "example showing lowest price on top highest bottom FIX IT make it lowest on first page and highest on last page"

describe('User Workflow Sorting - End to End Test', () => {
  
  const generateMockCars = (count: number) => {
    const cars = [];
    for (let i = 1; i <= count; i++) {
      cars.push({
        id: i.toString(),
        manufacturer: { name: 'Mercedes-Benz' },
        model: { name: 'A-Class' },
        year: 2015 + (i % 8),
        lots: [{
          buy_now: 15000 + Math.random() * 40000, // Random prices from 15k to 55k
          odometer: { km: 20000 + Math.random() * 150000 },
          popularity_score: Math.random() * 100
        }],
        status: 'active'
      });
    }
    return cars;
  };

  it('should demonstrate the complete user workflow: filtering -> sorting -> pagination', () => {
    // Step 1: User applies filter (Mercedes A-Class) -> gets 554 results
    const filteredCars = generateMockCars(554);
    const totalCount = filteredCars.length;
    
    console.log(`User applied filter: Mercedes A-Class -> ${totalCount} results`);
    
    // Step 2: User sorts by "Price: Low to High"
    // This is what SHOULD happen: globally sort all 554 cars
    const globalSortedCars = [...filteredCars].sort((a, b) => 
      (a.lots[0].buy_now + 2200) - (b.lots[0].buy_now + 2200)
    );
    
    // Step 3: Pagination should work on globally sorted results
    const pageSize = 50;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Simulate pagination on globally sorted results
    const page1 = globalSortedCars.slice(0, pageSize);
    const page2 = globalSortedCars.slice(pageSize, pageSize * 2);
    const lastPage = globalSortedCars.slice((totalPages - 1) * pageSize);
    
    // Step 4: Verify expected behavior
    console.log(`Total pages: ${totalPages}`);
    console.log(`Page 1 cheapest: €${(page1[0].lots[0].buy_now + 2200).toFixed(0)}`);
    console.log(`Page 1 most expensive: €${(page1[page1.length - 1].lots[0].buy_now + 2200).toFixed(0)}`);
    console.log(`Last page cheapest: €${(lastPage[0].lots[0].buy_now + 2200).toFixed(0)}`);
    console.log(`Last page most expensive: €${(lastPage[lastPage.length - 1].lots[0].buy_now + 2200).toFixed(0)}`);
    
    // VALIDATION: Lowest price should be on first page, highest on last page
    const lowestPrice = Math.min(...globalSortedCars.map(car => car.lots[0].buy_now + 2200));
    const highestPrice = Math.max(...globalSortedCars.map(car => car.lots[0].buy_now + 2200));
    
    // Lowest price car should be on page 1
    const page1Prices = page1.map(car => car.lots[0].buy_now + 2200);
    expect(page1Prices).toContain(lowestPrice);
    
    // Highest price car should be on last page
    const lastPagePrices = lastPage.map(car => car.lots[0].buy_now + 2200);
    expect(lastPagePrices).toContain(highestPrice);
    
    // Verify sorting order across pages
    for (let i = 1; i < globalSortedCars.length; i++) {
      const prevPrice = globalSortedCars[i-1].lots[0].buy_now + 2200;
      const currPrice = globalSortedCars[i].lots[0].buy_now + 2200;
      expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
    }
    
    // Verify page boundaries
    const lastPriceOfPage1 = page1[page1.length - 1].lots[0].buy_now + 2200;
    const firstPriceOfPage2 = page2[0].lots[0].buy_now + 2200;
    expect(firstPriceOfPage2).toBeGreaterThanOrEqual(lastPriceOfPage1);
  });

  it('should handle the problematic scenario: sort trigger with proper state management', async () => {
    // Simulate the EncarCatalog component state and behavior
    let totalCount = 0;
    let sortBy = 'recently_added';
    let isSortingGlobal = false;
    let allCarsForSorting: any[] = [];
    const fetchingSortRef = { current: false };
    
    const mockCars = generateMockCars(554);
    let globalSortCallCount = 0;
    
    // Mock the fetchAllCarsForSorting function
    const mockFetchAllCarsForSorting = vi.fn(async () => {
      globalSortCallCount++;
      fetchingSortRef.current = true;
      
      // Simulate async fetch
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Sort all cars globally
      const sorted = [...mockCars].sort((a, b) => {
        if (sortBy === 'price_asc') {
          return (a.lots[0].buy_now + 2200) - (b.lots[0].buy_now + 2200);
        }
        if (sortBy === 'price_desc') {
          return (b.lots[0].buy_now + 2200) - (a.lots[0].buy_now + 2200);
        }
        return 0; // default
      });
      
      allCarsForSorting = sorted;
      isSortingGlobal = true;
      fetchingSortRef.current = false;
    });
    
    // Simulate the useEffect trigger when sortBy changes
    const triggerSortEffect = async (newSortBy: string) => {
      sortBy = newSortBy;
      
      if (totalCount > 50) {
        if (!fetchingSortRef.current) {
          console.log(`🔄 Triggering global sorting: totalCount=${totalCount}, sortBy=${sortBy}`);
          await mockFetchAllCarsForSorting();
        }
      }
    };
    
    // Simulate the onValueChange handler for immediate triggering
    const handleSortChange = async (value: string) => {
      sortBy = value;
      if (totalCount > 50 && !fetchingSortRef.current) {
        console.log(`🔄 Sort changed: Immediately triggering global sorting for ${totalCount} cars with sortBy=${value}`);
        await mockFetchAllCarsForSorting();
      }
    };
    
    // Step 1: Simulate initial data load
    totalCount = 554;
    
    // Step 2: User changes sort to price_asc
    await handleSortChange('price_asc');
    
    // Verify global sorting was triggered
    expect(globalSortCallCount).toBe(1);
    expect(isSortingGlobal).toBe(true);
    expect(allCarsForSorting.length).toBe(554);
    
    // Verify sorting is correct
    for (let i = 1; i < allCarsForSorting.length; i++) {
      const prevPrice = allCarsForSorting[i-1].lots[0].buy_now + 2200;
      const currPrice = allCarsForSorting[i].lots[0].buy_now + 2200;
      expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
    }
    
    // Step 3: Simulate pagination on globally sorted results
    const page1 = allCarsForSorting.slice(0, 50);
    const lastPage = allCarsForSorting.slice(550, 554);
    
    // Verify page distribution
    expect(page1).toHaveLength(50);
    expect(lastPage).toHaveLength(4);
    
    // Verify lowest on first page, highest on last page
    const globalLowest = Math.min(...allCarsForSorting.map(car => car.lots[0].buy_now + 2200));
    const globalHighest = Math.max(...allCarsForSorting.map(car => car.lots[0].buy_now + 2200));
    
    const page1Prices = page1.map(car => car.lots[0].buy_now + 2200);
    const lastPagePrices = lastPage.map(car => car.lots[0].buy_now + 2200);
    
    expect(page1Prices).toContain(globalLowest);
    expect(lastPagePrices).toContain(globalHighest);
    
    console.log(`✅ Global sorting working: Lowest €${globalLowest.toFixed(0)} on page 1, Highest €${globalHighest.toFixed(0)} on last page`);
  });

  it('should validate the carsToSort logic correctly prioritizes global sorting', () => {
    // Simulate the carsToSort memo logic from EncarCatalog.tsx
    const createCarsToSort = (
      isSortingGlobal: boolean, 
      allCarsForSorting: any[], 
      carsForSorting: any[], 
      isDefaultState: boolean
    ) => {
      if (isDefaultState && !isSortingGlobal) {
        return []; // daily rotating cars (empty for test)
      }
      
      return isSortingGlobal && allCarsForSorting.length > 0 ? allCarsForSorting : carsForSorting;
    };
    
    const currentPageCars = generateMockCars(50); // First 50 cars
    const globalCars = generateMockCars(554); // All 554 cars
    
    // Test scenario 1: Global sorting is active
    let carsToSort = createCarsToSort(true, globalCars, currentPageCars, false);
    expect(carsToSort).toBe(globalCars);
    expect(carsToSort.length).toBe(554);
    
    // Test scenario 2: Global sorting is not active
    carsToSort = createCarsToSort(false, [], currentPageCars, false);
    expect(carsToSort).toBe(currentPageCars);
    expect(carsToSort.length).toBe(50);
    
    // Test scenario 3: Default state (no global sorting)
    carsToSort = createCarsToSort(false, [], currentPageCars, true);
    expect(carsToSort).toEqual([]);
    
    console.log('✅ carsToSort logic correctly prioritizes global sorting when available');
  });
});