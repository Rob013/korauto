import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchCarsWithPagination, fetchCarById } from '@/services/carsApi';

// Mock fetch
global.fetch = vi.fn();

describe('Cars API - Backend Sorting and Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Global Sorting', () => {
    it('should sort cars by price_asc with page 1 starting with global minimum', async () => {
      // Mock API response for page 1 with price_asc
      const mockResponse = {
        items: [
          { id: 'car1', make: 'Toyota', model: 'Camry', year: 2020, price: 15000, price_cents: 1500000 },
          { id: 'car2', make: 'Honda', model: 'Civic', year: 2019, price: 16000, price_cents: 1600000 },
          { id: 'car3', make: 'Nissan', model: 'Altima', year: 2021, price: 17000, price_cents: 1700000 }
        ],
        total: 100,
        page: 1,
        pageSize: 24,
        totalPages: 5,
        hasPrev: false,
        hasNext: true,
        facets: { makes: [], models: [], fuels: [], year_range: { min: 2000, max: 2024 }, price_range: { min: 0, max: 100000 } }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCarsWithPagination({
        sort: 'price_asc',
        page: 1,
        pageSize: 24
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0].price).toBe(15000); // Global minimum price
      expect(result.items[1].price).toBe(16000);
      expect(result.items[2].price).toBe(17000);
      expect(result.page).toBe(1);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should sort cars by price_asc with page 2 continuing ascending order', async () => {
      // Mock API response for page 2 with price_asc
      const mockResponse = {
        items: [
          { id: 'car25', make: 'BMW', model: '3 Series', year: 2020, price: 35000, price_cents: 3500000 },
          { id: 'car26', make: 'Audi', model: 'A4', year: 2019, price: 36000, price_cents: 3600000 },
          { id: 'car27', make: 'Mercedes', model: 'C-Class', year: 2021, price: 37000, price_cents: 3700000 }
        ],
        total: 100,
        page: 2,
        pageSize: 24,
        totalPages: 5,
        hasPrev: true,
        hasNext: true,
        facets: { makes: [], models: [], fuels: [], year_range: { min: 2000, max: 2024 }, price_range: { min: 0, max: 100000 } }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCarsWithPagination({
        sort: 'price_asc',
        page: 2,
        pageSize: 24
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0].price).toBe(35000); // Higher than page 1 maximum
      expect(result.items[1].price).toBe(36000);
      expect(result.items[2].price).toBe(37000);
      expect(result.page).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should validate sort parameters are sent to backend', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        pageSize: 24,
        totalPages: 0,
        hasPrev: false,
        hasNext: false,
        facets: { makes: [], models: [], fuels: [], year_range: { min: 2000, max: 2024 }, price_range: { min: 0, max: 100000 } }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await fetchCarsWithPagination({
        sort: 'year_desc',
        page: 1,
        pageSize: 12,
        filters: { make: 'BMW' }
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const url = new URL(fetchCall[0]);
      
      expect(url.searchParams.get('sort')).toBe('year_desc');
      expect(url.searchParams.get('page')).toBe('1');
      expect(url.searchParams.get('pageSize')).toBe('12');
      expect(url.searchParams.get('make')).toBe('BMW');
    });

    it('should handle mileage sorting correctly', async () => {
      const mockResponse = {
        items: [
          { id: 'car1', make: 'Toyota', model: 'Camry', year: 2020, mileage: 10000 },
          { id: 'car2', make: 'Honda', model: 'Civic', year: 2019, mileage: 15000 },
          { id: 'car3', make: 'Nissan', model: 'Altima', year: 2021, mileage: 20000 }
        ],
        total: 3,
        page: 1,
        pageSize: 24,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
        facets: { makes: [], models: [], fuels: [], year_range: { min: 2000, max: 2024 }, price_range: { min: 0, max: 100000 } }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchCarsWithPagination({
        sort: 'mileage_asc',
        page: 1,
        pageSize: 24
      });

      expect(result.items[0].mileage).toBe(10000); // Lowest mileage first
      expect(result.items[1].mileage).toBe(15000);
      expect(result.items[2].mileage).toBe(20000);
    });
  });

  describe('Individual Car Details', () => {
    it('should fetch individual car by ID with matching JSON shape', async () => {
      const mockCar = {
        id: 'car123',
        make: 'BMW',
        model: '3 Series',
        year: 2020,
        price: 35000,
        price_cents: 3500000,
        mileage: 50000,
        fuel: 'Gasoline',
        transmission: 'Automatic',
        color: 'Black',
        location: 'Seoul',
        image_url: 'https://example.com/car.jpg',
        images: ['https://example.com/car1.jpg', 'https://example.com/car2.jpg'],
        title: '2020 BMW 3 Series',
        created_at: '2024-01-01T00:00:00Z',
        rank_score: 85
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCar)
      });

      const result = await fetchCarById('car123');

      expect(result).toEqual(mockCar);
      expect(result.id).toBe('car123');
      expect(result.make).toBe('BMW');
      expect(result.model).toBe('3 Series');
      expect(result.year).toBe(2020);
      expect(result.price).toBe(35000);
      
      // Verify correct endpoint was called
      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/cars-api/car123');
    });

    it('should handle car not found error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Car not found' })
      });

      await expect(fetchCarById('nonexistent')).rejects.toThrow(/Car not found/);
    });
  });

  describe('API Parity', () => {
    it('should return consistent JSON structure for both list and detail endpoints', async () => {
      // Mock list response
      const listMockResponse = {
        items: [
          {
            id: 'car123',
            make: 'BMW',
            model: '3 Series',
            year: 2020,
            price: 35000,
            price_cents: 3500000,
            mileage: 50000,
            fuel: 'Gasoline',
            transmission: 'Automatic',
            color: 'Black',
            location: 'Seoul',
            image_url: 'https://example.com/car.jpg',
            images: [],
            title: '2020 BMW 3 Series',
            created_at: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        page: 1,
        pageSize: 24,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
        facets: { makes: [], models: [], fuels: [], year_range: { min: 2000, max: 2024 }, price_range: { min: 0, max: 100000 } }
      };

      // Mock detail response  
      const detailMockResponse = {
        id: 'car123',
        make: 'BMW',
        model: '3 Series',
        year: 2020,
        price: 35000,
        price_cents: 3500000,
        mileage: 50000,
        fuel: 'Gasoline',
        transmission: 'Automatic',
        color: 'Black',
        location: 'Seoul',
        image_url: 'https://example.com/car.jpg',
        images: ['https://example.com/car1.jpg', 'https://example.com/car2.jpg'],
        title: '2020 BMW 3 Series',
        created_at: '2024-01-01T00:00:00Z',
        rank_score: 85,
        // Additional detail fields
        vin: 'WBA123456789',
        condition: 'Used'
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(listMockResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailMockResponse)
        });

      const listResult = await fetchCarsWithPagination({ page: 1, pageSize: 24 });
      const detailResult = await fetchCarById('car123');

      const listCar = listResult.items[0];

      // Verify common fields have same structure and types
      expect(typeof listCar.id).toBe(typeof detailResult.id);
      expect(typeof listCar.make).toBe(typeof detailResult.make);
      expect(typeof listCar.model).toBe(typeof detailResult.model);
      expect(typeof listCar.year).toBe(typeof detailResult.year);
      expect(typeof listCar.price).toBe(typeof detailResult.price);
      expect(typeof listCar.price_cents).toBe(typeof detailResult.price_cents);
      expect(typeof listCar.mileage).toBe(typeof detailResult.mileage);
      
      // Verify values match
      expect(listCar.id).toBe(detailResult.id);
      expect(listCar.make).toBe(detailResult.make);
      expect(listCar.model).toBe(detailResult.model);
      expect(listCar.year).toBe(detailResult.year);
      expect(listCar.price).toBe(detailResult.price);
    });
  });
});