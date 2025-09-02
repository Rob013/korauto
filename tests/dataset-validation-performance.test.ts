import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateCompleteDataset } from '@/utils/carDatasetValidation';

describe('Dataset Validation Performance Improvements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should handle large datasets without blocking the main thread', async () => {
    // Create a large mock dataset
    const largeMockDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      manufacturer: { name: `Manufacturer ${i % 100}` },
      model: { name: `Model ${i % 500}` },
      year: 2020 + (i % 5)
    }));

    const startTime = Date.now();
    
    const result = await validateCompleteDataset(largeMockDataset, 8000);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Should complete within reasonable time (5 seconds for 10k cars)
    expect(executionTime).toBeLessThan(5000);
    
    // Should return correct results
    expect(result.totalCars).toBe(10000);
    expect(result.isComplete).toBe(true);
    expect(result.coverage).toBe(125); // 10k/8k * 100
    expect(result.validationErrors).toHaveLength(0);
  });

  it('should use chunked processing for very large datasets', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create a dataset large enough to trigger chunked processing
    const veryLargeDataset = Array.from({ length: 6000 }, (_, i) => ({
      id: i,
      manufacturer: { name: `Manufacturer ${i % 50}` },
      model: { name: `Model ${i % 200}` },
      year: 2015 + (i % 10)
    }));

    await validateCompleteDataset(veryLargeDataset, 5000);
    
    // Should log chunked processing message
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Starting chunked validation for 6000 cars')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Chunked validation completed for 6000 cars')
    );

    consoleSpy.mockRestore();
  });

  it('should cache validation results for identical datasets', async () => {
    const mockDataset = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      manufacturer: { name: `Manufacturer ${i % 10}` },
      model: { name: `Model ${i % 20}` },
      year: 2020
    }));

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // First validation
    const result1 = await validateCompleteDataset(mockDataset, 100);
    
    // Second validation (should use cache)
    const result2 = await validateCompleteDataset(mockDataset, 100);
    
    expect(result1).toEqual(result2);
    
    // Should have used cache on second call
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Using cached validation result for 100 cars')
    );

    consoleSpy.mockRestore();
  });

  it('should handle datasets with missing data gracefully', async () => {
    const incompleteDataset = [
      { id: 1, manufacturer: { name: 'Toyota' }, model: { name: 'Camry' }, year: 2020 },
      { id: 2, manufacturer: null, model: { name: 'Accord' }, year: 2021 },
      { id: 3, manufacturer: { name: 'Ford' }, model: null, year: null },
      { id: 4, manufacturer: { name: 'BMW' }, model: { name: 'X5' }, year: 2019 }
    ];

    const result = await validateCompleteDataset(incompleteDataset, 4);

    expect(result.totalCars).toBe(4);
    expect(result.isComplete).toBe(true);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    
    // Should report missing data
    const hasManufacturerError = result.validationErrors.some(error => 
      error.includes('missing manufacturer data')
    );
    const hasModelError = result.validationErrors.some(error => 
      error.includes('missing model data')
    );
    const hasYearError = result.validationErrors.some(error => 
      error.includes('missing year data')
    );

    expect(hasManufacturerError || hasModelError || hasYearError).toBe(true);
  });

  it('should calculate coverage percentage correctly', async () => {
    const mockDataset = Array.from({ length: 750 }, (_, i) => ({
      id: i,
      manufacturer: { name: 'Test' },
      model: { name: 'Model' },
      year: 2020
    }));

    const result = await validateCompleteDataset(mockDataset, 1000);

    expect(result.coverage).toBe(75); // 750/1000 * 100
    expect(result.missingDataPercent).toBe(25);
    expect(result.isComplete).toBe(false);
    expect(result.validationErrors).toContain(
      'Dataset incomplete: got 750 cars, expected at least 1000'
    );
  });
});