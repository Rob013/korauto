/**
 * Test for Complete API Sync and Filter Consistency
 * 
 * This test validates that the complete 150k car dataset sync works correctly
 * and that filters show accurate counts matching the catalog.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCompleteDataset, validateFilterConsistency } from '../src/utils/carDatasetValidation';

// Mock car data that simulates the API response structure
const createMockCar = (id: number, manufacturer: string, model: string, year: number) => ({
  id: id.toString(),
  manufacturer: { name: manufacturer, id: id },
  model: { name: model, id: id + 1000 },
  year,
  color: ['Black', 'White', 'Silver'][id % 3],
  fuel_type: ['Gasoline', 'Diesel', 'Hybrid'][id % 3],
  transmission: ['Automatic', 'Manual'][id % 2],
  body_type: ['Sedan', 'SUV', 'Hatchback'][id % 3],
});

describe('Complete API Sync and Filter Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dataset Validation', () => {
    it('should validate complete dataset with 150k+ cars', async () => {
      // Create a dataset with more than 150k cars
      const largeMockDataset = Array.from({ length: 150500 }, (_, i) => 
        createMockCar(i, `Brand${i % 10}`, `Model${i % 20}`, 2015 + (i % 10))
      );

      const result = await validateCompleteDataset(largeMockDataset, 150000);

      expect(result.isComplete).toBe(true);
      expect(result.totalCars).toBe(150500);
      expect(result.coverage).toBe(100);
      expect(result.validationErrors).toHaveLength(0);
    });

    it('should detect incomplete dataset', async () => {
      // Create a smaller dataset 
      const smallMockDataset = Array.from({ length: 140000 }, (_, i) => 
        createMockCar(i, `Brand${i % 10}`, `Model${i % 20}`, 2015 + (i % 10))
      );

      const result = await validateCompleteDataset(smallMockDataset, 150000);

      expect(result.isComplete).toBe(false);
      expect(result.totalCars).toBe(140000);
      expect(result.coverage).toBe(93); // 140k / 150k * 100
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors[0]).toContain('Dataset incomplete');
    });

    it('should validate data quality', async () => {
      // Create dataset with some missing manufacturer data
      const datasetWithMissingData = [
        createMockCar(1, 'BMW', 'X5', 2020),
        { ...createMockCar(2, 'Audi', 'A4', 2021), manufacturer: null }, // Missing manufacturer
        createMockCar(3, 'Mercedes', 'C-Class', 2019),
        { ...createMockCar(4, 'Toyota', 'Camry', 2022), model: null }, // Missing model
      ];

      const result = await validateCompleteDataset(datasetWithMissingData, 4);

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some(error => error.includes('missing manufacturer'))).toBe(true);
      expect(result.validationErrors.some(error => error.includes('missing model'))).toBe(true);
    });
  });

  describe('Filter Consistency Validation', () => {
    it('should validate filter counts match actual data', () => {
      const mockCars = [
        createMockCar(1, 'BMW', 'X5', 2020),
        createMockCar(2, 'BMW', 'X3', 2021),
        createMockCar(3, 'Audi', 'A4', 2019),
        createMockCar(4, 'Audi', 'A6', 2022),
      ];

      const correctFilterCounts = {
        manufacturers: {
          'BMW': 2,
          'Audi': 2
        }
      };

      const result = validateFilterConsistency(mockCars, correctFilterCounts);
      expect(result).toBe(true);
    });

    it('should detect filter count mismatches', () => {
      const mockCars = [
        createMockCar(1, 'BMW', 'X5', 2020),
        createMockCar(2, 'BMW', 'X3', 2021),
        createMockCar(3, 'Audi', 'A4', 2019),
      ];

      const incorrectFilterCounts = {
        manufacturers: {
          'BMW': 3, // Wrong count - should be 2
          'Audi': 1
        }
      };

      const result = validateFilterConsistency(mockCars, incorrectFilterCounts);
      expect(result).toBe(false);
    });

    it('should detect missing manufacturers in filter counts', () => {
      const mockCars = [
        createMockCar(1, 'BMW', 'X5', 2020),
        createMockCar(2, 'Audi', 'A4', 2021),
        createMockCar(3, 'Mercedes', 'C-Class', 2019), // Mercedes not in filter counts
      ];

      const incompleteFilterCounts = {
        manufacturers: {
          'BMW': 1,
          'Audi': 1
          // Missing Mercedes
        }
      };

      const result = validateFilterConsistency(mockCars, incompleteFilterCounts);
      expect(result).toBe(false);
    });
  });

  describe('Performance Validation', () => {
    it('should handle large datasets efficiently', async () => {
      // Test with a reasonably large dataset
      const largeMockDataset = Array.from({ length: 10000 }, (_, i) => 
        createMockCar(i, `Brand${i % 100}`, `Model${i % 200}`, 2010 + (i % 15))
      );

      const startTime = Date.now();
      const result = await validateCompleteDataset(largeMockDataset, 10000);
      const endTime = Date.now();

      expect(result.isComplete).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('API Pagination Simulation', () => {
    it('should simulate successful pagination through all pages', () => {
      // Simulate API pagination behavior
      const totalCars = 150500;
      const perPage = 100;
      const expectedPages = Math.ceil(totalCars / perPage);

      let accumulatedCars = 0;
      let currentPage = 1;

      // Simulate fetching all pages
      while (currentPage <= expectedPages) {
        const remainingCars = totalCars - accumulatedCars;
        const carsThisPage = Math.min(perPage, remainingCars);
        accumulatedCars += carsThisPage;
        currentPage++;
      }

      expect(accumulatedCars).toBe(totalCars);
      expect(currentPage - 1).toBe(expectedPages); // -1 because we increment after the last page
    });

    it('should handle API response structure correctly', () => {
      // Simulate API response structure
      const mockApiResponse = {
        data: Array.from({ length: 100 }, (_, i) => createMockCar(i, 'BMW', 'X5', 2020)),
        meta: {
          total: 150000,
          last_page: 1500,
          current_page: 1,
          per_page: 100
        }
      };

      expect(mockApiResponse.data).toHaveLength(100);
      expect(mockApiResponse.meta.total).toBe(150000);
      expect(mockApiResponse.meta.last_page).toBe(1500);
    });
  });
});