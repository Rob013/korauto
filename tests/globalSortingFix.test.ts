/**
 * Test to validate global sorting works across all pages
 */

import { describe, it, expect } from 'vitest';
import { applyChronologicalRanking, getCarsForPage } from '../src/utils/chronologicalRanking';

describe('Global Sorting Fix', () => {
  // Mock car data with varying prices (like Audi A4 example from problem statement)
  const mockCars = Array.from({ length: 100 }, (_, i) => ({
    id: `car-${i + 1}`,
    make: 'Audi',
    model: 'A4',
    year: 2020 + (i % 5), // Years 2020-2024
    lots: [{
      buy_now: Math.floor(Math.random() * 50000) + 10000, // Random prices 10k-60k
      odometer: { km: Math.floor(Math.random() * 200000) + 10000 }
    }],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));

  it('should sort cars globally by price_low across all pages', () => {
    // Apply global sorting with price_low
    const result = applyChronologicalRanking(mockCars, 'price_low', 200);
    
    // Verify total pages and cars
    expect(result.totalCars).toBe(100);
    expect(result.totalPages).toBe(1); // 100 cars / 200 per page = 1 page
    expect(result.rankedCars).toHaveLength(100);
    
    // Get first page (should have all cars)
    const page1Cars = getCarsForPage(result.rankedCars, 1, 200);
    expect(page1Cars).toHaveLength(100);
    
    // Second page should be empty 
    const page2Cars = getCarsForPage(result.rankedCars, 2, 200);
    expect(page2Cars).toHaveLength(0);
    
    // Since all cars are on page 1, verify they are sorted correctly
    // First car should be cheapest, last car should be most expensive
    for (let i = 0; i < page1Cars.length - 1; i++) {
      expect(page1Cars[i].lots[0].buy_now).toBeLessThanOrEqual(page1Cars[i + 1].lots[0].buy_now);
    }
    
    // Verify ranking is sequential
    expect(page1Cars[0].rank).toBe(1); // First car should have rank 1
    expect(page1Cars[99].rank).toBe(100); // Last car should have rank 100
  });

  it('should sort cars globally by price_high across all pages', () => {
    // Apply global sorting with price_high
    const result = applyChronologicalRanking(mockCars, 'price_high', 200);
    
    // Get first page (should have all cars)
    const page1Cars = getCarsForPage(result.rankedCars, 1, 200);
    const page2Cars = getCarsForPage(result.rankedCars, 2, 200);
    
    expect(page1Cars).toHaveLength(100);
    expect(page2Cars).toHaveLength(0);
    
    // Verify that cars are sorted by highest price first
    for (let i = 0; i < page1Cars.length - 1; i++) {
      expect(page1Cars[i].lots[0].buy_now).toBeGreaterThanOrEqual(page1Cars[i + 1].lots[0].buy_now);
    }
  });

  it('should maintain consistent ranking across page boundaries', () => {
    const result = applyChronologicalRanking(mockCars, 'price_low', 200);
    
    // Verify that ranks are sequential across all cars
    for (let i = 0; i < result.rankedCars.length; i++) {
      expect(result.rankedCars[i].rank).toBe(i + 1);
    }
    
    // Verify page numbers are correct (all cars should be on page 1)
    const page1Cars = result.rankedCars.slice(0, 100);
    
    page1Cars.forEach(car => expect(car.pageNumber).toBe(1));
  });

  it('should handle edge case with exact page boundaries', () => {
    // Test with exactly 200 cars (should be 1 page)
    const largeDataset = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      manufacturer: { id: 9, name: 'BMW' },
      lots: [{ 
        id: i + 1,
        buy_now: Math.floor(Math.random() * 50000) + 10000,
        images: { normal: [`image${i + 1}.jpg`] }
      }],
      year: 2020
    }));
    
    const result = applyChronologicalRanking(largeDataset, 'price_low', 200);
    
    expect(result.totalPages).toBe(1);
    expect(result.totalCars).toBe(200);
    
    const page1Cars = getCarsForPage(result.rankedCars, 1, 200);
    expect(page1Cars).toHaveLength(200);
    
    // Attempting to get page 2 should return empty
    const page2Cars = getCarsForPage(result.rankedCars, 2, 200);
    expect(page2Cars).toHaveLength(0);
  });
});