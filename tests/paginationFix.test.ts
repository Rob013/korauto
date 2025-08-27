// Test to verify pagination functionality with filters
import { describe, it, expect } from 'vitest';
import { mockFetchCars } from '@/utils/mockCarsData';

describe('Pagination Fix Tests', () => {
  it('should return cars on page 2 with no filters', async () => {
    // Simulate fetching page 2 with default 20 items per page
    const filters = { page: '2', pageSize: '20' };
    const result = await mockFetchCars(filters);
    
    expect(result.cars.length).toBeGreaterThan(0);
    expect(result.page).toBe(2);
    expect(result.total).toBeGreaterThan(20); // Should have enough cars for page 2
  });

  it('should return correct pagination info with filters applied', async () => {
    // Test with brand filter applied
    const filters = { brand: 'toyota', page: '1', pageSize: '10' };
    const result = await mockFetchCars(filters);
    
    expect(result.cars.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.totalPages).toBe(Math.ceil(result.total / 10));
    expect(result.hasMore).toBe(result.page < result.totalPages);
  });

  it('should return cars on page 2 with filters applied', async () => {
    // Test with brand filter on page 2
    const filters = { brand: 'toyota', page: '2', pageSize: '5' };
    const result = await mockFetchCars(filters);
    
    // Should have cars if total Toyota cars > 5
    if (result.total > 5) {
      expect(result.cars.length).toBeGreaterThan(0);
      expect(result.page).toBe(2);
    }
  });

  it('should handle edge case where page exceeds available data', async () => {
    // Test requesting a very high page number
    const filters = { page: '999', pageSize: '20' };
    const result = await mockFetchCars(filters);
    
    expect(result.cars.length).toBe(0);
    expect(result.page).toBe(999);
    expect(result.hasMore).toBe(false);
  });

  it('should maintain correct total count across different pages', async () => {
    // Test that total count remains consistent across pages
    const filters1 = { brand: 'toyota', page: '1', pageSize: '10' };
    const filters2 = { brand: 'toyota', page: '2', pageSize: '10' };
    
    const result1 = await mockFetchCars(filters1);
    const result2 = await mockFetchCars(filters2);
    
    expect(result1.total).toBe(result2.total);
  });
});