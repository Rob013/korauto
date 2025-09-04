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
    const result = applyChronologicalRanking(mockCars, 'price_low', 50);
    
    // Verify total pages and cars
    expect(result.totalCars).toBe(100);
    expect(result.totalPages).toBe(2); // 100 cars / 50 per page = 2 pages
    expect(result.rankedCars).toHaveLength(100);
    
    // Get first page (should have cheapest cars)
    const page1Cars = getCarsForPage(result.rankedCars, 1, 50);
    expect(page1Cars).toHaveLength(50);
    
    // Get second page 
    const page2Cars = getCarsForPage(result.rankedCars, 2, 50);
    expect(page2Cars).toHaveLength(50);
    
    // Verify that all cars on page 1 are cheaper than all cars on page 2
    const page1MaxPrice = Math.max(...page1Cars.map(car => car.lots[0].buy_now));
    const page2MinPrice = Math.min(...page2Cars.map(car => car.lots[0].buy_now));
    
    expect(page1MaxPrice).toBeLessThanOrEqual(page2MinPrice);
    
    // Verify ranking is sequential
    expect(page1Cars[0].rank).toBe(1); // First car should have rank 1
    expect(page1Cars[49].rank).toBe(50); // Last car on page 1 should have rank 50
    expect(page2Cars[0].rank).toBe(51); // First car on page 2 should have rank 51
    expect(page2Cars[49].rank).toBe(100); // Last car should have rank 100
  });

  it('should sort cars globally by price_high across all pages', () => {
    // Apply global sorting with price_high
    const result = applyChronologicalRanking(mockCars, 'price_high', 50);
    
    // Get first and second pages
    const page1Cars = getCarsForPage(result.rankedCars, 1, 50);
    const page2Cars = getCarsForPage(result.rankedCars, 2, 50);
    
    // Verify that all cars on page 1 are more expensive than all cars on page 2
    const page1MinPrice = Math.min(...page1Cars.map(car => car.lots[0].buy_now));
    const page2MaxPrice = Math.max(...page2Cars.map(car => car.lots[0].buy_now));
    
    expect(page1MinPrice).toBeGreaterThanOrEqual(page2MaxPrice);
  });

  it('should maintain consistent ranking across page boundaries', () => {
    const result = applyChronologicalRanking(mockCars, 'price_low', 50);
    
    // Verify that ranks are sequential across all cars
    for (let i = 0; i < result.rankedCars.length; i++) {
      expect(result.rankedCars[i].rank).toBe(i + 1);
    }
    
    // Verify page numbers are correct
    const page1Cars = result.rankedCars.slice(0, 50);
    const page2Cars = result.rankedCars.slice(50, 100);
    
    page1Cars.forEach(car => expect(car.pageNumber).toBe(1));
    page2Cars.forEach(car => expect(car.pageNumber).toBe(2));
  });

  it('should handle edge case with exact page boundaries', () => {
    // Test with exactly 50 cars (should be 1 page)
    const smallDataset = mockCars.slice(0, 50);
    const result = applyChronologicalRanking(smallDataset, 'price_low', 50);
    
    expect(result.totalPages).toBe(1);
    expect(result.totalCars).toBe(50);
    
    const page1Cars = getCarsForPage(result.rankedCars, 1, 50);
    expect(page1Cars).toHaveLength(50);
    
    // Attempting to get page 2 should return empty
    const page2Cars = getCarsForPage(result.rankedCars, 2, 50);
    expect(page2Cars).toHaveLength(0);
  });
});