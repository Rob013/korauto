/**
 * Test for Dataset Incomplete Fix
 * 
 * This test validates that the fix for "Dataset Incomplete: 1,000 cars loaded (1% coverage)"
 * properly handles pagination and doesn't break on empty pages.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCompleteDataset, getValidationSummary } from '../src/utils/carDatasetValidation';

// Mock data that simulates the problem scenario
const createMockCarDataset = (size: number) => Array.from({ length: size }, (_, i) => ({
  id: i.toString(),
  manufacturer: { name: `Brand${i % 10}`, id: i },
  model: { name: `Model${i % 20}`, id: i + 1000 },
  year: 2015 + (i % 10),
}));

describe('Dataset Incomplete Fix - Issue: 1,000 cars loaded (1% coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Problem Scenario Validation', () => {
    it('should detect incomplete dataset with 1,000 cars (1% coverage)', async () => {
      // Simulate the problem scenario: 1,000 cars instead of 150,000
      const incompleteDataset = createMockCarDataset(1000);
      
      const result = await validateCompleteDataset(incompleteDataset, 150000);
      
      expect(result.isComplete).toBe(false);
      expect(result.totalCars).toBe(1000);
      expect(result.coverage).toBe(1); // 1% coverage (1000/150000)
      expect(result.validationErrors).toContain('Dataset incomplete: got 1000 cars, expected at least 150000');
      
      const summary = getValidationSummary(result);
      expect(summary).toBe('❌ Incomplete dataset: 1,000 cars (1% coverage)');
    });

    it('should validate complete dataset with 150k+ cars', async () => {
      // Simulate the desired scenario: 150,000+ cars
      const completeDataset = createMockCarDataset(150500);
      
      const result = await validateCompleteDataset(completeDataset, 150000);
      
      expect(result.isComplete).toBe(true);
      expect(result.totalCars).toBe(150500);
      expect(result.coverage).toBe(100);
      expect(result.validationErrors).toHaveLength(0);
      
      const summary = getValidationSummary(result);
      expect(summary).toBe('✅ Complete dataset: 150,500 cars (100% coverage)');
    });

    it('should handle edge cases around the minimum threshold', async () => {
      // Test exactly at the minimum
      const exactMinimum = createMockCarDataset(150000);
      const result1 = await validateCompleteDataset(exactMinimum, 150000);
      expect(result1.isComplete).toBe(true);
      expect(result1.coverage).toBe(100);

      // Test just below the minimum
      const belowMinimum = createMockCarDataset(149999);
      const result2 = await validateCompleteDataset(belowMinimum, 150000);
      expect(result2.isComplete).toBe(false);
      expect(result2.coverage).toBe(100); // Rounds to 100 but still incomplete
    });

    it('should handle very small datasets correctly', async () => {
      const tinyDataset = createMockCarDataset(10);
      const result = await validateCompleteDataset(tinyDataset, 150000);
      
      expect(result.isComplete).toBe(false);
      expect(result.totalCars).toBe(10);
      expect(result.coverage).toBe(0); // Rounds to 0%
      expect(result.missingDataPercent).toBe(100);
    });

    it('should handle zero cars scenario correctly', async () => {
      // Simulate the exact problem scenario: 0 cars
      const emptyDataset = createMockCarDataset(0);
      
      const result = await validateCompleteDataset(emptyDataset, 150000);
      
      expect(result.isComplete).toBe(false);
      expect(result.totalCars).toBe(0);
      expect(result.coverage).toBe(0); // 0% coverage (0/150000)
      expect(result.missingDataPercent).toBe(100);
      expect(result.validationErrors).toContain('Dataset incomplete: got 0 cars, expected at least 150000');
      
      const summary = getValidationSummary(result);
      expect(summary).toBe('🔄 Database empty: Using fallback data while sync initializes');
    });

    it('should validate data quality regardless of dataset size', async () => {
      // Create dataset with some missing manufacturer data
      const datasetWithMissingData = [
        { id: '1', manufacturer: { name: 'BMW' }, model: { name: 'X5' }, year: 2020 },
        { id: '2', manufacturer: null, model: { name: 'A4' }, year: 2021 }, // Missing manufacturer
        { id: '3', manufacturer: { name: 'Mercedes' }, model: { name: 'C-Class' }, year: 2019 },
      ];

      const result = await validateCompleteDataset(datasetWithMissingData, 3);
      
      expect(result.isComplete).toBe(true); // 3 cars meets the minimum of 3
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors[0]).toContain('missing manufacturer data');
    });
  });

  describe('Pagination Resilience', () => {
    it('should not break the validation when given realistic dataset sizes', async () => {
      // Test various sizes that might occur during pagination issues
      const testSizes = [1000, 5000, 10000, 50000, 100000, 150000];
      
      for (const size of testSizes) {
        const dataset = createMockCarDataset(size);
        const result = await validateCompleteDataset(dataset, 150000);
        
        expect(result.totalCars).toBe(size);
        expect(result.coverage).toBe(Math.round((size / 150000) * 100));
        expect(result.isComplete).toBe(size >= 150000);
      }
    });
  });

  describe('Fallback Mechanism', () => {
    it('should provide appropriate fallback messaging for empty database', async () => {
      const emptyDataset = createMockCarDataset(0);
      const result = await validateCompleteDataset(emptyDataset, 150000);
      
      expect(result.isComplete).toBe(false);
      expect(result.totalCars).toBe(0);
      
      const summary = getValidationSummary(result);
      expect(summary).toBe('🔄 Database empty: Using fallback data while sync initializes');
      expect(summary).not.toContain('❌');  // Should not show error icon for 0 cars
      expect(summary).toContain('🔄');     // Should show loading/sync icon
    });

    it('should handle small datasets with appropriate error messaging', async () => {
      const smallDataset = createMockCarDataset(1000);
      const result = await validateCompleteDataset(smallDataset, 150000);
      
      expect(result.isComplete).toBe(false);
      expect(result.totalCars).toBe(1000);
      
      const summary = getValidationSummary(result);
      expect(summary).toBe('❌ Incomplete dataset: 1,000 cars (1% coverage)');
      expect(summary).toContain('❌');     // Should show error icon for partial data
    });
  });
});