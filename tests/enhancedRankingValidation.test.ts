/**
 * Test for enhanced cross-page ranking validation
 * Ensures perfect ranking consistency across all page boundaries
 */

import { describe, it, expect } from 'vitest';
import { 
  applyChronologicalRanking, 
  validateCrossPageRanking,
  isRankingConsistentAcrossPages
} from '../src/utils/chronologicalRanking';

describe('Enhanced Cross-Page Ranking Validation', () => {
  const generateTestCars = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `car-${i + 1}`,
      make: 'Toyota',
      model: 'Camry',
      year: 2020 + (i % 5),
      lots: [{
        buy_now: Math.floor(Math.random() * 50000) + 10000,
        odometer: { km: Math.floor(Math.random() * 200000) + 5000 }
      }],
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  describe('validateCrossPageRanking', () => {
    it('should validate perfect ranking across 5 pages of 50 cars each', () => {
      const cars = generateTestCars(250);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      const validation = validateCrossPageRanking(result.rankedCars, 50, 'price_low');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.pageValidations).toHaveLength(5);
      
      // Check each page validation
      validation.pageValidations.forEach((pageValidation, index) => {
        expect(pageValidation.page).toBe(index + 1);
        expect(pageValidation.isValid).toBe(true);
        expect(pageValidation.errors).toHaveLength(0);
      });
    });

    it('should detect ranking inconsistencies', () => {
      const cars = generateTestCars(100);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      // Artificially corrupt one ranking to test detection
      result.rankedCars[75].rank = 999; // This should be rank 76
      
      const validation = validateCrossPageRanking(result.rankedCars, 50, 'price_low');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Should detect the error on page 2
      const page2Validation = validation.pageValidations.find(pv => pv.page === 2);
      expect(page2Validation?.isValid).toBe(false);
    });

    it('should validate page boundary consistency', () => {
      const cars = generateTestCars(150);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      const validation = validateCrossPageRanking(result.rankedCars, 50, 'price_low');
      
      expect(validation.isValid).toBe(true);
      
      // Verify that page boundaries are explicitly checked
      expect(validation.pageValidations).toHaveLength(3);
      
      // All pages should be valid
      validation.pageValidations.forEach(pageValidation => {
        expect(pageValidation.isValid).toBe(true);
      });
    });

    it('should handle edge case of single partial page', () => {
      const cars = generateTestCars(25);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      const validation = validateCrossPageRanking(result.rankedCars, 50, 'price_low');
      
      expect(validation.isValid).toBe(true);
      expect(validation.pageValidations).toHaveLength(1);
      expect(validation.pageValidations[0].page).toBe(1);
      expect(validation.pageValidations[0].isValid).toBe(true);
    });

    it('should validate different sort options correctly', () => {
      const cars = generateTestCars(200);
      const sortOptions = ['price_low', 'price_high', 'year_new', 'year_old', 'mileage_low', 'mileage_high'];
      
      sortOptions.forEach(sortOption => {
        const result = applyChronologicalRanking(cars, sortOption as any, 50);
        const validation = validateCrossPageRanking(result.rankedCars, 50, sortOption as any);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.pageValidations).toHaveLength(4); // 200 cars / 50 per page = 4 pages
      });
    });
  });

  describe('isRankingConsistentAcrossPages', () => {
    it('should return true for perfectly ranked cars', () => {
      const cars = generateTestCars(300);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      const isConsistent = isRankingConsistentAcrossPages(result.rankedCars, 50);
      
      expect(isConsistent).toBe(true);
    });

    it('should return false for corrupted rankings', () => {
      const cars = generateTestCars(100);
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      
      // Corrupt a ranking
      result.rankedCars[50].rank = 1; // This should be rank 51
      
      const isConsistent = isRankingConsistentAcrossPages(result.rankedCars, 50);
      
      expect(isConsistent).toBe(false);
    });

    it('should handle empty array gracefully', () => {
      const isConsistent = isRankingConsistentAcrossPages([], 50);
      
      expect(isConsistent).toBe(true);
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should validate 1000 cars across 20 pages efficiently', () => {
      const cars = generateTestCars(1000);
      const startTime = Date.now();
      
      const result = applyChronologicalRanking(cars, 'price_low', 50);
      const validation = validateCrossPageRanking(result.rankedCars, 50, 'price_low');
      
      const endTime = Date.now();
      
      // Should complete validation within reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500);
      
      expect(validation.isValid).toBe(true);
      expect(validation.pageValidations).toHaveLength(20);
    });

    it('should validate 2000 cars with different page sizes', () => {
      const cars = generateTestCars(2000);
      const pageSizes = [25, 50, 100];
      
      pageSizes.forEach(pageSize => {
        const result = applyChronologicalRanking(cars, 'price_low', pageSize);
        const validation = validateCrossPageRanking(result.rankedCars, pageSize, 'price_low');
        
        expect(validation.isValid).toBe(true);
        expect(validation.pageValidations).toHaveLength(Math.ceil(2000 / pageSize));
      });
    });
  });
});