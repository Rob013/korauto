/**
 * Tests for API Parity between External API and Database API
 * Validates that /api/cars/:id returns identical JSON structure to external APIs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapDbToExternal } from '@/services/mappingUtils';
import { fetchCarById } from '@/services/carsApi';

describe('API Parity Tests', () => {
  describe('mapDbToExternal Function', () => {
    it('should map database row to external API JSON shape with all required fields', () => {
      const dbRow = {
        id: '123',
        api_id: 'ext_123',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price_cents: 2500000, // 25,000 in cents
        mileage_km: 50000,
        fuel: 'Petrol',
        transmission: 'Automatic',
        color: 'White',
        condition: 'Used',
        vin: 'JT2SK12E6M0123456',
        location: 'Seoul',
        image_url: 'https://example.com/image.jpg',
        images: ['image1.jpg', 'image2.jpg'],
        rank_score: 85,
        lot_number: 'LOT123456',
        created_at: '2024-01-15T10:30:00Z',
        car_data: {
          // External API data preserved
          description: 'Well-maintained vehicle',
          features: ['Air Conditioning', 'GPS Navigation'],
          inspection_grade: 'Grade 4',
          accident_history: 'None'
        },
        lot_data: {
          buy_now: 25000,
          auction_date: '2024-01-20',
          lot_status: 'Available'
        }
      };

      const result = mapDbToExternal(dbRow);

      // Core identifiers should match external API
      expect(result.id).toBe('123');
      expect(result.api_id).toBe('ext_123');

      // Basic car info with correct types
      expect(result.make).toBe('Toyota');
      expect(result.model).toBe('Camry');
      expect(result.year).toBe(2022);
      expect(typeof result.year).toBe('number');
      expect(result.price).toBe(25000); // Converted from cents
      expect(result.price_cents).toBe(2500000);
      expect(result.mileage).toBe(50000);
      expect(typeof result.mileage).toBe('number');

      // Vehicle details
      expect(result.fuel).toBe('Petrol');
      expect(result.transmission).toBe('Automatic');
      expect(result.color).toBe('White');
      expect(result.condition).toBe('Used');
      expect(result.vin).toBe('JT2SK12E6M0123456');

      // Location and images
      expect(result.location).toBe('Seoul');
      expect(result.image_url).toBe('https://example.com/image.jpg');
      expect(result.images).toEqual(['image1.jpg', 'image2.jpg']);

      // Additional fields
      expect(result.title).toBe('2022 Toyota Camry');
      expect(result.rank_score).toBe(85);
      expect(result.lot_number).toBe('LOT123456');
      expect(result.created_at).toBe('2024-01-15T10:30:00Z');

      // External API data should be preserved
      expect(result.description).toBe('Well-maintained vehicle');
      expect(result.features).toEqual(['Air Conditioning', 'GPS Navigation']);
      expect(result.inspection_grade).toBe('Grade 4');
      expect(result.accident_history).toBe('None');

      // Lots array should be in external API format
      expect(Array.isArray(result.lots)).toBe(true);
      expect(result.lots).toHaveLength(1);
      expect(result.lots[0]).toEqual({
        buy_now: 25000,
        auction_date: '2024-01-20',
        lot_status: 'Available'
      });
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalDbRow = {
        id: '456',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        price_cents: null,
        mileage_km: null
      };

      const result = mapDbToExternal(minimalDbRow);

      expect(result.id).toBe('456');
      expect(result.make).toBe('Honda');
      expect(result.model).toBe('Civic');
      expect(result.year).toBe(2021);
      expect(result.price).toBeNull();
      expect(result.mileage).toBe(0); // Default value
      expect(result.images).toEqual([]); // Default empty array
      expect(result.lots).toEqual([]); // Default empty array
    });

    it('should handle numeric conversion correctly', () => {
      const dbRow = {
        id: '789',
        make: 'BMW',
        model: '3 Series',
        year: '2023', // String that should be converted
        price_cents: '3000000', // String that should be converted
        mileage_km: '25000', // String that should be converted
        rank_score: '90' // String that should be converted
      };

      const result = mapDbToExternal(dbRow);

      expect(result.year).toBe(2023);
      expect(typeof result.year).toBe('number');
      expect(result.price).toBe(30000);
      expect(result.price_cents).toBe(3000000);
      expect(typeof result.price_cents).toBe('number');
      expect(result.mileage).toBe(25000);
      expect(typeof result.mileage).toBe('number');
      expect(result.rank_score).toBe(90);
      expect(typeof result.rank_score).toBe('number');
    });

    it('should preserve complete external API structure from car_data', () => {
      const dbRow = {
        id: '999',
        make: 'Mercedes-Benz',
        model: 'C-Class',
        year: 2023,
        car_data: {
          // Complex external API structure
          manufacturer: { name: 'Mercedes-Benz', country: 'Germany' },
          model: { name: 'C-Class', body_type: 'Sedan' },
          engine: {
            displacement: 2000,
            cylinders: 4,
            fuel_type: 'Petrol',
            power: 255
          },
          safety: {
            airbags: 8,
            abs: true,
            stability_control: true
          },
          options: [
            'Premium Package',
            'Navigation System',
            'Sunroof'
          ],
          auction_info: {
            auction_house: 'Premium Auto Auction',
            sale_date: '2024-01-25',
            estimated_value: 45000
          }
        }
      };

      const result = mapDbToExternal(dbRow);

      // Should preserve all external API structure
      expect(result.manufacturer).toEqual({ name: 'Mercedes-Benz', country: 'Germany' });
      expect(result.engine).toEqual({
        displacement: 2000,
        cylinders: 4,
        fuel_type: 'Petrol',
        power: 255
      });
      expect(result.safety).toEqual({
        airbags: 8,
        abs: true,
        stability_control: true
      });
      expect(result.options).toEqual([
        'Premium Package',
        'Navigation System',
        'Sunroof'
      ]);
      expect(result.auction_info).toEqual({
        auction_house: 'Premium Auto Auction',
        sale_date: '2024-01-25',
        estimated_value: 45000
      });

      // But our normalized values should override for consistency
      expect(result.make).toBe('Mercedes-Benz'); // Our normalized value
      expect(result.model).toBe('C-Class'); // Our normalized value
    });
  });

  describe('API Endpoint Parity Tests', () => {
    const mockFetch = vi.fn();
    
    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return car data in exact external API format from /api/cars/:id', async () => {
      // Mock response that should match external API structure
      const expectedCarData = {
        id: '12345',
        api_id: 'ext_12345',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 25000,
        price_cents: 2500000,
        mileage: 50000,
        fuel: 'Petrol',
        transmission: 'Automatic',
        color: 'White',
        condition: 'Used',
        vin: 'JT2SK12E6M0123456',
        location: 'Seoul',
        image_url: 'https://example.com/car.jpg',
        images: ['image1.jpg', 'image2.jpg'],
        title: '2022 Toyota Camry',
        rank_score: 85,
        lot_number: 'LOT123456',
        created_at: '2024-01-15T10:30:00Z',
        lots: [{
          buy_now: 25000,
          images: {
            normal: ['image1.jpg', 'image2.jpg']
          },
          odometer: { km: 50000 }
        }],
        // External API specific fields
        manufacturer: { name: 'Toyota' },
        model_info: { name: 'Camry', body_type: 'Sedan' },
        inspection: { grade: 'Grade 4', date: '2024-01-10' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(expectedCarData)
      });

      const result = await fetchCarById('12345');

      // Verify structure matches external API exactly
      expect(result).toMatchObject({
        id: '12345',
        api_id: 'ext_12345',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 25000,
        mileage: 50000,
        lots: expect.arrayContaining([
          expect.objectContaining({
            buy_now: 25000
          })
        ])
      });

      // Verify external API specific structure is preserved
      expect(result.manufacturer).toEqual({ name: 'Toyota' });
      expect(result.model_info).toEqual({ name: 'Camry', body_type: 'Sedan' });
      expect(result.inspection).toEqual({ grade: 'Grade 4', date: '2024-01-10' });
    });

    it('should validate 5 random car IDs match external JSON shape', async () => {
      const testCarIds = ['1001', '1002', '1003', '1004', '1005'];
      
      const mockCarResponses = testCarIds.map(id => ({
        id,
        api_id: `ext_${id}`,
        make: 'Toyota',
        model: 'Prius',
        year: 2022,
        price: 28000,
        price_cents: 2800000,
        mileage: 45000,
        fuel: 'Hybrid',
        transmission: 'CVT',
        color: 'Silver',
        location: 'Tokyo',
        images: [`image_${id}_1.jpg`, `image_${id}_2.jpg`],
        lots: [{
          buy_now: 28000,
          images: { normal: [`image_${id}_1.jpg`] },
          odometer: { km: 45000 }
        }],
        // External API structure
        manufacturer: { name: 'Toyota', country: 'Japan' },
        model_info: { name: 'Prius', generation: '4th Gen' },
        engine: { type: 'Hybrid', displacement: 1800 },
        created_at: `2024-01-${10 + parseInt(id.slice(-1))}T10:00:00Z`
      }));

      // Test each car ID
      for (let i = 0; i < testCarIds.length; i++) {
        const carId = testCarIds[i];
        const expectedResponse = mockCarResponses[i];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(expectedResponse)
        });

        const result = await fetchCarById(carId);

        // Verify external API JSON shape is maintained
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('api_id');
        expect(result).toHaveProperty('make');
        expect(result).toHaveProperty('model');
        expect(result).toHaveProperty('year');
        expect(result).toHaveProperty('price');
        expect(result).toHaveProperty('mileage');
        expect(result).toHaveProperty('lots');
        expect(result).toHaveProperty('manufacturer');
        expect(result).toHaveProperty('images');

        // Verify data types match external API
        expect(typeof result.year).toBe('number');
        expect(typeof result.price).toBe('number');
        expect(typeof result.mileage).toBe('number');
        expect(Array.isArray(result.images)).toBe(true);
        expect(Array.isArray(result.lots)).toBe(true);

        // Verify lots structure matches external API
        if (result.lots.length > 0) {
          expect(result.lots[0]).toHaveProperty('buy_now');
          expect(typeof result.lots[0].buy_now).toBe('number');
        }

        console.log(`✅ Car ${carId}: External API structure validated`);
      }
    });

    it('should handle missing fields with appropriate defaults matching external API behavior', async () => {
      const carWithMissingFields = {
        id: '9999',
        make: 'Unknown',
        model: 'Unknown',
        year: 0,
        price: null,
        mileage: 0,
        images: [],
        lots: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(carWithMissingFields)
      });

      const result = await fetchCarById('9999');

      // Should handle missing fields gracefully like external API
      expect(result.id).toBe('9999');
      expect(result.price).toBeNull();
      expect(result.year).toBe(0);
      expect(result.mileage).toBe(0);
      expect(Array.isArray(result.images)).toBe(true);
      expect(result.images).toHaveLength(0);
      expect(Array.isArray(result.lots)).toBe(true);
      expect(result.lots).toHaveLength(0);
    });
  });

  describe('Field Mapping Validation', () => {
    it('should map all required listing fields correctly', () => {
      const dbRow = {
        id: 'test123',
        make: 'Hyundai',
        model: 'Elantra',
        trim: 'SEL',
        year: 2023,
        mileage_km: 35000,
        price_cents: 2200000,
        fuel: 'Petrol',
        body: 'Sedan',
        gearbox: 'Automatic',
        drivetrain: 'FWD',
        city: 'Seoul',
        image_url: 'thumbnail.jpg'
      };

      const result = mapDbToExternal(dbRow);

      // Verify all required listing fields are present and correctly mapped
      expect(result.id).toBe('test123');
      expect(result.make).toBe('Hyundai');
      expect(result.model).toBe('Elantra');
      expect(result.year).toBe(2023);
      expect(result.mileage).toBe(35000);
      expect(result.price).toBe(22000);
      expect(result.fuel).toBe('Petrol');
      expect(result.transmission).toBe('Automatic'); // gearbox -> transmission
      expect(result.location).toBe('Seoul'); // city -> location
      expect(result.image_url).toBe('thumbnail.jpg');
    });

    it('should preserve original external API field names and structure', () => {
      const dbRow = {
        id: 'test456',
        make: 'BMW',
        model: 'X5',
        car_data: {
          // Original external API structure should be preserved
          lots: [{
            buy_now: 55000,
            images: {
              normal: ['bmw1.jpg', 'bmw2.jpg'],
              large: ['bmw1_large.jpg', 'bmw2_large.jpg']
            },
            odometer: { km: 65000, miles: 40389 },
            auction_info: {
              auction_date: '2024-02-01',
              lot_number: 'BMW789',
              seller: 'Premium Motors'
            }
          }],
          manufacturer: {
            name: 'BMW',
            country: 'Germany',
            founded: 1916
          },
          technical_specs: {
            engine: '3.0L I6',
            horsepower: 335,
            torque: 330,
            top_speed: 250
          }
        },
        lot_data: {
          buy_now: 55000,
          images: {
            normal: ['bmw1.jpg', 'bmw2.jpg'],
            large: ['bmw1_large.jpg', 'bmw2_large.jpg']
          },
          odometer: { km: 65000, miles: 40389 }
        }
      };

      const result = mapDbToExternal(dbRow);

      // Should preserve complex external API structure
      expect(result.manufacturer).toEqual({
        name: 'BMW',
        country: 'Germany',
        founded: 1916
      });

      expect(result.technical_specs).toEqual({
        engine: '3.0L I6',
        horsepower: 335,
        torque: 330,
        top_speed: 250
      });

      // Should preserve lots array structure from lot_data
      expect(result.lots).toHaveLength(1);
      expect(result.lots[0].images).toEqual({
        normal: ['bmw1.jpg', 'bmw2.jpg'],
        large: ['bmw1_large.jpg', 'bmw2_large.jpg']
      });
    });
  });
});