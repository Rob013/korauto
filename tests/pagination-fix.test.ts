import { describe, it, expect } from 'vitest';
import { mockFetchCars, generateMockCars } from '@/utils/mockCarsData';

describe('Pagination Fix', () => {
  it('should return different cars for different pages', async () => {
    // Test pagination with multiple pages
    const page1Result = await mockFetchCars({ page: '1', pageSize: '20' });
    const page2Result = await mockFetchCars({ page: '2', pageSize: '20' });
    const page3Result = await mockFetchCars({ page: '3', pageSize: '20' });
    
    // All pages should have cars
    expect(page1Result.cars.length).toBe(20);
    expect(page2Result.cars.length).toBe(20);
    expect(page3Result.cars.length).toBe(20);
    
    // Different pages should have different cars
    expect(page1Result.cars[0].id).not.toBe(page2Result.cars[0].id);
    expect(page2Result.cars[0].id).not.toBe(page3Result.cars[0].id);
    
    // All should have same total and pages info
    expect(page1Result.total).toBe(page2Result.total);
    expect(page1Result.totalPages).toBe(page2Result.totalPages);
    expect(page1Result.totalPages).toBeGreaterThan(3);
  });

  it('should generate deterministic data with seeded random', () => {
    // Generate same cars multiple times - should be identical
    const cars1 = generateMockCars(10, 1);
    const cars2 = generateMockCars(10, 1);
    
    expect(cars1).toEqual(cars2);
    expect(cars1[0].make).toBe(cars2[0].make);
    expect(cars1[0].model).toBe(cars2[0].model);
    expect(cars1[0].price).toBe(cars2[0].price);
  });

  it('should provide consistent results across multiple calls', async () => {
    // Call same page multiple times - should return same data
    const call1 = await mockFetchCars({ page: '2', pageSize: '15' });
    const call2 = await mockFetchCars({ page: '2', pageSize: '15' });
    
    expect(call1.cars).toEqual(call2.cars);
    expect(call1.total).toBe(call2.total);
  });

  it('should handle edge cases properly', async () => {
    // First get the total pages to know what page to test
    const sampleResult = await mockFetchCars({ page: '1', pageSize: '20' });
    const totalPages = sampleResult.totalPages;
    
    // Test page beyond available data
    const beyondLastPage = totalPages + 1;
    const lastPageResult = await mockFetchCars({ page: beyondLastPage.toString(), pageSize: '20' });
    
    // Should handle pages beyond available data gracefully
    expect(lastPageResult.cars.length).toBe(0);
    expect(lastPageResult.hasMore).toBe(false);
    
    // Test very large page size
    const bigPageResult = await mockFetchCars({ page: '1', pageSize: '1000' });
    expect(bigPageResult.cars.length).toBeLessThanOrEqual(1000);
  });
});