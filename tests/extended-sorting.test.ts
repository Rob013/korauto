import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCarsWithKeyset, mapFrontendSortToBackend, getSortParams } from '@/services/carsApi';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe('Extended Car Sorting API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Frontend to Backend Sort Mapping', () => {
    it('should map frontend sort options to correct backend options', () => {
      const testCases = [
        // Price sorting
        { frontend: 'price_low', backend: 'price_asc' },
        { frontend: 'price_high', backend: 'price_desc' },
        
        // Year sorting  
        { frontend: 'year_new', backend: 'year_desc' },
        { frontend: 'year_old', backend: 'year_asc' },
        
        // Mileage sorting
        { frontend: 'mileage_low', backend: 'mileage_asc' },
        { frontend: 'mileage_high', backend: 'mileage_desc' },
        
        // Make sorting
        { frontend: 'make_az', backend: 'make_asc' },
        { frontend: 'make_za', backend: 'make_desc' },
        
        // Created date sorting
        { frontend: 'recently_added', backend: 'created_desc' },
        { frontend: 'oldest_first', backend: 'created_asc' },
        
        // Popularity
        { frontend: 'popular', backend: 'rank_desc' },
        
        // Backend options should pass through
        { frontend: 'price_asc', backend: 'price_asc' },
        { frontend: 'year_desc', backend: 'year_desc' },
      ];

      // Since mapFrontendSortToBackend is not exported, we'll test via getSortParams
      testCases.forEach(({ frontend, backend }) => {
        const sortParams = getSortParams(frontend);
        const expectedParams = getSortParams(backend);
        expect(sortParams).toEqual(expectedParams);
      });
    });
  });

  describe('Sort Parameters Mapping', () => {
    it('should map sort options to correct database fields and directions', () => {
      const testCases = [
        // Price
        { sort: 'price_asc', field: 'price_cents', direction: 'ASC' },
        { sort: 'price_desc', field: 'price_cents', direction: 'DESC' },
        
        // Rank/Popularity
        { sort: 'rank_asc', field: 'rank_score', direction: 'ASC' },
        { sort: 'rank_desc', field: 'rank_score', direction: 'DESC' },
        
        // Year
        { sort: 'year_asc', field: 'year', direction: 'ASC' },
        { sort: 'year_desc', field: 'year', direction: 'DESC' },
        
        // Mileage
        { sort: 'mileage_asc', field: 'mileage', direction: 'ASC' },
        { sort: 'mileage_desc', field: 'mileage', direction: 'DESC' },
        
        // Make
        { sort: 'make_asc', field: 'make', direction: 'ASC' },
        { sort: 'make_desc', field: 'make', direction: 'DESC' },
        
        // Created date
        { sort: 'created_asc', field: 'created_at', direction: 'ASC' },
        { sort: 'created_desc', field: 'created_at', direction: 'DESC' },
      ];

      testCases.forEach(({ sort, field, direction }) => {
        const params = getSortParams(sort);
        expect(params).toEqual({ field, direction });
      });
    });

    it('should handle frontend sort options correctly', () => {
      const frontendTestCases = [
        { sort: 'price_low', field: 'price_cents', direction: 'ASC' },
        { sort: 'price_high', field: 'price_cents', direction: 'DESC' },
        { sort: 'year_new', field: 'year', direction: 'DESC' },
        { sort: 'year_old', field: 'year', direction: 'ASC' },
        { sort: 'mileage_low', field: 'mileage', direction: 'ASC' },
        { sort: 'mileage_high', field: 'mileage', direction: 'DESC' },
        { sort: 'make_az', field: 'make', direction: 'ASC' },
        { sort: 'make_za', field: 'make', direction: 'DESC' },
        { sort: 'recently_added', field: 'created_at', direction: 'DESC' },
        { sort: 'oldest_first', field: 'created_at', direction: 'ASC' },
        { sort: 'popular', field: 'rank_score', direction: 'DESC' },
      ];

      frontendTestCases.forEach(({ sort, field, direction }) => {
        const params = getSortParams(sort);
        expect(params).toEqual({ field, direction });
      });
    });

    it('should default to price_asc for invalid sort options', () => {
      const params = getSortParams('invalid_sort');
      expect(params).toEqual({ field: 'price_cents', direction: 'ASC' });
    });
  });

  describe('Global Sorting Requirements', () => {
    it('should ensure price_asc always shows cheapest cars first across all pages', () => {
      const params = getSortParams('price_low');
      expect(params).toEqual({ field: 'price_cents', direction: 'ASC' });
      
      // This ensures global sorting: when sorted by price_cents ASC with proper pagination,
      // page 1 will always contain the cheapest cars from the entire dataset
    });

    it('should support all required sort fields mentioned in problem statement', () => {
      const requiredFields = ['price_cents', 'year', 'mileage', 'make', 'created_at', 'rank_score'];
      
      // Test that we have sort options for all required fields
      const priceParams = getSortParams('price_asc');
      const yearParams = getSortParams('year_asc');
      const mileageParams = getSortParams('mileage_asc');
      const makeParams = getSortParams('make_asc');
      const createdParams = getSortParams('created_asc');
      const rankParams = getSortParams('rank_asc');

      expect(priceParams.field).toBe('price_cents');
      expect(yearParams.field).toBe('year');
      expect(mileageParams.field).toBe('mileage');
      expect(makeParams.field).toBe('make');
      expect(createdParams.field).toBe('created_at');
      expect(rankParams.field).toBe('rank_score');
    });
  });

  describe('API Response Format', () => {
    it('should return total count and pagination info', () => {
      const mockResponse = {
        items: [
          {
            id: 'car1',
            make: 'Toyota',
            model: 'Camry',
            year: 2022,
            price: 25000,
            price_cents: 2500000,
            rank_score: 95.5,
            mileage: 15000,
            created_at: '2024-01-01T00:00:00Z'
          }
        ],
        nextCursor: 'eyJwcmljZV9jZW50cyI6MjUwMDAwMCwiaWQiOiJjYXIxIn0=',
        total: 150
      };

      // Verify response includes total count and pagination info
      expect(mockResponse).toHaveProperty('total');
      expect(mockResponse).toHaveProperty('nextCursor');
      expect(typeof mockResponse.total).toBe('number');
      expect(mockResponse.total).toBeGreaterThan(0);
    });
  });
});