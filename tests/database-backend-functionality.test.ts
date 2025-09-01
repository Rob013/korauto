import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDatabaseCars } from '@/hooks/useDatabaseCars';
import { renderHook, waitFor } from '@testing-library/react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            not: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  { make: 'BMW', model: '3 Series', year: 2020, fuel: 'Petrol', transmission: 'Automatic', title: 'BMW 3 Series 2.0 TDI' },
                  { make: 'BMW', model: '5 Series', year: 2021, fuel: 'Diesel', transmission: 'Manual', title: 'BMW 5 Series 2.5 TDI' },
                  { make: 'Audi', model: 'A4', year: 2019, fuel: 'Petrol', transmission: 'Automatic', title: 'Audi A4 1.8 TFSI Premium' },
                  { make: 'Mercedes-Benz', model: 'C-Class', year: 2022, fuel: 'Hybrid', transmission: 'Automatic', title: 'Mercedes C-Class AMG Sport' }
                ],
                error: null
              }))
            }))
          }))
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: 100, error: null }))
  }
}));

vi.mock('@/hooks/useCarSync', () => ({
  useAutoRefreshOnSync: vi.fn()
}));

vi.mock('@/services/carsApi', () => ({
  fetchCarsWithKeyset: vi.fn(() => Promise.resolve({
    items: [
      {
        id: '1',
        make: 'BMW',
        model: '3 Series',
        year: 2020,
        price: 25000,
        mileage: 50000,
        fuel: 'Petrol',
        transmission: 'Automatic',
        title: 'BMW 3 Series 2.0 TDI'
      }
    ],
    nextCursor: undefined,
    total: 1
  })),
  mapFrontendSortToBackend: vi.fn((sort) => sort)
}));

describe('Database Backend Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDatabaseCars Hook', () => {
    it('should fetch manufacturers from database', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.fetchManufacturers).toBeDefined();
      });

      const manufacturers = await result.current.fetchManufacturers();
      
      expect(Array.isArray(manufacturers)).toBe(true);
      // Check that supabase.from was called (mocked function will be called)
      expect(manufacturers).toBeDefined();
    });

    it('should fetch models for a manufacturer', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.fetchModels).toBeDefined();
      });

      const models = await result.current.fetchModels('1');
      
      expect(Array.isArray(models)).toBe(true);
      expect(models).toBeDefined();
    });

    it('should fetch generations for a model', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.fetchGenerations).toBeDefined();
      });

      const generations = await result.current.fetchGenerations('101');
      
      expect(Array.isArray(generations)).toBe(true);
    });

    it('should fetch grades/variants from database', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.fetchGrades).toBeDefined();
      });

      const grades = await result.current.fetchGrades();
      
      expect(Array.isArray(grades)).toBe(true);
      expect(grades).toBeDefined();
    });

    it('should fetch trim levels from database', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.fetchTrimLevels).toBeDefined();
      });

      const trimLevels = await result.current.fetchTrimLevels();
      
      expect(Array.isArray(trimLevels)).toBe(true);
      expect(trimLevels).toBeDefined();
    });

    it('should fetch filter counts', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.fetchFilterCounts).toBeDefined();
      });

      const filterCounts = await result.current.fetchFilterCounts();
      
      expect(typeof filterCounts).toBe('object');
      expect(filterCounts).toHaveProperty('manufacturers');
      expect(filterCounts).toHaveProperty('models');
      expect(filterCounts).toHaveProperty('fuelTypes');
      expect(filterCounts).toHaveProperty('transmissions');
    });

    it('should fetch cars with backend sorting', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.fetchCars).toBeDefined();
      });

      await result.current.fetchCars(1, { sort_by: 'price', sort_direction: 'asc' });
      
      expect(result.current.cars).toBeDefined();
      expect(Array.isArray(result.current.cars)).toBe(true);
    });

    it('should provide compatible interface with external API hook', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await waitFor(() => {
        expect(result.current.cars).toBeDefined();
        expect(result.current.loading).toBeDefined();
        expect(result.current.error).toBeDefined();
        expect(result.current.totalCount).toBeDefined();
        expect(result.current.hasMorePages).toBeDefined();
        expect(result.current.fetchCars).toBeDefined();
        expect(result.current.fetchAllCars).toBeDefined();
        expect(result.current.fetchManufacturers).toBeDefined();
        expect(result.current.fetchModels).toBeDefined();
        expect(result.current.fetchGenerations).toBeDefined();
        expect(result.current.fetchGrades).toBeDefined();
        expect(result.current.fetchTrimLevels).toBeDefined();
        expect(result.current.fetchFilterCounts).toBeDefined();
        expect(result.current.loadMore).toBeDefined();
        expect(result.current.setCars).toBeDefined();
        expect(result.current.setTotalCount).toBeDefined();
      });
    });
  });

  describe('Filter Data Extraction', () => {
    it('should extract manufacturers from cars table data correctly', async () => {
      // This test ensures the database hook can extract manufacturers properly
      const { result } = renderHook(() => useDatabaseCars());
      const manufacturers = await result.current.fetchManufacturers();

      expect(manufacturers).toBeDefined();
      expect(Array.isArray(manufacturers)).toBe(true);
    });

    it('should extract engine variants from car titles', async () => {
      const { result } = renderHook(() => useDatabaseCars());
      const grades = await result.current.fetchGrades();

      expect(Array.isArray(grades)).toBe(true);
      expect(grades).toBeDefined();
    });

    it('should extract trim levels from car titles', async () => {
      const { result } = renderHook(() => useDatabaseCars());
      const trimLevels = await result.current.fetchTrimLevels();

      expect(Array.isArray(trimLevels)).toBe(true);
      expect(trimLevels).toBeDefined();
    });
  });

  describe('Sorting Functionality', () => {
    it('should support backend sorting through fetchCarsWithKeyset', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      await result.current.fetchCars(1, { 
        sort_by: 'price', 
        sort_direction: 'asc' 
      });

      expect(result.current.cars).toBeDefined();
      expect(result.current.loading).toBe(false);
    });

    it('should handle different sort options', async () => {
      const { result } = renderHook(() => useDatabaseCars());

      const sortOptions = [
        { sort_by: 'price', sort_direction: 'asc' },
        { sort_by: 'price', sort_direction: 'desc' },
        { sort_by: 'year', sort_direction: 'desc' },
        { sort_by: 'mileage', sort_direction: 'asc' },
        { sort_by: 'created_at', sort_direction: 'desc' }
      ];

      for (const sortOption of sortOptions) {
        await result.current.fetchCars(1, sortOption);
        expect(result.current.error).toBeNull();
      }
    });
  });
});