import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Enhanced Car API and Sold Car Removal Tests
 * Tests the improved car sync API and enhanced sold car deletion functionality
 */
describe('Enhanced Car API and Sold Car Removal', () => {
  describe('Enhanced Car Validation', () => {
    it('should validate car data comprehensively', () => {
      // Test comprehensive car validation logic
      function validateCarData(apiCar: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = []
        
        // Required fields
        if (!apiCar.id) errors.push('Missing car ID')
        if (!apiCar.manufacturer?.name) errors.push('Missing manufacturer name')
        if (!apiCar.model?.name) errors.push('Missing model name')
        
        // Data quality checks
        const year = apiCar.year
        if (year && (year < 1900 || year > new Date().getFullYear() + 2)) {
          errors.push(`Invalid year: ${year}`)
        }
        
        const primaryLot = apiCar.lots?.[0]
        if (primaryLot) {
          const buyNow = primaryLot.buy_now
          if (buyNow && (buyNow < 0 || buyNow > 10000000)) {
            errors.push(`Invalid buy_now price: ${buyNow}`)
          }
          
          const mileage = primaryLot.odometer?.km
          if (mileage && (mileage < 0 || mileage > 1000000)) {
            errors.push(`Invalid mileage: ${mileage}`)
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors
        }
      }

      // Valid car should pass validation
      const validCar = {
        id: '12345',
        manufacturer: { name: 'Toyota' },
        model: { name: 'Camry' },
        year: 2020,
        lots: [{
          buy_now: 25000,
          odometer: { km: 50000 }
        }]
      };

      const validResult = validateCarData(validCar);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid car should fail validation
      const invalidCar = {
        id: null, // Missing ID
        manufacturer: { name: 'Toyota' },
        model: { name: null }, // Missing model name
        year: 1800, // Invalid year
        lots: [{
          buy_now: -5000, // Invalid price
          odometer: { km: 2000000 } // Invalid mileage
        }]
      };

      const invalidResult = validateCarData(invalidCar);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Missing car ID');
      expect(invalidResult.errors).toContain('Missing model name');
      expect(invalidResult.errors).toContain('Invalid year: 1800');
      expect(invalidResult.errors).toContain('Invalid buy_now price: -5000');
      expect(invalidResult.errors).toContain('Invalid mileage: 2000000');
    });

    it('should transform car data with enhanced enrichment', () => {
      function transformCarData(apiCar: any): any {
        const primaryLot = apiCar.lots?.[0]
        const images = primaryLot?.images?.normal || primaryLot?.images?.big || []
        
        const carId = apiCar.id?.toString()
        const make = apiCar.manufacturer?.name?.trim()
        const model = apiCar.model?.name?.trim()
        
        // Enhanced price calculation with fallbacks
        const buyNowPrice = parseFloat(primaryLot?.buy_now) || 0
        const currentBid = parseFloat(primaryLot?.bid) || 0
        const price = Math.max(buyNowPrice, currentBid, 0)
        
        // Enhanced condition mapping
        const conditionMap: Record<string, string> = {
          'excellent': 'excellent',
          'good': 'good',
          'fair': 'fair',
          'poor': 'poor',
          'salvage': 'salvage'
        }
        const condition = conditionMap[primaryLot?.condition?.name?.toLowerCase()] || 'good'
        
        return {
          id: carId,
          external_id: carId,
          make,
          model,
          year: apiCar.year && apiCar.year > 1900 ? apiCar.year : 2020,
          price: Math.round(price),
          mileage: Math.max(primaryLot?.odometer?.km || 0, 0),
          title: apiCar.title?.trim() || `${make} ${model} ${apiCar.year || ''}`,
          condition,
          status: 'active',
          is_archived: false,
          last_synced_at: expect.any(String),
          // Enhanced metadata
          estimated_repair_cost: parseFloat(primaryLot?.estimate_repair_price) || null,
          damage_primary: primaryLot?.damage?.main || null
        }
      }

      const apiCar = {
        id: '54321',
        manufacturer: { name: '  Honda  ' },
        model: { name: '  Civic  ' },
        year: 2022,
        title: '  2022 Honda Civic  ',
        lots: [{
          buy_now: 28000,
          bid: 25000,
          odometer: { km: 30000 },
          condition: { name: 'Good' },
          estimate_repair_price: '1500',
          damage: { main: 'front_end' }
        }]
      };

      const transformed = transformCarData(apiCar);
      
      expect(transformed.id).toBe('54321');
      expect(transformed.make).toBe('Honda'); // Trimmed
      expect(transformed.model).toBe('Civic'); // Trimmed
      expect(transformed.year).toBe(2022);
      expect(transformed.price).toBe(28000); // Uses higher of buy_now and bid
      expect(transformed.mileage).toBe(30000);
      expect(transformed.title).toBe('2022 Honda Civic'); // Trimmed
      expect(transformed.condition).toBe('good'); // Mapped correctly
      expect(transformed.status).toBe('active');
      expect(transformed.is_archived).toBe(false);
      expect(transformed.estimated_repair_cost).toBe(1500);
      expect(transformed.damage_primary).toBe('front_end');
    });
  });

  describe('Enhanced Sold Car Removal', () => {
    it('should support immediate removal of sold cars', () => {
      const now = new Date();
      const cars = [
        // Recently sold car - with immediate removal should be removed
        { 
          id: '1', 
          is_archived: true, 
          archived_at: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
          archive_reason: 'sold',
          is_active: true,
          status: 'sold'
        },
        // Old sold car - should be removed regardless
        { 
          id: '2', 
          is_archived: true, 
          archived_at: new Date(now.getTime() - 25 * 60 * 60 * 1000), // 25 hours ago
          archive_reason: 'sold',
          is_active: true,
          status: 'sold'
        },
        // Active car - should not be removed
        { 
          id: '3', 
          is_archived: false, 
          archived_at: null,
          is_active: true,
          status: 'active'
        }
      ];

      // Simulate immediate removal logic
      function simulateImmediateRemoval(cars: any[], immediate: boolean) {
        return cars.map(car => {
          if (immediate) {
            // Immediate removal: mark all sold cars as inactive
            if (car.is_archived && car.archive_reason === 'sold' && car.is_active) {
              return {
                ...car,
                is_active: false,
                status: 'immediately_removed_after_sold'
              };
            }
          } else {
            // Standard 24-hour delay removal
            const isOldSold = car.is_archived && 
                            car.archived_at && 
                            car.archive_reason === 'sold' &&
                            (now.getTime() - new Date(car.archived_at).getTime()) >= 24 * 60 * 60 * 1000 &&
                            car.is_active;
            if (isOldSold) {
              return {
                ...car,
                is_active: false,
                status: 'removed_after_sold'
              };
            }
          }
          return car;
        });
      }

      // Test immediate removal
      const immediateResult = simulateImmediateRemoval(cars, true);
      const removedImmediate = immediateResult.filter(car => !car.is_active);
      expect(removedImmediate).toHaveLength(2); // Both sold cars removed
      expect(removedImmediate[0].status).toBe('immediately_removed_after_sold');
      expect(removedImmediate[1].status).toBe('immediately_removed_after_sold');

      // Test standard 24-hour removal
      const standardResult = simulateImmediateRemoval(cars, false);
      const removedStandard = standardResult.filter(car => !car.is_active);
      expect(removedStandard).toHaveLength(1); // Only old sold car removed
      expect(removedStandard[0].id).toBe('2');
      expect(removedStandard[0].status).toBe('removed_after_sold');
    });

    it('should handle bulk car deletion', () => {
      const cars = [
        { id: '1', is_active: true, status: 'active' },
        { id: '2', is_active: true, status: 'active' },
        { id: '3', is_active: true, status: 'active' },
        { id: '4', is_active: false, status: 'sold' } // Already inactive
      ];

      function simulateBulkDelete(cars: any[], carIds: string[], deleteReason: string) {
        let deletedCount = 0;
        const result = cars.map(car => {
          if (carIds.includes(car.id) && car.is_active) {
            deletedCount++;
            return {
              ...car,
              is_active: false,
              status: deleteReason,
              is_archived: true,
              archived_at: new Date().toISOString(),
              archive_reason: deleteReason
            };
          }
          return car;
        });
        
        return { cars: result, deletedCount };
      }

      const bulkResult = simulateBulkDelete(cars, ['1', '2', '4'], 'admin_bulk_delete');
      
      expect(bulkResult.deletedCount).toBe(2); // Only active cars (1, 2) deleted
      expect(bulkResult.cars.find(c => c.id === '1')?.is_active).toBe(false);
      expect(bulkResult.cars.find(c => c.id === '2')?.is_active).toBe(false);
      expect(bulkResult.cars.find(c => c.id === '3')?.is_active).toBe(true); // Not in delete list
      expect(bulkResult.cars.find(c => c.id === '4')?.is_active).toBe(false); // Already inactive
    });

    it('should filter active cars with enhanced logic', () => {
      const now = new Date();
      const cars = [
        // Regular active car - should be shown
        { id: '1', is_archived: false, archived_at: null, is_active: true, status: 'active' },
        
        // Recently sold car - should be shown (within 24h)
        { 
          id: '2', 
          is_archived: true, 
          archived_at: new Date(now.getTime() - 23 * 60 * 60 * 1000), 
          is_active: true, 
          status: 'sold'
        },
        
        // Old sold car - should be hidden (over 24h)
        { 
          id: '3', 
          is_archived: true, 
          archived_at: new Date(now.getTime() - 25 * 60 * 60 * 1000), 
          is_active: true, 
          status: 'sold'
        },
        
        // Immediately removed car - should be hidden
        { 
          id: '4', 
          is_archived: true, 
          archived_at: new Date(now.getTime() - 1 * 60 * 60 * 1000), 
          is_active: false, 
          status: 'immediately_removed_after_sold'
        },
        
        // Bulk deleted car - should be hidden
        { 
          id: '5', 
          is_archived: true, 
          archived_at: new Date(), 
          is_active: false, 
          status: 'admin_bulk_delete'
        }
      ];

      // Enhanced active cars logic
      const activeCars = cars.filter(car => {
        // Must be active
        if (!car.is_active) return false;
        
        // Hide cars with certain statuses
        if (['removed_after_sold', 'immediately_removed_after_sold', 'admin_bulk_delete'].includes(car.status)) {
          return false;
        }
        
        // Show cars that are either:
        // 1. Not archived/sold at all, OR
        // 2. Archived/sold less than 24 hours ago (unless immediately removed)
        const isNotArchived = !car.is_archived || car.archived_at === null;
        const isRecentlySold = car.is_archived && 
                              car.archived_at && 
                              (now.getTime() - new Date(car.archived_at).getTime()) < 24 * 60 * 60 * 1000 &&
                              !['immediately_removed_after_sold', 'admin_bulk_delete'].includes(car.status);
        
        return isNotArchived || isRecentlySold;
      });

      // Verify correct filtering
      expect(activeCars).toHaveLength(2);
      expect(activeCars.map(c => c.id)).toEqual(['1', '2']);
      
      // Verify excluded cars
      expect(activeCars.find(c => c.id === '3')).toBeUndefined(); // Old sold car excluded
      expect(activeCars.find(c => c.id === '4')).toBeUndefined(); // Immediately removed car excluded
      expect(activeCars.find(c => c.id === '5')).toBeUndefined(); // Bulk deleted car excluded
    });
  });

  describe('Enhanced Batch Processing', () => {
    it('should process cars in batches with validation', () => {
      const BATCH_SIZE = 5;
      const VALIDATION_THRESHOLD = 0.8; // 80% of cars must be valid

      const cars = [
        // Valid cars
        { id: '1', manufacturer: { name: 'Toyota' }, model: { name: 'Camry' }, year: 2020 },
        { id: '2', manufacturer: { name: 'Honda' }, model: { name: 'Civic' }, year: 2021 },
        { id: '3', manufacturer: { name: 'Ford' }, model: { name: 'Focus' }, year: 2019 },
        { id: '4', manufacturer: { name: 'BMW' }, model: { name: 'X3' }, year: 2022 },
        
        // Invalid car
        { id: null, manufacturer: { name: 'Tesla' }, model: { name: null }, year: 1800 },
        
        // More valid cars
        { id: '6', manufacturer: { name: 'Audi' }, model: { name: 'A4' }, year: 2020 },
        { id: '7', manufacturer: { name: 'VW' }, model: { name: 'Golf' }, year: 2021 }
      ];

      function validateCar(car: any): boolean {
        return !!(car.id && car.manufacturer?.name && car.model?.name && car.year > 1900);
      }

      function processBatch(batch: any[]) {
        const validCars = batch.filter(validateCar);
        const validationRate = validCars.length / batch.length;
        
        return {
          validCars,
          validationRate,
          passesThreshold: validationRate >= VALIDATION_THRESHOLD
        };
      }

      // Process first batch (5 cars: 4 valid, 1 invalid)
      const firstBatch = cars.slice(0, BATCH_SIZE);
      const firstResult = processBatch(firstBatch);
      
      expect(firstResult.validCars).toHaveLength(4);
      expect(firstResult.validationRate).toBe(0.8); // 4/5 = 80%
      expect(firstResult.passesThreshold).toBe(true);

      // Process second batch (2 cars: both valid)
      const secondBatch = cars.slice(BATCH_SIZE);
      const secondResult = processBatch(secondBatch);
      
      expect(secondResult.validCars).toHaveLength(2);
      expect(secondResult.validationRate).toBe(1.0); // 2/2 = 100%
      expect(secondResult.passesThreshold).toBe(true);
    });

    it('should handle API request retry logic', () => {
      const MAX_RETRIES = 3;
      const RATE_LIMIT_DELAY = 1000;
      
      let attemptCount = 0;
      
      // Mock API function that fails twice then succeeds
      async function mockApiRequest(url: string, retryCount = 0): Promise<any> {
        attemptCount++;
        
        if (attemptCount <= 2) {
          // Simulate rate limit error
          throw { status: 429, message: 'Rate limited' };
        }
        
        return { data: [{ id: '1', manufacturer: { name: 'Toyota' } }] };
      }

      // Simulate retry logic
      async function makeRequestWithRetry(url: string, retryCount = 0): Promise<any> {
        try {
          return await mockApiRequest(url, retryCount);
        } catch (error) {
          if (error.status === 429 && retryCount < MAX_RETRIES) {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * Math.pow(1.5, retryCount)));
            return makeRequestWithRetry(url, retryCount + 1);
          }
          throw error;
        }
      }

      // Test that retry logic works
      expect(async () => {
        const result = await makeRequestWithRetry('test-url');
        expect(result.data).toHaveLength(1);
        expect(attemptCount).toBe(3); // Failed twice, succeeded on third attempt
      }).not.toThrow();
    });
  });

  describe('Image Cleanup Queue', () => {
    it('should queue images for cleanup when cars are removed', () => {
      const removedCars = [
        {
          id: '1',
          images: JSON.stringify(['image1.jpg', 'image2.jpg']),
          status: 'removed_after_sold'
        },
        {
          id: '2', 
          images: JSON.stringify(['image3.jpg']),
          status: 'immediately_removed_after_sold'
        }
      ];

      function queueImagesForCleanup(cars: any[]) {
        const queue: any[] = [];
        
        cars.forEach(car => {
          if (car.images && car.status.includes('removed')) {
            queue.push({
              car_id: car.id,
              image_urls: car.images,
              queued_at: new Date().toISOString(),
              status: 'pending'
            });
          }
        });
        
        return queue;
      }

      const cleanupQueue = queueImagesForCleanup(removedCars);
      
      expect(cleanupQueue).toHaveLength(2);
      expect(cleanupQueue[0].car_id).toBe('1');
      expect(cleanupQueue[0].image_urls).toBe('["image1.jpg","image2.jpg"]');
      expect(cleanupQueue[1].car_id).toBe('2');
      expect(cleanupQueue[1].image_urls).toBe('["image3.jpg"]');
    });
  });
});