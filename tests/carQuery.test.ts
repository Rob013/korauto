import { describe, it, expect, vi } from 'vitest';
import { buildCarQuery } from '@/lib/carQuery';
import type { CarFilters, SortOption } from '@/store/carFilterStore';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => {
  const methods = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    or: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  };

  // Chain all methods to return the methods object
  Object.values(methods).forEach(method => {
    method.mockReturnValue(methods);
  });

  return {
    supabase: {
      from: vi.fn(() => methods)
    }
  };
});

describe('carQuery', () => {
  describe('buildCarQuery', () => {
    it('should build basic query with no filters', () => {
      const options = {
        filters: {},
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      const query = buildCarQuery(options);
      expect(query).toBeDefined();
    });

    it('should handle text search filter', () => {
      const filters: CarFilters = {
        query: 'BMW X3'
      };

      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      const query = buildCarQuery(options);
      expect(query).toBeDefined();
    });

    it('should handle exact match filters', () => {
      const filters: CarFilters = {
        make: 'BMW',
        model: 'X3',
        fuel: 'Gasoline',
        transmission: 'Automatic',
        color: 'Black',
        condition: 'Excellent'
      };

      const options = {
        filters,
        sort: { field: 'price', direction: 'asc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      const query = buildCarQuery(options);
      expect(query).toBeDefined();
    });

    it('should handle range filters', () => {
      const filters: CarFilters = {
        year: { min: 2020, max: 2024 },
        price: { min: 20000, max: 50000 },
        mileage: { min: 0, max: 100000 }
      };

      const options = {
        filters,
        sort: { field: 'year', direction: 'desc' } as SortOption,
        page: 2,
        pageSize: 10,
      };

      const query = buildCarQuery(options);
      expect(query).toBeDefined();
    });

    it('should handle partial range filters', () => {
      const filters: CarFilters = {
        year: { min: 2020 }, // Only minimum
        price: { max: 50000 }, // Only maximum
      };

      const options = {
        filters,
        sort: { field: 'mileage', direction: 'asc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      const query = buildCarQuery(options);
      expect(query).toBeDefined();
    });

    it('should handle multi-select filters', () => {
      const filters: CarFilters = {
        makes: ['BMW', 'Audi', 'Mercedes-Benz'],
        fuels: ['Gasoline', 'Diesel'],
        conditions: ['Excellent', 'Good']
      };

      const options = {
        filters,
        sort: { field: 'make', direction: 'asc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      const query = buildCarQuery(options);
      expect(query).toBeDefined();
    });

    it('should handle complex combined filters', () => {
      const filters: CarFilters = {
        query: 'luxury',
        make: 'BMW',
        year: { min: 2018, max: 2024 },
        price: { min: 30000 },
        fuels: ['Gasoline', 'Hybrid'],
        transmission: 'Automatic'
      };

      const options = {
        filters,
        sort: { field: 'price', direction: 'desc' } as SortOption,
        page: 3,
        pageSize: 15,
      };

      const query = buildCarQuery(options);
      expect(query).toBeDefined();
    });

    it('should handle different sort options', () => {
      const filters: CarFilters = {};

      // Test each sort option
      const sortOptions: SortOption[] = [
        { field: 'created_at', direction: 'desc' },
        { field: 'created_at', direction: 'asc' },
        { field: 'price', direction: 'desc' },
        { field: 'price', direction: 'asc' },
        { field: 'year', direction: 'desc' },
        { field: 'year', direction: 'asc' },
        { field: 'mileage', direction: 'desc' },
        { field: 'mileage', direction: 'asc' },
        { field: 'make', direction: 'asc' },
        { field: 'model', direction: 'asc' },
      ];

      sortOptions.forEach(sort => {
        const options = { filters, sort, page: 1, pageSize: 20 };
        const query = buildCarQuery(options);
        expect(query).toBeDefined();
      });
    });

    it('should handle pagination correctly', () => {
      const filters: CarFilters = {};
      
      // Test different page sizes and pages
      const testCases = [
        { page: 1, pageSize: 10 },
        { page: 2, pageSize: 20 },
        { page: 5, pageSize: 50 },
        { page: 10, pageSize: 100 },
      ];

      testCases.forEach(({ page, pageSize }) => {
        const options = {
          filters,
          sort: { field: 'created_at', direction: 'desc' } as SortOption,
          page,
          pageSize,
        };
        const query = buildCarQuery(options);
        expect(query).toBeDefined();
      });
    });
  });

  describe('Filter validation', () => {
    it('should handle empty filters gracefully', () => {
      const filters: CarFilters = {};
      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      expect(() => buildCarQuery(options)).not.toThrow();
    });

    it('should handle undefined values in filters', () => {
      const filters: CarFilters = {
        make: undefined,
        model: undefined,
        year: undefined,
        price: undefined,
      };

      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      expect(() => buildCarQuery(options)).not.toThrow();
    });

    it('should handle empty arrays in multi-select filters', () => {
      const filters: CarFilters = {
        makes: [],
        models: [],
        fuels: [],
      };

      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      expect(() => buildCarQuery(options)).not.toThrow();
    });

    it('should handle invalid range values', () => {
      const filters: CarFilters = {
        year: { min: undefined, max: undefined },
        price: {},
      };

      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      expect(() => buildCarQuery(options)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large page numbers', () => {
      const filters: CarFilters = {};
      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 99999,
        pageSize: 20,
      };

      expect(() => buildCarQuery(options)).not.toThrow();
    });

    it('should handle very large page sizes', () => {
      const filters: CarFilters = {};
      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 1000,
      };

      expect(() => buildCarQuery(options)).not.toThrow();
    });

    it('should handle extreme filter values', () => {
      const filters: CarFilters = {
        year: { min: 1900, max: 2100 },
        price: { min: 0, max: 999999999 },
        mileage: { min: 0, max: 999999999 },
        query: 'a'.repeat(1000), // Very long search query
      };

      const options = {
        filters,
        sort: { field: 'created_at', direction: 'desc' } as SortOption,
        page: 1,
        pageSize: 20,
      };

      expect(() => buildCarQuery(options)).not.toThrow();
    });
  });
});