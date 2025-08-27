/**
 * Large Dataset Global Sorting Test
 * Tests the problem statement scenario: 1000+ cars with various filters
 */

import { describe, it, expect } from 'vitest';
import { applyChronologicalRanking, getCarsForPage, validateChronologicalRanking } from '@/utils/chronologicalRanking';

// Generate test data for various scenarios
const generateMockCars = (count: number, brands: string[] = ['Audi', 'BMW', 'Mercedes']) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `car-${i + 1}`,
    manufacturer: { name: brands[i % brands.length] },
    model: { name: i % 2 === 0 ? 'A4' : 'A6' },
    year: 2015 + (i % 10), // Years 2015-2024
    lots: [{
      buy_now: Math.floor(Math.random() * 50000) + 15000, // Random prices 15k-65k EUR
      odometer: { km: Math.floor(Math.random() * 150000) + 20000 }
    }],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

describe('Large Dataset Global Sorting - Problem Statement', () => {
  it('should handle 1000+ cars with proper global ranking across all pages', () => {
    // Problem statement scenario: 1000+ cars
    const largeCarsDataset = generateMockCars(1000);
    
    // Apply global sorting (cheapest first)
    const globalSortingResult = applyChronologicalRanking(largeCarsDataset, 'price_low', 50);
    
    console.log(`📊 Testing ${globalSortingResult.totalCars} cars across ${globalSortingResult.totalPages} pages`);
    
    // Validate basic structure
    expect(globalSortingResult.totalCars).toBe(1000);
    expect(globalSortingResult.totalPages).toBe(20); // 1000 ÷ 50 = 20 pages
    expect(globalSortingResult.carsPerPage).toBe(50);
    
    // Validate that ranking is sequential and global
    const isSequential = globalSortingResult.rankedCars.every((car, index) => car.rank === index + 1);
    expect(isSequential).toBe(true);
    
    // Test price progression across pages (cheapest to most expensive)
    for (let pageNum = 1; pageNum < globalSortingResult.totalPages; pageNum++) {
      const currentPageCars = getCarsForPage(globalSortingResult.rankedCars, pageNum, 50);
      const nextPageCars = getCarsForPage(globalSortingResult.rankedCars, pageNum + 1, 50);
      
      const currentPageMaxPrice = Math.max(...currentPageCars.map(car => car.lots[0].buy_now));
      const nextPageMinPrice = Math.min(...nextPageCars.map(car => car.lots[0].buy_now));
      
      // Maximum price on current page should be ≤ minimum price on next page
      expect(currentPageMaxPrice).toBeLessThanOrEqual(nextPageMinPrice);
    }
    
    console.log('✅ All 1000 cars properly ranked globally across 20 pages');
  });

  it('should work correctly with brand filters', () => {
    // Simulate filtered dataset for specific brand (e.g., "all Audi cars")
    const allCars = generateMockCars(500, ['Audi', 'BMW', 'Mercedes']);
    const audiCarsOnly = allCars.filter(car => car.manufacturer.name === 'Audi');
    
    console.log(`🚗 Testing brand filter: ${audiCarsOnly.length} Audi cars from ${allCars.length} total`);
    
    // Apply global sorting to filtered dataset
    const globalSortingResult = applyChronologicalRanking(audiCarsOnly, 'price_low', 50);
    
    // Validate all cars are Audi
    const allAreAudi = globalSortingResult.rankedCars.every(car => car.manufacturer.name === 'Audi');
    expect(allAreAudi).toBe(true);
    
    // Validate proper ranking within filtered set
    const isValid = validateChronologicalRanking(globalSortingResult.rankedCars, 'price_low');
    expect(isValid).toBe(true);
    
    // Test that filtering maintains global sort order
    for (let pageNum = 1; pageNum < Math.min(5, globalSortingResult.totalPages); pageNum++) {
      const pageData = getCarsForPage(globalSortingResult.rankedCars, pageNum, 50);
      
      // Verify each car has correct rank
      pageData.forEach((car, index) => {
        const expectedRank = (pageNum - 1) * 50 + index + 1;
        expect(car.rank).toBe(expectedRank);
      });
    }
    
    console.log(`✅ Brand filtering with global sorting works for ${audiCarsOnly.length} cars`);
  });

  it('should handle edge case with exactly threshold cars', () => {
    // Test with exactly 30 cars (threshold for global sorting)
    const thresholdDataset = generateMockCars(30);
    const globalSortingResult = applyChronologicalRanking(thresholdDataset, 'price_low', 50);
    
    expect(globalSortingResult.totalCars).toBe(30);
    expect(globalSortingResult.totalPages).toBe(1);
    
    // Should still work correctly even at threshold
    const isValid = validateChronologicalRanking(globalSortingResult.rankedCars, 'price_low');
    expect(isValid).toBe(true);
    
    console.log('✅ Threshold edge case (30 cars) handled correctly');
  });

  it('should verify unshown cars are properly ranked', () => {
    // Problem statement mentions "check well all filtered cars shown and unshown"
    const totalCars = generateMockCars(300); // 6 pages worth
    const globalSortingResult = applyChronologicalRanking(totalCars, 'price_low', 50);
    
    // Get cars from different pages (shown vs unshown from user perspective)
    const page1Cars = getCarsForPage(globalSortingResult.rankedCars, 1, 50); // Typically shown first
    const page4Cars = getCarsForPage(globalSortingResult.rankedCars, 4, 50); // Typically unshown initially
    const lastPageCars = getCarsForPage(globalSortingResult.rankedCars, 6, 50); // Definitely unshown initially
    
    // Verify that unshown cars (later pages) are more expensive than shown cars (earlier pages)
    const page1MaxPrice = Math.max(...page1Cars.map(car => car.lots[0].buy_now));
    const page4MinPrice = Math.min(...page4Cars.map(car => car.lots[0].buy_now));
    const lastPageMinPrice = Math.min(...lastPageCars.map(car => car.lots[0].buy_now));
    
    expect(page1MaxPrice).toBeLessThanOrEqual(page4MinPrice);
    expect(page1MaxPrice).toBeLessThan(lastPageMinPrice);
    
    // Verify that ALL cars (shown and unshown) have been properly ranked
    const allRanksSequential = globalSortingResult.rankedCars.every((car, index) => car.rank === index + 1);
    expect(allRanksSequential).toBe(true);
    
    console.log(`✅ All cars (shown and unshown) properly ranked: Page 1 max €${page1MaxPrice.toLocaleString()} < Page 4 min €${page4MinPrice.toLocaleString()}`);
  });

  it('should handle multiple sort options globally', () => {
    const cars = generateMockCars(200);
    
    // Test different sort options
    const sortOptions = ['price_low', 'price_high', 'year_desc', 'year_asc'] as const;
    
    sortOptions.forEach(sortOption => {
      const result = applyChronologicalRanking(cars, sortOption, 50);
      
      // Each sort should be valid
      const isValid = validateChronologicalRanking(result.rankedCars, sortOption);
      expect(isValid).toBe(true);
      
      // Rankings should be sequential
      const isSequential = result.rankedCars.every((car, index) => car.rank === index + 1);
      expect(isSequential).toBe(true);
      
      console.log(`✅ Sort option "${sortOption}" works globally for ${cars.length} cars`);
    });
  });
});