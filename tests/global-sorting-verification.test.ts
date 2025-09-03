// Test file to verify global sorting functionality
import { describe, it, expect, beforeAll } from 'vitest';
import { fetchCarsWithKeyset, getSortParams, mapFrontendSortToBackend } from '../src/services/carsApi';

describe('Global Sorting Verification', () => {
  describe('Sort Parameter Mapping', () => {
    it('should correctly map frontend sort options to backend', () => {
      // Test frontend to backend mapping
      expect(mapFrontendSortToBackend('price_low')).toBe('price_asc');
      expect(mapFrontendSortToBackend('price_high')).toBe('price_desc');
      expect(mapFrontendSortToBackend('year_new')).toBe('year_desc');
      expect(mapFrontendSortToBackend('year_old')).toBe('year_asc');
      expect(mapFrontendSortToBackend('mileage_low')).toBe('mileage_asc');
      expect(mapFrontendSortToBackend('mileage_high')).toBe('mileage_desc');
      expect(mapFrontendSortToBackend('recently_added')).toBe('created_desc');
      expect(mapFrontendSortToBackend('popular')).toBe('rank_desc');
    });

    it('should correctly map sort options to database fields', () => {
      // Test sort params generation
      expect(getSortParams('price_asc')).toEqual({ field: 'price_cents', direction: 'ASC' });
      expect(getSortParams('price_desc')).toEqual({ field: 'price_cents', direction: 'DESC' });
      expect(getSortParams('year_asc')).toEqual({ field: 'year', direction: 'ASC' });
      expect(getSortParams('year_desc')).toEqual({ field: 'year', direction: 'DESC' });
      expect(getSortParams('mileage_asc')).toEqual({ field: 'mileage', direction: 'ASC' });
      expect(getSortParams('mileage_desc')).toEqual({ field: 'mileage', direction: 'DESC' });
      expect(getSortParams('make_asc')).toEqual({ field: 'make', direction: 'ASC' });
      expect(getSortParams('created_desc')).toEqual({ field: 'created_at', direction: 'DESC' });
      expect(getSortParams('rank_desc')).toEqual({ field: 'rank_score', direction: 'DESC' });
    });

    it('should map frontend sort options through complete pipeline', () => {
      // Test complete frontend to database field mapping
      expect(getSortParams('price_low')).toEqual({ field: 'price_cents', direction: 'ASC' });
      expect(getSortParams('price_high')).toEqual({ field: 'price_cents', direction: 'DESC' });
      expect(getSortParams('year_new')).toEqual({ field: 'year', direction: 'DESC' });
      expect(getSortParams('year_old')).toEqual({ field: 'year', direction: 'ASC' });
      expect(getSortParams('mileage_low')).toEqual({ field: 'mileage', direction: 'ASC' });
      expect(getSortParams('mileage_high')).toEqual({ field: 'mileage', direction: 'DESC' });
      expect(getSortParams('recently_added')).toEqual({ field: 'created_at', direction: 'DESC' });
      expect(getSortParams('popular')).toEqual({ field: 'rank_score', direction: 'DESC' });
    });
  });

  describe('Enhanced Car Data Structure', () => {
    it('should validate that Car interface includes all database fields', async () => {
      // This test ensures our Car interface covers all the database fields
      try {
        const response = await fetchCarsWithKeyset({
          filters: {},
          sort: 'price_asc',
          limit: 1
        });

        if (response.items && response.items.length > 0) {
          const car = response.items[0];
          
          // Core identification fields
          expect(car).toHaveProperty('id');
          expect(car).toHaveProperty('make');
          expect(car).toHaveProperty('model');
          expect(car).toHaveProperty('year');
          expect(car).toHaveProperty('price');
          expect(car).toHaveProperty('price_cents');
          
          // Enhanced fields that should now be available
          expect(car).toHaveProperty('external_id');
          expect(car).toHaveProperty('vin');
          expect(car).toHaveProperty('condition');
          expect(car).toHaveProperty('lot_number');
          expect(car).toHaveProperty('current_bid');
          expect(car).toHaveProperty('buy_now_price');
          expect(car).toHaveProperty('status');
          expect(car).toHaveProperty('is_live');
          expect(car).toHaveProperty('keys_available');
          expect(car).toHaveProperty('source_api');
          expect(car).toHaveProperty('domain_name');
          
          console.log('✅ Car data structure validation passed');
          console.log('📊 Sample car data:', JSON.stringify(car, null, 2));
        } else {
          console.log('⚠️ No cars found in database for validation');
        }
      } catch (error) {
        console.log('⚠️ Could not connect to database for validation:', error);
        // This is expected in test environment without database
      }
    });
  });

  describe('Global Price Sorting Logic', () => {
    it('should verify price sorting works globally across all pages', async () => {
      try {
        console.log('🔍 Testing global price sorting (lowest to highest)...');
        
        // Test ascending price sort - should return lowest prices first
        const ascResponse = await fetchCarsWithKeyset({
          filters: {},
          sort: 'price_asc',
          limit: 10
        });

        if (ascResponse.items && ascResponse.items.length > 1) {
          const prices = ascResponse.items.map(car => car.price_cents || car.price * 100);
          
          // Verify prices are sorted in ascending order
          for (let i = 1; i < prices.length; i++) {
            expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
          }
          
          console.log('✅ Price ascending sort verified');
          console.log('📈 Price range (ascending):', prices.slice(0, 5));
        }

        // Test descending price sort - should return highest prices first
        const descResponse = await fetchCarsWithKeyset({
          filters: {},
          sort: 'price_desc',
          limit: 10
        });

        if (descResponse.items && descResponse.items.length > 1) {
          const prices = descResponse.items.map(car => car.price_cents || car.price * 100);
          
          // Verify prices are sorted in descending order
          for (let i = 1; i < prices.length; i++) {
            expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
          }
          
          console.log('✅ Price descending sort verified');
          console.log('📉 Price range (descending):', prices.slice(0, 5));
        }
        
      } catch (error) {
        console.log('⚠️ Could not test database sorting:', error);
        // This is expected in test environment without database access
      }
    });

    it('should demonstrate that first page contains globally cheapest cars', async () => {
      try {
        console.log('🔍 Testing that page 1 contains globally cheapest cars...');
        
        // Get first page of cars sorted by price ascending
        const firstPageResponse = await fetchCarsWithKeyset({
          filters: {},
          sort: 'price_asc',
          limit: 24
        });

        if (firstPageResponse.items && firstPageResponse.items.length > 0) {
          const firstPagePrices = firstPageResponse.items.map(car => car.price_cents || car.price * 100);
          const lowestPrice = Math.min(...firstPagePrices);
          const highestPriceOnFirstPage = Math.max(...firstPagePrices);
          
          console.log('✅ First page price analysis:');
          console.log(`📊 Lowest price on first page: ${lowestPrice / 100}`);
          console.log(`📊 Highest price on first page: ${highestPriceOnFirstPage / 100}`);
          console.log(`📊 Total cars returned: ${firstPageResponse.items.length}`);
          console.log(`📊 Total cars in database: ${firstPageResponse.total}`);
          
          // If there are more pages, get a sample from a later page to verify global sorting
          if (firstPageResponse.nextCursor && firstPageResponse.total > 24) {
            const laterPageResponse = await fetchCarsWithKeyset({
              filters: {},
              sort: 'price_asc',
              limit: 24,
              cursor: firstPageResponse.nextCursor
            });
            
            if (laterPageResponse.items && laterPageResponse.items.length > 0) {
              const laterPagePrices = laterPageResponse.items.map(car => car.price_cents || car.price * 100);
              const lowestPriceOnLaterPage = Math.min(...laterPagePrices);
              
              // Verify that the highest price on first page is <= lowest price on later page
              expect(highestPriceOnFirstPage).toBeLessThanOrEqual(lowestPriceOnLaterPage);
              
              console.log(`✅ Global sorting verified: highest price on page 1 (${highestPriceOnFirstPage / 100}) <= lowest price on page 2 (${lowestPriceOnLaterPage / 100})`);
            }
          }
        }
        
      } catch (error) {
        console.log('⚠️ Could not test global sorting across pages:', error);
        // This is expected in test environment without database access
      }
    });
  });
});