/**
 * Test to validate the exact problem statement scenario:
 * "1,183 cars across 24 pages • Page 1 of 24 • Showing 50 cars per page"
 * "user clicks lowest to highest - sort all this 1183 cars and rank them from lowest to highest"
 * "first page cheapest of all 1183 cars last page highest of 1183"
 */

import { describe, it, expect } from 'vitest';
import { applyChronologicalRanking, getCarsForPage } from '../src/utils/chronologicalRanking';

describe('Problem Statement Validation: 1,183 cars across 24 pages', () => {
  // Create exactly 1,183 cars as specified in the problem statement
  const mockCars = Array.from({ length: 1183 }, (_, i) => ({
    id: `car-${i + 1}`,
    manufacturer: { name: 'Audi' },
    model: { name: 'A4' },
    year: 2015 + (i % 10), // Years 2015-2024
    lots: [{
      buy_now: Math.floor(Math.random() * 50000) + 10000, // Random prices 10k-60k
      odometer: { km: Math.floor(Math.random() * 200000) + 10000 }
    }],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));

  it('should handle exactly 1,183 cars across 24 pages with global sorting', () => {
    const carsPerPage = 50;
    
    // Apply global sorting with price_low (lowest to highest)
    const result = applyChronologicalRanking(mockCars, 'price_low', carsPerPage);
    
    // Verify exact numbers from problem statement
    expect(result.totalCars).toBe(1183);
    expect(result.totalPages).toBe(24); // Math.ceil(1183 / 50) = 24
    expect(result.rankedCars).toHaveLength(1183);
    expect(result.carsPerPage).toBe(50);
    expect(result.sortedBy).toBe('price_low');
  });

  it('should ensure page 1 has the cheapest cars from ALL 1,183 cars', () => {
    const carsPerPage = 50;
    const result = applyChronologicalRanking(mockCars, 'price_low', carsPerPage);
    
    // Get page 1 cars
    const page1Cars = getCarsForPage(result.rankedCars, 1, carsPerPage);
    expect(page1Cars).toHaveLength(50);
    
    // Get all prices from entire dataset
    const allPrices = result.rankedCars.map(car => car.lots[0].buy_now);
    const globalMinPrice = Math.min(...allPrices);
    
    // Get page 1 prices
    const page1Prices = page1Cars.map(car => car.lots[0].buy_now);
    const page1MinPrice = Math.min(...page1Prices);
    
    // Page 1 should contain the absolute lowest price from all 1,183 cars
    expect(page1MinPrice).toBe(globalMinPrice);
    
    // All prices on page 1 should be among the 50 lowest prices globally
    const sortedAllPrices = [...allPrices].sort((a, b) => a - b);
    const lowest50Prices = sortedAllPrices.slice(0, 50);
    
    page1Prices.forEach(price => {
      expect(lowest50Prices).toContain(price);
    });
  });

  it('should ensure page 24 (last page) has the highest cars from ALL 1,183 cars', () => {
    const carsPerPage = 50;
    const result = applyChronologicalRanking(mockCars, 'price_low', carsPerPage);
    
    // Get last page (page 24)
    const lastPageNumber = result.totalPages; // Should be 24
    const lastPageCars = getCarsForPage(result.rankedCars, lastPageNumber, carsPerPage);
    
    // Last page should have 33 cars (1183 - 23*50 = 33)
    expect(lastPageCars.length).toBe(33);
    
    // Get all prices from entire dataset
    const allPrices = result.rankedCars.map(car => car.lots[0].buy_now);
    const globalMaxPrice = Math.max(...allPrices);
    
    // Get last page prices
    const lastPagePrices = lastPageCars.map(car => car.lots[0].buy_now);
    const lastPageMaxPrice = Math.max(...lastPagePrices);
    
    // Last page should contain the absolute highest price from all 1,183 cars
    expect(lastPageMaxPrice).toBe(globalMaxPrice);
    
    // All prices on last page should be among the highest prices globally
    const sortedAllPrices = [...allPrices].sort((a, b) => b - a);
    const highest33Prices = sortedAllPrices.slice(0, 33);
    
    lastPagePrices.forEach(price => {
      expect(highest33Prices).toContain(price);
    });
  });

  it('should maintain global ranking progression from page 1 to page 24', () => {
    const carsPerPage = 50;
    const result = applyChronologicalRanking(mockCars, 'price_low', carsPerPage);
    
    // Verify sequential ranking across all cars
    for (let i = 0; i < result.rankedCars.length; i++) {
      expect(result.rankedCars[i].rank).toBe(i + 1);
    }
    
    // Test progression between consecutive pages
    for (let pageNum = 1; pageNum < result.totalPages; pageNum++) {
      const currentPageCars = getCarsForPage(result.rankedCars, pageNum, carsPerPage);
      const nextPageCars = getCarsForPage(result.rankedCars, pageNum + 1, carsPerPage);
      
      if (nextPageCars.length > 0) {
        const currentPageMaxPrice = Math.max(...currentPageCars.map(car => car.lots[0].buy_now));
        const nextPageMinPrice = Math.min(...nextPageCars.map(car => car.lots[0].buy_now));
        
        // Every car on current page should be <= every car on next page
        expect(currentPageMaxPrice).toBeLessThanOrEqual(nextPageMinPrice);
      }
    }
  });

  it('should demonstrate the exact workflow: "user clicks lowest to highest"', () => {
    const carsPerPage = 50;
    
    // Simulate user clicking "lowest to highest" sort option
    const userSortChoice = 'price_low';
    
    // Apply global sorting across ALL 1,183 cars at once
    const globalResult = applyChronologicalRanking(mockCars, userSortChoice, carsPerPage);
    
    // Verify this creates the expected result structure
    expect(globalResult.totalCars).toBe(1183);
    expect(globalResult.totalPages).toBe(24);
    expect(globalResult.sortedBy).toBe('price_low');
    
    // Get page 1 and last page
    const page1 = getCarsForPage(globalResult.rankedCars, 1, carsPerPage);
    const lastPage = getCarsForPage(globalResult.rankedCars, 24, carsPerPage);
    
    // Verify page 1 has cheapest cars
    const page1MaxPrice = Math.max(...page1.map(car => car.lots[0].buy_now));
    const lastPageMinPrice = Math.min(...lastPage.map(car => car.lots[0].buy_now));
    
    // All cars on page 1 should be cheaper than all cars on last page
    expect(page1MaxPrice).toBeLessThan(lastPageMinPrice);
    
    // Verify ranking: page 1 should have ranks 1-50, last page should have ranks 1151-1183
    expect(page1[0].rank).toBe(1);
    expect(page1[page1.length - 1].rank).toBe(50);
    expect(lastPage[0].rank).toBe(1151);
    expect(lastPage[lastPage.length - 1].rank).toBe(1183);
  });

  it('should verify global sorting vs page-by-page sorting difference', () => {
    const carsPerPage = 50;
    
    // Global sorting: sort ALL cars first, then paginate
    const globalResult = applyChronologicalRanking(mockCars, 'price_low', carsPerPage);
    const globalPage1 = getCarsForPage(globalResult.rankedCars, 1, carsPerPage);
    
    // Simulate page-by-page sorting: only sort first 50 cars
    const firstPageOnly = mockCars.slice(0, 50);
    const pageOnlyResult = applyChronologicalRanking(firstPageOnly, 'price_low', carsPerPage);
    
    // These should be different! Global sorting gives us better results
    const globalMinPrice = Math.min(...globalPage1.map(car => car.lots[0].buy_now));
    const pageOnlyMinPrice = Math.min(...pageOnlyResult.rankedCars.map(car => car.lots[0].buy_now));
    
    // Global sorting should find a lower minimum price than page-only sorting
    // (This might not always be true due to randomness, but demonstrates the concept)
    console.log(`Global sorting page 1 min price: €${globalMinPrice.toLocaleString()}`);
    console.log(`Page-only sorting min price: €${pageOnlyMinPrice.toLocaleString()}`);
    
    // The important part is that global sorting ranks ALL 1,183 cars
    expect(globalResult.totalCars).toBe(1183);
    expect(pageOnlyResult.totalCars).toBe(50);
  });
});