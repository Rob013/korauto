import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalSortingService } from '@/services/globalSortingService';

describe('Global Sorting Threshold Fix', () => {
  let globalSortingService: GlobalSortingService;

  beforeEach(() => {
    globalSortingService = new GlobalSortingService();
  });

  it('should use lowered threshold to enable global sorting for smaller datasets', () => {
    // Test the new lowered threshold from the service
    const defaultThreshold = 5; // Updated value to solve problem statement
    
    // Test cases around the new threshold
    expect(globalSortingService.shouldUseGlobalSorting(3)).toBe(false);  // Below threshold
    expect(globalSortingService.shouldUseGlobalSorting(5)).toBe(false);  // At threshold
    expect(globalSortingService.shouldUseGlobalSorting(6)).toBe(true);   // Above threshold
    expect(globalSortingService.shouldUseGlobalSorting(15)).toBe(true);  // Small dataset that should now work
    expect(globalSortingService.shouldUseGlobalSorting(25)).toBe(true);  // Previously problematic case
    expect(globalSortingService.shouldUseGlobalSorting(50)).toBe(true);  // Well above threshold
    expect(globalSortingService.shouldUseGlobalSorting(100)).toBe(true); // Large dataset
  });

  it('should solve problem statement for typical small-to-medium datasets', () => {
    // This test ensures users get global sorting when they expect it
    // Problem statement: "When user selects sorting - call all api data and sort all of them"
    
    const typicalCaseCounts = [6, 10, 15, 20, 25, 35, 45];
    
    typicalCaseCounts.forEach(count => {
      const shouldUseGlobal = globalSortingService.shouldUseGlobalSorting(count);
      expect(shouldUseGlobal).toBe(true);
      console.log(`✅ ${count} cars: Global sorting = ${shouldUseGlobal} (was previously false for ${count <= 30 ? 'this case' : 'smaller cases'})`);
    });
  });

  it('should allow custom threshold configuration', () => {
    // Test that custom thresholds work correctly
    expect(globalSortingService.shouldUseGlobalSorting(100, 50)).toBe(true);  // 100 > 50
    expect(globalSortingService.shouldUseGlobalSorting(50, 50)).toBe(false);  // 50 = 50
    expect(globalSortingService.shouldUseGlobalSorting(25, 50)).toBe(false);  // 25 < 50
    
    // Test with higher threshold
    expect(globalSortingService.shouldUseGlobalSorting(75, 100)).toBe(false); // 75 < 100
    expect(globalSortingService.shouldUseGlobalSorting(101, 100)).toBe(true); // 101 > 100
  });
});