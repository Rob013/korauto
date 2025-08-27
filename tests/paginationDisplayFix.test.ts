import { describe, it, expect } from 'vitest';
import { getPaginationStats } from '@/utils/largePaginationUtils';

describe('Pagination Display Fix', () => {
  it('should show correct pagination stats for 217 cars across 5 pages on page 2', () => {
    const currentPage = 2;
    const totalItems = 217;
    const itemsPerPage = 50;

    const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

    expect(stats.displayText).toBe('217 items total • Page 2 of 5 • Showing 50 items');
    expect(stats.showing).toBe('Showing 51-100 of 217');
    expect(stats.shortText).toBe('217 items');
  });

  it('should show correct pagination stats for last page with fewer items', () => {
    const currentPage = 5;
    const totalItems = 217;
    const itemsPerPage = 50;

    const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

    expect(stats.displayText).toBe('217 items total • Page 5 of 5 • Showing 17 items');
    expect(stats.showing).toBe('Showing 201-217 of 217');
    expect(stats.shortText).toBe('217 items');
  });

  it('should handle edge case with 0 items', () => {
    const currentPage = 1;
    const totalItems = 0;
    const itemsPerPage = 50;

    const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

    expect(stats.displayText).toBe('No items found');
    expect(stats.showing).toBe('Showing 0 items');
    expect(stats.shortText).toBe('0 items');
  });

  it('should show correct stats for a single page with few items', () => {
    const currentPage = 1;
    const totalItems = 25;
    const itemsPerPage = 50;

    const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

    expect(stats.displayText).toBe('25 items total • Page 1 of 1 • Showing 25 items');
    expect(stats.showing).toBe('Showing 1-25 of 25');
    expect(stats.shortText).toBe('25 items');
  });
});