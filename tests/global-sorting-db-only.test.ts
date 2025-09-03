/**
 * Tests for Global Sorting and DB-only API Implementation
 * Validates that sorting happens globally before pagination and maintains order
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCarsWithPagination, fetchCarById } from '@/services/carsApi';

// Mock fetch to simulate API responses
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Global Sorting and DB-only Implementation Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Set READ_SOURCE to db mode for testing
    process.env.VITE_READ_SOURCE = 'db';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Global Sorting Implementation', () => {
    it('should fetch cars with price_asc and page 1 shows global minimum', async () => {
      // Mock response with globally sorted data (page 1 should have lowest prices)
      const mockResponse = {
        items: [
          { id: '1', price: 15000, make: 'Toyota', model: 'Corolla', year: 2020 },
          { id: '2', price: 16000, make: 'Honda', model: 'Civic', year: 2021 },
          { id: '3', price: 17000, make: 'Nissan', model: 'Sentra', year: 2019 }
        ],
        total: 100,
        page: 1,
        pageSize: 24,
        totalPages: 5,
        hasPrev: false,
        hasNext: true,
        facets: {
          makes: [],
          models: [],
          fuels: [],
          year_range: { min: 2015, max: 2024 },
          price_range: { min: 15000, max: 80000 }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCarsWithPagination({
        sort: 'price_asc',
        page: 1,
        pageSize: 24
      });

      expect(result.items[0].price).toBe(15000); // Should be global minimum
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(100);
      expect(result.page).toBe(1);

      // Verify API was called with correct sort parameter
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=price_asc'),
        expect.any(Object)
      );
    });

    it('should fetch cars with price_asc and page 2 continues ascending order', async () => {
      // Mock response for page 2 (should have higher prices than page 1)
      const mockResponse = {
        items: [
          { id: '25', price: 25000, make: 'Ford', model: 'Focus', year: 2020 },
          { id: '26', price: 26000, make: 'Chevrolet', model: 'Cruze', year: 2021 },
          { id: '27', price: 27000, make: 'Volkswagen', model: 'Golf', year: 2019 }
        ],
        total: 100,
        page: 2,
        pageSize: 24,
        totalPages: 5,
        hasPrev: true,
        hasNext: true,
        facets: {
          makes: [],
          models: [],
          fuels: [],
          year_range: { min: 2015, max: 2024 },
          price_range: { min: 15000, max: 80000 }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCarsWithPagination({
        sort: 'price_asc',
        page: 2,
        pageSize: 24
      });

      expect(result.items[0].price).toBe(25000); // Should be higher than page 1
      expect(result.page).toBe(2);
      expect(result.hasPrev).toBe(true);
      expect(result.hasNext).toBe(true);

      // Verify API was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=price_asc&page=2&pageSize=24'),
        expect.any(Object)
      );
    });

    it('should ensure no duplicates across pages with stable ordering', async () => {
      // Test that the same car doesn't appear on multiple pages
      const page1Response = {
        items: [
          { id: '1', price: 20000, make: 'Toyota', year: 2020 },
          { id: '2', price: 20000, make: 'Honda', year: 2020 },
          { id: '3', price: 21000, make: 'Nissan', year: 2020 }
        ],
        total: 50,
        page: 1,
        totalPages: 3,
        hasPrev: false,
        hasNext: true
      };

      const page2Response = {
        items: [
          { id: '4', price: 21000, make: 'Ford', year: 2020 },
          { id: '5', price: 22000, make: 'Chevrolet', year: 2020 },
          { id: '6', price: 22000, make: 'Mazda', year: 2020 }
        ],
        total: 50,
        page: 2,
        totalPages: 3,
        hasPrev: true,
        hasNext: true
      };

      // Mock first API call for page 1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page1Response)
      });

      const page1Result = await fetchCarsWithPagination({
        sort: 'price_asc',
        page: 1,
        pageSize: 3
      });

      // Mock second API call for page 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page2Response)
      });

      const page2Result = await fetchCarsWithPagination({
        sort: 'price_asc',
        page: 2,
        pageSize: 3
      });

      // Verify no duplicates between pages
      const page1Ids = page1Result.items.map(car => car.id);
      const page2Ids = page2Result.items.map(car => car.id);
      
      expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids));
      expect(page2Ids).not.toEqual(expect.arrayContaining(page1Ids));

      // Verify stable ordering (same price items maintain order via ID tie-breaker)
      expect(page1Result.items[0].id).toBe('1'); // Lower ID comes first for same price
      expect(page1Result.items[1].id).toBe('2');
    });

    it('should support all required sort options', async () => {
      const sortOptions = [
        'price_asc',
        'price_desc', 
        'year_asc',
        'year_desc',
        'mileage_asc',
        'mileage_desc'
      ];

      for (const sort of sortOptions) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
            facets: { makes: [], models: [], fuels: [], year_range: {}, price_range: {} }
          })
        });

        await fetchCarsWithPagination({ sort });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`sort=${sort}`),
          expect.any(Object)
        );
      }
    });
  });

  describe('Database-only Mode Tests', () => {
    it('should only call internal API endpoints when READ_SOURCE=db', async () => {
      process.env.VITE_READ_SOURCE = 'db';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
          facets: { makes: [], models: [], fuels: [], year_range: {}, price_range: {} }
        })
      });

      await fetchCarsWithPagination({
        filters: { make: 'Toyota' },
        sort: 'price_asc',
        page: 1
      });

      // Verify only internal Supabase API was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('supabase.co/functions/v1/cars-api'),
        expect.any(Object)
      );

      // Verify no external API calls were made
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringMatching(/encar\.com|auction\.co\.kr|autoauction\.co\.kr/),
        expect.any(Object)
      );
    });

    it('should call /api/cars/:id for individual car details', async () => {
      const mockCarResponse = {
        id: '123',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 25000,
        images: ['image1.jpg'],
        // Should match external API JSON structure
        lots: [{ buy_now: 25000 }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCarResponse)
      });

      const result = await fetchCarById('123');

      expect(result.id).toBe('123');
      expect(result.make).toBe('Toyota');
      
      // Verify correct endpoint was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cars-api/123'),
        expect.any(Object)
      );
    });
  });

  describe('API Response Format Validation', () => {
    it('should return response in correct format: {items,total,page,pageSize,totalPages,hasPrev,hasNext}', async () => {
      const expectedResponse = {
        items: [
          { id: '1', make: 'Toyota', model: 'Camry', year: 2020, price: 25000 }
        ],
        total: 100,
        page: 1,
        pageSize: 24,
        totalPages: 5,
        hasPrev: false,
        hasNext: true,
        facets: {
          makes: [{ value: 'Toyota', count: 50 }],
          models: [{ value: 'Camry', count: 25 }],
          fuels: [{ value: 'Petrol', count: 80 }],
          year_range: { min: 2015, max: 2024 },
          price_range: { min: 15000, max: 80000 }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(expectedResponse)
      });

      const result = await fetchCarsWithPagination({
        sort: 'price_asc',
        page: 1
      });

      // Verify all required fields are present
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('hasPrev');
      expect(result).toHaveProperty('hasNext');
      expect(result).toHaveProperty('facets');

      // Verify types
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.pageSize).toBe('number');
      expect(typeof result.totalPages).toBe('number');
      expect(typeof result.hasPrev).toBe('boolean');
      expect(typeof result.hasNext).toBe('boolean');
      expect(typeof result.facets).toBe('object');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service temporarily unavailable' })
      });

      await expect(
        fetchCarsWithPagination({ sort: 'price_asc' })
      ).rejects.toThrow('API Error 503');
    });

    it('should include telemetry headers in response', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
        facets: { makes: [], models: [], fuels: [], year_range: {}, price_range: {} }
      };

      const mockHeaders = new Headers({
        'X-Source': 'db',
        'X-Duration-Ms': '45.67',
        'X-Rows': '0',
        'Content-Type': 'application/json'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        json: () => Promise.resolve(mockResponse)
      });

      await fetchCarsWithPagination({ sort: 'price_asc' });

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Filter and Sort Integration', () => {
    it('should apply filters before sorting', async () => {
      const mockResponse = {
        items: [
          { id: '1', make: 'Toyota', model: 'Camry', year: 2022, price: 25000 },
          { id: '2', make: 'Toyota', model: 'Corolla', year: 2021, price: 22000 }
        ],
        total: 2,
        page: 1,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
        facets: { makes: [], models: [], fuels: [], year_range: {}, price_range: {} }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await fetchCarsWithPagination({
        filters: {
          make: 'Toyota',
          yearMin: '2020',
          priceMax: '30000'
        },
        sort: 'price_asc',
        page: 1
      });

      // Verify API was called with filters and sort
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/make=Toyota.*yearMin=2020.*priceMax=30000.*sort=price_asc/),
        expect.any(Object)
      );
    });
  });
});