/**
 * Comprehensive test for catalog ranking validation across all pages
 * Ensures that sorting works correctly and ranks are consistent from first to last page
 */

import { describe, it, expect } from 'vitest';
import { 
  applyChronologicalRanking, 
  getCarsForPage, 
  validateChronologicalRanking,
  getCarRankingInfo 
} from '../src/utils/chronologicalRanking';
import { SortOption } from '../src/hooks/useSortedCars';

describe('Catalog Ranking Validation - All Pages', () => {
  // Generate a large dataset to test comprehensive ranking
  const generateLargeCarDataset = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `car-${i + 1}`,
      make: `Make-${Math.floor(i / 50)}`, // Different makes
      model: `Model-${i % 10}`,
      year: 2015 + (i % 10), // Years 2015-2024
      lots: [{
        buy_now: Math.floor(Math.random() * 80000) + 5000, // Prices 5k-85k
        odometer: { km: Math.floor(Math.random() * 300000) + 1000 }, // Mileage 1k-301k
        popularity_score: Math.random() * 100,
        final_price: Math.floor(Math.random() * 80000) + 5000
      }],
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      manufacturer: { name: `Manufacturer-${Math.floor(i / 20)}` },
      price: Math.floor(Math.random() * 80000) + 5000,
      popularity_score: Math.random() * 100
    }));
  };

  describe('Price Sorting Validation', () => {
    it('should rank all cars by price_low consistently across pages', () => {
      const cars = generateLargeCarDataset(500);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      // Validate basic structure
      expect(result.totalCars).toBe(500);
      expect(result.totalPages).toBe(10); // 500 cars / 50 per page
      expect(result.rankedCars).toHaveLength(500);
      
      // Validate that sorting is correct
      expect(validateChronologicalRanking(result.rankedCars, 'price_low')).toBe(true);
      
      // Test each page boundary
      for (let page = 1; page <= result.totalPages; page++) {
        const pageCars = getCarsForPage(result.rankedCars, page, 50);
        
        // Each page should have 50 cars (except possibly the last page)
        if (page < result.totalPages) {
          expect(pageCars).toHaveLength(50);
        }
        
        // Verify ranking within page
        for (let i = 0; i < pageCars.length; i++) {
          const expectedRank = (page - 1) * 50 + i + 1;
          expect(pageCars[i].rank).toBe(expectedRank);
          expect(pageCars[i].pageNumber).toBe(page);
          expect(pageCars[i].positionInPage).toBe(i + 1);
        }
        
        // Verify price ordering within page
        for (let i = 1; i < pageCars.length; i++) {
          const prevPrice = pageCars[i - 1].lots[0].buy_now;
          const currPrice = pageCars[i].lots[0].buy_now;
          expect(prevPrice).toBeLessThanOrEqual(currPrice);
        }
        
        // Verify price ordering across page boundaries
        if (page > 1) {
          const prevPageCars = getCarsForPage(result.rankedCars, page - 1, 50);
          const lastPrevPrice = prevPageCars[prevPageCars.length - 1].lots[0].buy_now;
          const firstCurrPrice = pageCars[0].lots[0].buy_now;
          expect(lastPrevPrice).toBeLessThanOrEqual(firstCurrPrice);
        }
      }
    });

    it('should rank all cars by price_high consistently across pages', () => {
      const cars = generateLargeCarDataset(300);
      const result = applyChronologicalRanking(cars, 'price_high', 50);
      
      expect(result.totalCars).toBe(300);
      expect(result.totalPages).toBe(6); // 300 cars / 50 per page
      expect(validateChronologicalRanking(result.rankedCars, 'price_high')).toBe(true);
      
      // Test page boundaries for price_high (highest to lowest)
      for (let page = 1; page <= result.totalPages; page++) {
        const pageCars = getCarsForPage(result.rankedCars, page, 50);
        
        // Verify price ordering within page (highest to lowest)
        for (let i = 1; i < pageCars.length; i++) {
          const prevPrice = pageCars[i - 1].lots[0].buy_now;
          const currPrice = pageCars[i].lots[0].buy_now;
          expect(prevPrice).toBeGreaterThanOrEqual(currPrice);
        }
        
        // Verify price ordering across page boundaries
        if (page > 1) {
          const prevPageCars = getCarsForPage(result.rankedCars, page - 1, 50);
          const lastPrevPrice = prevPageCars[prevPageCars.length - 1].lots[0].buy_now;
          const firstCurrPrice = pageCars[0].lots[0].buy_now;
          expect(lastPrevPrice).toBeGreaterThanOrEqual(firstCurrPrice);
        }
      }
    });
  });

  describe('Year Sorting Validation', () => {
    it('should rank all cars by year_new consistently across pages', () => {
      const cars = generateLargeCarDataset(200);
      const result = applyChronologicalRanking(cars, 'year_new', 50);
      
      expect(validateChronologicalRanking(result.rankedCars, 'year_new')).toBe(true);
      
      // Test year ordering across all pages
      for (let page = 1; page <= result.totalPages; page++) {
        const pageCars = getCarsForPage(result.rankedCars, page, 50);
        
        // Verify year ordering within page (newest to oldest)
        for (let i = 1; i < pageCars.length; i++) {
          const prevYear = parseInt(pageCars[i - 1].year);
          const currYear = parseInt(pageCars[i].year);
          expect(prevYear).toBeGreaterThanOrEqual(currYear);
        }
      }
    });
  });

  describe('Mileage Sorting Validation', () => {
    it('should rank all cars by mileage_low consistently across pages', () => {
      const cars = generateLargeCarDataset(150);
      const result = applyChronologicalRanking(cars, 'mileage_low', 50);
      
      expect(validateChronologicalRanking(result.rankedCars, 'mileage_low')).toBe(true);
      
      // Test mileage ordering across all pages
      for (let page = 1; page <= result.totalPages; page++) {
        const pageCars = getCarsForPage(result.rankedCars, page, 50);
        
        // Verify mileage ordering within page (lowest to highest)
        for (let i = 1; i < pageCars.length; i++) {
          const prevMileage = pageCars[i - 1].lots[0].odometer.km;
          const currMileage = pageCars[i].lots[0].odometer.km;
          expect(prevMileage).toBeLessThanOrEqual(currMileage);
        }
      }
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle single page correctly', () => {
      const cars = generateLargeCarDataset(25); // Less than one full page
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      expect(result.totalPages).toBe(1);
      expect(result.totalCars).toBe(25);
      
      const page1Cars = getCarsForPage(result.rankedCars, 1, 50);
      expect(page1Cars).toHaveLength(25);
      
      // Verify all ranks are sequential
      for (let i = 0; i < page1Cars.length; i++) {
        expect(page1Cars[i].rank).toBe(i + 1);
        expect(page1Cars[i].pageNumber).toBe(1);
        expect(page1Cars[i].positionInPage).toBe(i + 1);
      }
    });

    it('should handle exact page boundaries correctly', () => {
      const cars = generateLargeCarDataset(150); // Exactly 3 pages of 50 cars
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      expect(result.totalPages).toBe(3);
      expect(result.totalCars).toBe(150);
      
      // Test each page has exactly 50 cars
      for (let page = 1; page <= 3; page++) {
        const pageCars = getCarsForPage(result.rankedCars, page, 50);
        expect(pageCars).toHaveLength(50);
        
        // First car of each page should have correct rank
        expect(pageCars[0].rank).toBe((page - 1) * 50 + 1);
        // Last car of each page should have correct rank
        expect(pageCars[49].rank).toBe(page * 50);
      }
    });

    it('should handle large datasets efficiently', () => {
      const cars = generateLargeCarDataset(1000); // Very large dataset
      const startTime = Date.now();
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      expect(result.totalPages).toBe(20); // 1000 cars / 50 per page
      expect(result.totalCars).toBe(1000);
      expect(validateChronologicalRanking(result.rankedCars, 'price_low')).toBe(true);
      
      // Test first and last pages
      const firstPage = getCarsForPage(result.rankedCars, 1, 50);
      const lastPage = getCarsForPage(result.rankedCars, 20, 50);
      
      expect(firstPage[0].rank).toBe(1);
      expect(firstPage[49].rank).toBe(50);
      expect(lastPage[0].rank).toBe(951);
      expect(lastPage[49].rank).toBe(1000);
    });

    it('should find specific car rankings correctly', () => {
      const cars = generateLargeCarDataset(100);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      // Test finding specific cars
      const testCarId = cars[25].id;
      const carRankingInfo = getCarRankingInfo(testCarId, result.rankedCars);
      
      expect(carRankingInfo).not.toBeNull();
      expect(carRankingInfo!.id).toBe(testCarId);
      expect(carRankingInfo!.rank).toBeGreaterThan(0);
      expect(carRankingInfo!.rank).toBeLessThanOrEqual(100);
      expect(carRankingInfo!.pageNumber).toBeGreaterThan(0);
      expect(carRankingInfo!.pageNumber).toBeLessThanOrEqual(2);
    });
  });

  describe('Cross-Page Consistency Validation', () => {
    it('should maintain strict ordering across all page boundaries', () => {
      const cars = generateLargeCarDataset(500);
      const sortOptions: SortOption[] = ['price_low', 'price_high', 'year_new', 'year_old', 'mileage_low', 'mileage_high'];
      
      sortOptions.forEach(sortOption => {
        const result = applyChronologicalRanking(cars, sortOption, 50);
        
        // Validate overall ranking
        expect(validateChronologicalRanking(result.rankedCars, sortOption)).toBe(true);
        
        // Check every page boundary for consistency
        for (let page = 2; page <= result.totalPages; page++) {
          const prevPageCars = getCarsForPage(result.rankedCars, page - 1, 50);
          const currPageCars = getCarsForPage(result.rankedCars, page, 50);
          
          const lastPrevCar = prevPageCars[prevPageCars.length - 1];
          const firstCurrCar = currPageCars[0];
          
          // Verify rank continuity
          expect(firstCurrCar.rank).toBe(lastPrevCar.rank + 1);
          
          // Verify sort order continuity based on sort option
          verifyOrderContinuity(lastPrevCar, firstCurrCar, sortOption);
        }
      });
    });
  });
});

// Helper function to verify order continuity between two cars
function verifyOrderContinuity(car1: any, car2: any, sortOption: SortOption) {
  switch (sortOption) {
    case 'price_low':
      expect(car1.lots[0].buy_now).toBeLessThanOrEqual(car2.lots[0].buy_now);
      break;
    case 'price_high':
      expect(car1.lots[0].buy_now).toBeGreaterThanOrEqual(car2.lots[0].buy_now);
      break;
    case 'year_new':
      expect(parseInt(car1.year)).toBeGreaterThanOrEqual(parseInt(car2.year));
      break;
    case 'year_old':
      expect(parseInt(car1.year)).toBeLessThanOrEqual(parseInt(car2.year));
      break;
    case 'mileage_low':
      expect(car1.lots[0].odometer.km).toBeLessThanOrEqual(car2.lots[0].odometer.km);
      break;
    case 'mileage_high':
      expect(car1.lots[0].odometer.km).toBeGreaterThanOrEqual(car2.lots[0].odometer.km);
      break;
  }
}