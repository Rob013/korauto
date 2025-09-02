/**
 * Test for pagination display improvements when sync is incomplete
 * Addresses the issue: "152,048 cars across 3,041 pages • Page 1 of 3,041 • Showing 0 cars per page"
 */

import { describe, it, expect } from 'vitest';
import { getPaginationStatsWithSync } from '@/utils/largePaginationUtils';

describe('Pagination Sync Fix', () => {
  
  it('should show meaningful message when totalCount > 0 but no cars loaded', () => {
    // This is the exact problem scenario
    const currentPage = 1;
    const totalItems = 152048; // From problem statement
    const actualLoadedItems = 0; // No cars actually loaded
    const itemsPerPage = 50;

    const result = getPaginationStatsWithSync(
      currentPage,
      totalItems,
      actualLoadedItems,
      itemsPerPage
    );

    expect(result.isInconsistent).toBe(true);
    expect(result.displayText).toContain('152,048 cars available');
    expect(result.displayText).toContain('Loading cars...');
    expect(result.showing).toBe('Loading cars from database...');
    expect(result.displayText).not.toContain('Showing 0 cars per page');
  });

  it('should show normal pagination when cars are loaded properly', () => {
    const currentPage = 1;
    const totalItems = 152048;
    const actualLoadedItems = 50; // Cars are properly loaded
    const itemsPerPage = 50;

    const result = getPaginationStatsWithSync(
      currentPage,
      totalItems,
      actualLoadedItems,
      itemsPerPage
    );

    expect(result.isInconsistent).toBe(false);
    expect(result.displayText).toContain('152,048 cars across');
    expect(result.displayText).toContain('Showing 50 cars per page');
    expect(result.showing).toBe('Showing 50 cars per page');
  });

  it('should handle edge case with no items at all', () => {
    const currentPage = 1;
    const totalItems = 0;
    const actualLoadedItems = 0;
    const itemsPerPage = 50;

    const result = getPaginationStatsWithSync(
      currentPage,
      totalItems,
      actualLoadedItems,
      itemsPerPage
    );

    expect(result.isInconsistent).toBe(false);
    expect(result.displayText).toBe('No items found');
    expect(result.showing).toBe('Showing 0 items');
  });

  it('should handle partial loading scenario', () => {
    // Scenario: API says 10000 cars, but only 25 loaded
    const currentPage = 1;
    const totalItems = 10000;
    const actualLoadedItems = 25; // Partial loading
    const itemsPerPage = 50;

    const result = getPaginationStatsWithSync(
      currentPage,
      totalItems,
      actualLoadedItems,
      itemsPerPage
    );

    expect(result.isInconsistent).toBe(false);
    expect(result.displayText).toContain('10,000 cars across');
    expect(result.displayText).toContain('Showing 25 cars per page');
    expect(result.showing).toBe('Showing 25 cars per page');
  });

  it('should format large numbers correctly', () => {
    const currentPage = 1;
    const totalItems = 1500000; // 1.5 million
    const actualLoadedItems = 0;
    const itemsPerPage = 50;

    const result = getPaginationStatsWithSync(
      currentPage,
      totalItems,
      actualLoadedItems,
      itemsPerPage
    );

    expect(result.isInconsistent).toBe(true);
    expect(result.displayText).toContain('1,500,000 cars available');
    expect(result.shortText).toBe('1,500,000 cars');
  });

  it('should calculate page numbers correctly for large datasets', () => {
    // Test the exact scenario from problem statement
    const currentPage = 1;
    const totalItems = 152048;
    const actualLoadedItems = 0;
    const itemsPerPage = 50;
    const expectedTotalPages = Math.ceil(152048 / 50); // 3041 pages

    const result = getPaginationStatsWithSync(
      currentPage,
      totalItems,
      actualLoadedItems,
      itemsPerPage
    );

    expect(result.displayText).toContain(`Page 1 of ${expectedTotalPages.toLocaleString()}`);
    expect(result.displayText).toContain('3,041'); // Should format the number
  });

  it('should provide different messages for inconsistent vs normal states', () => {
    // Test that the function clearly distinguishes between sync issues and normal operation
    
    // Sync issue case
    const inconsistentResult = getPaginationStatsWithSync(1, 100000, 0, 50);
    expect(inconsistentResult.isInconsistent).toBe(true);
    expect(inconsistentResult.showing).toContain('Loading');
    
    // Normal case
    const normalResult = getPaginationStatsWithSync(1, 100000, 50, 50);
    expect(normalResult.isInconsistent).toBe(false);
    expect(normalResult.showing).toContain('Showing 50 cars');
    
    // They should be clearly different
    expect(inconsistentResult.showing).not.toBe(normalResult.showing);
    expect(inconsistentResult.displayText).not.toBe(normalResult.displayText);
  });
});