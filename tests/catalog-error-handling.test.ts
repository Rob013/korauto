import { describe, it, expect } from 'vitest';

// Simple unit test for the error display logic
describe('Catalog Error Display Logic', () => {
  it('should only show error when error exists, not using fallback data, and no cars loaded', () => {
    // Test the logic that determines whether to show an error (matches SimpleCatalog.tsx logic)
    const shouldShowError = (error: string | null, isUsingFallbackData: boolean, carsLength: number) => {
      return !!(error && !isUsingFallbackData && carsLength === 0);
    };

    // Should NOT show error when using fallback data (even with error)
    expect(shouldShowError('Failed to fetch', true, 8)).toBe(false);
    
    // Should NOT show error when cars are loaded (even with error)
    expect(shouldShowError('Failed to fetch', false, 5)).toBe(false);
    
    // Should show error when no fallback data and no cars
    expect(shouldShowError('Failed to fetch', false, 0)).toBe(true);
    
    // Should NOT show error when no error exists
    expect(shouldShowError(null, false, 0)).toBe(false);
    
    // Should NOT show error when using fallback with no cars (edge case)
    expect(shouldShowError('Failed to fetch', true, 0)).toBe(false);
  });

  it('should handle edge cases correctly', () => {
    const shouldShowError = (error: string | null, isUsingFallbackData: boolean, carsLength: number) => {
      return !!(error && !isUsingFallbackData && carsLength === 0);
    };

    // Empty string error should not show (falsy)
    expect(shouldShowError('', false, 0)).toBe(false);
    
    // Negative cars length (edge case) - should NOT show error because -1 !== 0
    expect(shouldShowError('Error', false, -1)).toBe(false);
    
    // Large number of cars - should NOT show error
    expect(shouldShowError('Error', false, 1000)).toBe(false);
    
    // Exactly zero cars with error should show
    expect(shouldShowError('Network Error', false, 0)).toBe(true);
  });
});