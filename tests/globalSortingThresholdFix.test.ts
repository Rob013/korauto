import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalSortingService } from '@/services/globalSortingService';

describe('Global Sorting Threshold Fix', () => {
  let globalSortingService: GlobalSortingService;

  beforeEach(() => {
    globalSortingService = new GlobalSortingService();
  });

  it('should use consistent threshold between service and components', () => {
    // Test the default threshold from the service
    const defaultThreshold = 30; // Default value from globalSortingService.ts line 104
    
    // Test cases around the threshold
    expect(globalSortingService.shouldUseGlobalSorting(25)).toBe(false); // Below threshold
    expect(globalSortingService.shouldUseGlobalSorting(30)).toBe(false); // At threshold
    expect(globalSortingService.shouldUseGlobalSorting(31)).toBe(true);  // Above threshold
    expect(globalSortingService.shouldUseGlobalSorting(50)).toBe(true);  // Well above threshold
    expect(globalSortingService.shouldUseGlobalSorting(100)).toBe(true); // Large dataset
  });

  it('should handle edge case between 31-50 cars correctly', () => {
    // This test ensures the fix for the threshold inconsistency
    // Previously: service said "use global sorting" (>30) but component said "let hook handle it" (<=50)
    
    const edgeCaseCounts = [31, 35, 40, 45, 50];
    
    edgeCaseCounts.forEach(count => {
      const shouldUseGlobal = globalSortingService.shouldUseGlobalSorting(count);
      expect(shouldUseGlobal).toBe(true);
      console.log(`✅ ${count} cars: Global sorting = ${shouldUseGlobal}`);
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