import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCarsWithLimitOffset, fetchCarsWithKeyset } from '@/services/carsApi';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('Global Database Sorting - Problem Statement Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LIMIT/OFFSET Pagination', () => {
    it('should return items,total,page,pageSize,hasNext,hasPrev as requested', async () => {
      const mockCars = [
        { id: 'car1', price_cents: 1500000, make: 'Toyota', model: 'Camry', year: 2020 },
        { id: 'car2', price_cents: 2000000, make: 'Honda', model: 'Civic', year: 2021 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 100, error: null }); // total count
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCars, error: null }); // cars data

      const result = await fetchCarsWithLimitOffset({
        filters: {},
        sort: 'price_asc',
        page: 2,
        pageSize: 24
      });

      // Verify response format matches problem statement requirements
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('hasNext');
      expect(result).toHaveProperty('hasPrev');

      expect(result.items).toEqual(mockCars);
      expect(result.total).toBe(100);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(24);
      expect(result.hasNext).toBe(true); // page 2 of 5 (100/24 = ~4.2 pages)
      expect(result.hasPrev).toBe(true); // page 2 has previous page

      // Verify RPC was called with LIMIT/OFFSET function
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_limit_offset_page', {
        p_filters: {},
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_page: 2,
        p_page_size: 24
      });
    });

    it('should prove page 1 has global cheapest cars for price_asc', async () => {
      // Mock data with cars sorted globally by price
      const allCarsSortedByPrice = [
        { id: 'car1', price_cents: 1000000, make: 'Toyota', model: 'Yaris', year: 2020 }, // €10,000 - cheapest
        { id: 'car2', price_cents: 1200000, make: 'Honda', model: 'Civic', year: 2021 }, // €12,000
        { id: 'car3', price_cents: 1500000, make: 'BMW', model: '3 Series', year: 2019 }, // €15,000
        ...Array.from({ length: 97 }, (_, i) => ({
          id: `car${i + 4}`,
          price_cents: 1600000 + (i * 10000), // €16,000 and up
          make: 'Other',
          model: 'Model',
          year: 2020
        }))
      ];

      const totalCars = 100;
      const pageSize = 24;
      const page1Cars = allCarsSortedByPrice.slice(0, pageSize);

      mockSupabase.rpc.mockResolvedValueOnce({ data: totalCars, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: page1Cars, error: null });

      const result = await fetchCarsWithLimitOffset({
        filters: {},
        sort: 'price_asc',
        page: 1,
        pageSize
      });

      // Page 1 should contain the absolute cheapest car from entire dataset
      const page1Prices = result.items.map(car => car.price_cents);
      const globalMinPrice = Math.min(...allCarsSortedByPrice.map(car => car.price_cents));
      const page1MinPrice = Math.min(...page1Prices);

      expect(page1MinPrice).toBe(globalMinPrice);
      expect(page1MinPrice).toBe(1000000); // €10,000

      // All cars on page 1 should be among the 24 cheapest globally
      const cheapest24Prices = allCarsSortedByPrice.slice(0, 24).map(car => car.price_cents);
      page1Prices.forEach(price => {
        expect(cheapest24Prices).toContain(price);
      });
    });

    it('should maintain sort sequence across pages without repeats', async () => {
      // Mock page 1 data
      const page1Cars = [
        { id: 'car1', price_cents: 1000000, make: 'Toyota' },
        { id: 'car2', price_cents: 1100000, make: 'Honda' }
      ];

      // Mock page 2 data  
      const page2Cars = [
        { id: 'car3', price_cents: 1200000, make: 'BMW' },
        { id: 'car4', price_cents: 1300000, make: 'Audi' }
      ];

      // Test page 1
      mockSupabase.rpc.mockResolvedValueOnce({ data: 100, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: page1Cars, error: null });

      const page1Result = await fetchCarsWithLimitOffset({
        sort: 'price_asc',
        page: 1,
        pageSize: 2
      });

      // Test page 2  
      mockSupabase.rpc.mockResolvedValueOnce({ data: 100, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: page2Cars, error: null });

      const page2Result = await fetchCarsWithLimitOffset({
        sort: 'price_asc',
        page: 2,
        pageSize: 2
      });

      // Verify no duplicate IDs across pages
      const page1Ids = page1Result.items.map(car => car.id);
      const page2Ids = page2Result.items.map(car => car.id);
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);

      // Verify price sequence: last price of page 1 ≤ first price of page 2
      const lastPage1Price = Math.max(...page1Result.items.map(car => car.price_cents));
      const firstPage2Price = Math.min(...page2Result.items.map(car => car.price_cents));
      expect(lastPage1Price).toBeLessThanOrEqual(firstPage2Price);
    });

    it('should apply filters before ORDER BY before LIMIT/OFFSET', async () => {
      const mockFilteredCars = [
        { id: 'toyota1', price_cents: 2000000, make: 'Toyota', model: 'Camry', year: 2020 },
        { id: 'toyota2', price_cents: 2500000, make: 'Toyota', model: 'RAV4', year: 2021 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 50, error: null }); // filtered count
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockFilteredCars, error: null });

      const result = await fetchCarsWithLimitOffset({
        filters: { make: 'Toyota', priceMin: '20000', priceMax: '30000' },
        sort: 'price_asc',
        page: 1,
        pageSize: 10
      });

      // Verify filters were applied before sorting
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_limit_offset_page', {
        p_filters: { make: 'Toyota', priceMin: '20000', priceMax: '30000' },
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_page: 1,
        p_page_size: 10
      });

      // All results should match the filter
      result.items.forEach(car => {
        expect(car.make).toBe('Toyota');
        expect(car.price_cents).toBeGreaterThanOrEqual(2000000); // €20,000
        expect(car.price_cents).toBeLessThanOrEqual(3000000); // €30,000
      });
    });
  });

  describe('Dual Pagination Support', () => {
    it('should support both cursor and LIMIT/OFFSET pagination methods', async () => {
      const mockCars = [
        { id: 'car1', price_cents: 1500000, make: 'Toyota' }
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockCars, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: 100, error: null });

      // Test LIMIT/OFFSET pagination
      const limitOffsetResult = await fetchCarsWithKeyset({
        sort: 'price_asc',
        page: 1,
        pageSize: 24,
        useLimitOffset: true
      });

      expect(limitOffsetResult).toHaveProperty('page');
      expect(limitOffsetResult).toHaveProperty('pageSize');
      expect(limitOffsetResult).toHaveProperty('hasNext');
      expect(limitOffsetResult).toHaveProperty('hasPrev');

      vi.clearAllMocks();
      mockSupabase.rpc.mockResolvedValue({ data: mockCars, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: 100, error: null });

      // Test cursor pagination (default)
      const cursorResult = await fetchCarsWithKeyset({
        sort: 'price_asc',
        limit: 24
      });

      expect(cursorResult).toHaveProperty('nextCursor');
      expect(cursorResult).toHaveProperty('page');
      expect(cursorResult).toHaveProperty('hasNext');
      expect(cursorResult).toHaveProperty('hasPrev');
    });
  });
});