import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client before importing the service
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

import { fetchCarsWithKeyset, SortOption } from '@/services/carsApi';
import { supabase } from '@/integrations/supabase/client';

// Access the mocked supabase
const mockSupabase = supabase as any;

describe('Cars API - Global Sorting & Keyset Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCarsWithKeyset', () => {
    it('should fetch cars with price ascending order across multiple pages', async () => {
      const mockCars = [
        { id: 'car1', price_cents: 1500000, price: 15000, make: 'Toyota', model: 'Camry', year: 2020 },
        { id: 'car2', price_cents: 1600000, price: 16000, make: 'Honda', model: 'Civic', year: 2021 },
        { id: 'car3', price_cents: 1700000, price: 17000, make: 'BMW', model: '3 Series', year: 2022 }
      ];

      // Mock count response
      mockSupabase.rpc.mockResolvedValueOnce({ data: 100, error: null });
      // Mock cars response  
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCars, error: null });

      const result = await fetchCarsWithKeyset({
        sort: 'price_asc',
        limit: 3
      });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(100);
      expect(result.nextCursor).toBeDefined();
      
      // Verify prices are in ascending order
      const prices = result.items.map(car => car.price);
      expect(prices).toEqual([15000, 16000, 17000]);

      // Verify RPC calls
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_filtered_count', { p_filters: {} });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_keyset_page', {
        p_filters: {},
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 3
      });
    });

    it('should ensure stable ordering with equal prices via id ASC tie-break', async () => {
      const mockCars = [
        { id: 'car_a', price_cents: 1500000, price: 15000, make: 'Toyota', model: 'Camry', year: 2020 },
        { id: 'car_b', price_cents: 1500000, price: 15000, make: 'Honda', model: 'Civic', year: 2021 },
        { id: 'car_c', price_cents: 1500000, price: 15000, make: 'BMW', model: '3 Series', year: 2022 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCars, error: null });

      const result = await fetchCarsWithKeyset({
        sort: 'price_asc',
        limit: 3
      });

      // Verify deterministic ordering by ID when prices are equal
      const ids = result.items.map(car => car.id);
      expect(ids).toEqual(['car_a', 'car_b', 'car_c']);
    });

    it('should validate cursor round-trip without duplicates or skips', async () => {
      // First page
      const page1Cars = [
        { id: 'car1', price_cents: 1500000, price: 15000, make: 'Toyota', model: 'Camry', year: 2020 },
        { id: 'car2', price_cents: 1600000, price: 16000, make: 'Honda', model: 'Civic', year: 2021 }
      ];

      // Second page 
      const page2Cars = [
        { id: 'car3', price_cents: 1700000, price: 17000, make: 'BMW', model: '3 Series', year: 2022 },
        { id: 'car4', price_cents: 1800000, price: 18000, make: 'Audi', model: 'A4', year: 2023 }
      ];

      // Mock first page request
      mockSupabase.rpc.mockResolvedValueOnce({ data: 4, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: page1Cars, error: null });

      const page1Result = await fetchCarsWithKeyset({
        sort: 'price_asc',
        limit: 2
      });

      expect(page1Result.items).toHaveLength(2);
      expect(page1Result.nextCursor).toBeDefined();

      // Mock second page request using cursor
      mockSupabase.rpc.mockResolvedValueOnce({ data: 4, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: page2Cars, error: null });

      const page2Result = await fetchCarsWithKeyset({
        sort: 'price_asc',
        limit: 2,
        cursor: page1Result.nextCursor
      });

      expect(page2Result.items).toHaveLength(2);

      // Verify no duplicates between pages
      const page1Ids = page1Result.items.map(car => car.id);
      const page2Ids = page2Result.items.map(car => car.id);
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);

      // Verify ascending order across pages
      const lastPage1Price = page1Result.items[page1Result.items.length - 1].price;
      const firstPage2Price = page2Result.items[0].price;
      expect(firstPage2Price).toBeGreaterThanOrEqual(lastPage1Price);
    });

    it('should filter cars correctly while maintaining global sort order', async () => {
      const mockFilteredCars = [
        { id: 'car1', price_cents: 2000000, price: 20000, make: 'Toyota', model: 'Camry', year: 2020 },
        { id: 'car2', price_cents: 2500000, price: 25000, make: 'Toyota', model: 'RAV4', year: 2021 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 2, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockFilteredCars, error: null });

      const result = await fetchCarsWithKeyset({
        filters: { make: 'Toyota', priceMin: '20000', priceMax: '30000' },
        sort: 'price_asc',
        limit: 10
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);

      // Verify all cars match filter
      result.items.forEach(car => {
        expect(car.make).toBe('Toyota');
        expect(car.price).toBeGreaterThanOrEqual(20000);
        expect(car.price).toBeLessThanOrEqual(30000);
      });

      // Verify RPC was called with correct filters
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_keyset_page', {
        p_filters: { make: 'Toyota', priceMin: '20000', priceMax: '30000' },
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 10
      });
    });

    it('should handle different sort options correctly', async () => {
      const sortTests: { sort: SortOption; expectedField: string; expectedDir: string }[] = [
        { sort: 'price_asc', expectedField: 'price_cents', expectedDir: 'ASC' },
        { sort: 'price_desc', expectedField: 'price_cents', expectedDir: 'DESC' },
        { sort: 'rank_asc', expectedField: 'rank_score', expectedDir: 'ASC' },
        { sort: 'rank_desc', expectedField: 'rank_score', expectedDir: 'DESC' }
      ];

      for (const test of sortTests) {
        mockSupabase.rpc.mockResolvedValueOnce({ data: 0, error: null });
        mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

        await fetchCarsWithKeyset({ sort: test.sort });

        expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_keyset_page', {
          p_filters: {},
          p_sort_field: test.expectedField,
          p_sort_dir: test.expectedDir,
          p_cursor_value: null,
          p_cursor_id: null,
          p_limit: 24
        });

        vi.clearAllMocks();
      }
    });

    it('should not return nextCursor when no more pages available', async () => {
      const mockCars = [
        { id: 'car1', price_cents: 1500000, price: 15000, make: 'Toyota', model: 'Camry', year: 2020 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 1, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCars, error: null });

      const result = await fetchCarsWithKeyset({
        sort: 'price_asc',
        limit: 24 // Limit is larger than result set
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle search filters correctly', async () => {
      const mockCars = [
        { id: 'car1', price_cents: 1500000, price: 15000, make: 'Toyota', model: 'Camry', year: 2020 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 1, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCars, error: null });

      await fetchCarsWithKeyset({
        filters: { search: 'Toyota' },
        sort: 'price_asc'
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_keyset_page', {
        p_filters: { search: 'Toyota' },
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 24
      });
    });

    it('should handle API errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

      await expect(fetchCarsWithKeyset({})).rejects.toThrow();
    });
  });

  describe('Cursor encoding/decoding', () => {
    it('should properly encode and decode cursor values', async () => {
      const mockCars = [
        { id: 'car1', price_cents: 1500000, price: 15000, make: 'Toyota', model: 'Camry', year: 2020 },
        { id: 'car2', price_cents: 1600000, price: 16000, make: 'Honda', model: 'Civic', year: 2021 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 10, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCars, error: null });

      const result = await fetchCarsWithKeyset({
        sort: 'price_asc',
        limit: 2
      });

      expect(result.nextCursor).toBeDefined();
      
      // Verify cursor can be decoded
      const decoded = atob(result.nextCursor!);
      expect(decoded).toContain('|');
      
      const [value, id] = decoded.split('|');
      expect(value).toBe('1600000'); // price_cents of last item
      expect(id).toBe('car2'); // id of last item
    });
  });
});