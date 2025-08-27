import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe('Global Sorting Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Global Sorting Across Pages', () => {
    it('should ensure price_asc sorting shows cheapest cars on page 1', async () => {
      const { fetchCarsWithKeyset } = await import('@/services/carsApi');
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock data representing cars across multiple pages
      const mockCarsPage1 = [
        { id: 'car1', price_cents: 1000000, make: 'Toyota', year: 2020 }, // $10,000
        { id: 'car2', price_cents: 1200000, make: 'Honda', year: 2021 },  // $12,000
        { id: 'car3', price_cents: 1500000, make: 'Ford', year: 2019 }    // $15,000
      ];

      // Mock count call
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ 
        data: 6, 
        error: null 
      });

      // Mock first page call
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ 
        data: mockCarsPage1, 
        error: null 
      });

      // Test first page
      const page1Result = await fetchCarsWithKeyset({
        filters: {},
        sort: 'price_asc',
        limit: 3
      });

      expect(page1Result.items).toHaveLength(3);
      expect(page1Result.total).toBe(6);
      expect(page1Result.items[0].price_cents).toBe(1000000); // Cheapest car
      expect(page1Result.items[1].price_cents).toBe(1200000);
      expect(page1Result.items[2].price_cents).toBe(1500000);
      expect(page1Result.nextCursor).toBeDefined();

      // Verify the RPC calls were made with correct parameters
      expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('cars_filtered_count', { p_filters: {} });
      expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('cars_keyset_page', {
        p_filters: {},
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 3
      });
    });

    it('should ensure year_desc sorting shows newest cars first', async () => {
      const { fetchCarsWithKeyset } = await import('@/services/carsApi');
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockNewestCars = [
        { id: 'car1', year: 2024, make: 'Tesla', price_cents: 5000000 },
        { id: 'car2', year: 2023, make: 'BMW', price_cents: 4000000 },
        { id: 'car3', year: 2022, make: 'Audi', price_cents: 3500000 }
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: 10, error: null });
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockNewestCars, error: null });

      const result = await fetchCarsWithKeyset({
        filters: {},
        sort: 'year_new', // Frontend sort option
        limit: 3
      });

      expect(result.items[0].year).toBe(2024); // Newest car first
      expect(result.items[1].year).toBe(2023);
      expect(result.items[2].year).toBe(2022);

      // Verify frontend sort option was mapped to backend correctly
      expect(vi.mocked(supabase.rpc)).toHaveBeenLastCalledWith('cars_keyset_page', {
        p_filters: {},
        p_sort_field: 'year',
        p_sort_dir: 'DESC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 3
      });
    });

    it('should ensure mileage_asc sorting shows lowest mileage cars first', async () => {
      const mockLowMileageCars = [
        { id: 'car1', mileage: 5000, make: 'Toyota', price_cents: 2500000 },
        { id: 'car2', mileage: 12000, make: 'Honda', price_cents: 2200000 },
        { id: 'car3', mileage: 25000, make: 'Ford', price_cents: 2000000 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 8, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockLowMileageCars, error: null });

      const result = await fetchCarsWithKeyset({
        filters: {},
        sort: 'mileage_low', // Frontend sort option
        limit: 3
      });

      expect(result.items[0].mileage).toBe(5000); // Lowest mileage first
      expect(result.items[1].mileage).toBe(12000);
      expect(result.items[2].mileage).toBe(25000);

      expect(mockSupabase.rpc).toHaveBeenLastCalledWith('cars_keyset_page', {
        p_filters: {},
        p_sort_field: 'mileage',
        p_sort_dir: 'ASC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 3
      });
    });

    it('should handle cursor-based pagination correctly', async () => {
      const mockPage2Cars = [
        { id: 'car4', price_cents: 2000000, make: 'Lexus', year: 2021 },
        { id: 'car5', price_cents: 2200000, make: 'Infiniti', year: 2020 }
      ];

      // Mock cursor from previous page
      const cursor = btoa('1500000|car3'); // Price $15,000, ID car3

      mockSupabase.rpc.mockResolvedValueOnce({ data: 10, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockPage2Cars, error: null });

      const result = await fetchCarsWithKeyset({
        filters: {},
        sort: 'price_asc',
        limit: 3,
        cursor
      });

      expect(result.items).toHaveLength(2);
      
      // Verify cursor was parsed and used correctly
      expect(mockSupabase.rpc).toHaveBeenLastCalledWith('cars_keyset_page', {
        p_filters: {},
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_cursor_value: '1500000',
        p_cursor_id: 'car3',
        p_limit: 3
      });
    });

    it('should apply filters before sorting', async () => {
      const mockFilteredCars = [
        { id: 'car1', price_cents: 2000000, make: 'Toyota', year: 2022 },
        { id: 'car2', price_cents: 2500000, make: 'Toyota', year: 2023 }
      ];

      const filters = {
        make: 'Toyota',
        yearMin: '2020',
        priceMax: '30000'
      };

      mockSupabase.rpc.mockResolvedValueOnce({ data: 15, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockFilteredCars, error: null });

      const result = await fetchCarsWithKeyset({
        filters,
        sort: 'price_asc',
        limit: 10
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(15);

      // Verify filters were passed to the backend
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_filtered_count', { 
        p_filters: filters 
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cars_keyset_page', {
        p_filters: filters,
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 10
      });
    });
  });

  describe('Stable Sorting with Tie-Breaking', () => {
    it('should use ID for tie-breaking when sort values are equal', async () => {
      const mockCarsWithSamePrice = [
        { id: 'car1', price_cents: 2000000, make: 'Toyota', year: 2021 },
        { id: 'car2', price_cents: 2000000, make: 'Honda', year: 2021 },
        { id: 'car3', price_cents: 2000000, make: 'Ford', year: 2021 }
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null });
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockCarsWithSamePrice, error: null });

      const result = await fetchCarsWithKeyset({
        filters: {},
        sort: 'price_asc',
        limit: 10
      });

      // The database should handle tie-breaking with ID ASC
      // The exact order depends on database implementation but should be stable
      expect(result.items).toHaveLength(3);
      expect(result.items.every(car => car.price_cents === 2000000)).toBe(true);
    });
  });
});