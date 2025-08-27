import { describe, it, expect } from 'vitest';
import { getPaginationStats, calculatePaginationInfo } from '@/utils/largePaginationUtils';

describe('Pagination Display Fix', () => {
  describe('Problem Statement Scenario - 217 cars across 5 pages', () => {
    it('should show correct pagination text for page 2 of 5 (problem statement scenario)', () => {
      // This is the exact scenario from the problem statement
      const currentPage = 2;
      const totalItems = 217;
      const itemsPerPage = 50;

      const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

      // After fix, should show "50 cars per page" not "0 cars per page"
      expect(stats.displayText).toBe('217 cars across 5 pages • Page 2 of 5 • Showing 50 cars per page');
      expect(stats.showing).toBe('Page 2 of 5 • 50 cars shown');
      expect(stats.shortText).toBe('217 cars');
    });

    it('should show correct pagination text for page 2 of 5 with actual displayed items', () => {
      // This simulates the fix where actual displayed cars are passed
      const currentPage = 2;
      const totalItems = 217;
      const itemsPerPage = 50;
      const actualDisplayed = 0; // This is the problem case - 0 cars actually displayed

      const stats = getPaginationStats(currentPage, totalItems, itemsPerPage, actualDisplayed);

      // Should show actual displayed items (0) instead of theoretical (50)
      expect(stats.displayText).toBe('217 cars across 5 pages • Page 2 of 5 • Showing 0 cars per page');
      expect(stats.showing).toBe('Page 2 of 5 • 0 cars shown');
      expect(stats.shortText).toBe('217 cars');
    });

    it('should show correct pagination text when actual items match theoretical', () => {
      // Normal case where actual displayed matches theoretical
      const currentPage = 2;
      const totalItems = 217;
      const itemsPerPage = 50;
      const actualDisplayed = 50; // Actual matches theoretical

      const stats = getPaginationStats(currentPage, totalItems, itemsPerPage, actualDisplayed);

      expect(stats.displayText).toBe('217 cars across 5 pages • Page 2 of 5 • Showing 50 cars per page');
      expect(stats.showing).toBe('Page 2 of 5 • 50 cars shown');
      expect(stats.shortText).toBe('217 cars');
    });
  });

  describe('getPaginationStats', () => {
    it('should show correct pagination stats for 217 cars across 5 pages on page 2', () => {
      const currentPage = 2;
      const totalItems = 217;
      const itemsPerPage = 50;

      const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

      expect(stats.displayText).toBe('217 cars across 5 pages • Page 2 of 5 • Showing 50 cars per page');
      expect(stats.showing).toBe('Page 2 of 5 • 50 cars shown');
      expect(stats.shortText).toBe('217 cars');
    });

    it('should show correct pagination stats for last page with fewer items', () => {
      const currentPage = 5;
      const totalItems = 217;
      const itemsPerPage = 50;

      const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

      expect(stats.displayText).toBe('217 cars across 5 pages • Page 5 of 5 • Showing 17 cars per page');
      expect(stats.showing).toBe('Page 5 of 5 • 17 cars shown');
      expect(stats.shortText).toBe('217 cars');
    });

    it('should handle edge case with 0 items', () => {
      const currentPage = 1;
      const totalItems = 0;
      const itemsPerPage = 50;

      const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

      expect(stats.displayText).toBe('No cars found');
      expect(stats.showing).toBe('Showing 0 cars');
      expect(stats.shortText).toBe('0 cars');
    });

    it('should show correct stats for a single page with few items', () => {
      const currentPage = 1;
      const totalItems = 25;
      const itemsPerPage = 50;

      const stats = getPaginationStats(currentPage, totalItems, itemsPerPage);

      expect(stats.displayText).toBe('25 cars across 1 pages • Page 1 of 1 • Showing 25 cars per page');
      expect(stats.showing).toBe('Page 1 of 1 • 25 cars shown');
      expect(stats.shortText).toBe('25 cars');
    });

    it('should handle first page correctly', () => {
      const stats = getPaginationStats(1, 217, 50);
      
      expect(stats.displayText).toBe('217 cars across 5 pages • Page 1 of 5 • Showing 50 cars per page');
      expect(stats.showing).toBe('Page 1 of 5 • 50 cars shown');
    });

    it('should handle large numbers with proper formatting', () => {
      const stats = getPaginationStats(100, 180000, 50);
      
      expect(stats.displayText).toBe('180,000 cars across 3,600 pages • Page 100 of 3,600 • Showing 50 cars per page');
      expect(stats.showing).toBe('Page 100 of 3,600 • 50 cars shown');
    });
  });

  describe('calculatePaginationInfo edge cases', () => {
    it('should handle out of bounds page numbers', () => {
      const info = calculatePaginationInfo(10, 217, 50); // Page 10 when only 5 pages exist
      
      expect(info.currentPage).toBe(5); // Should clamp to last page
      expect(info.itemsOnCurrentPage).toBe(17); // Last page has 17 items
    });

    it('should handle zero page numbers', () => {
      const info = calculatePaginationInfo(0, 217, 50);
      
      expect(info.currentPage).toBe(1); // Should clamp to first page
      expect(info.itemsOnCurrentPage).toBe(50);
    });

    it('should handle negative page numbers', () => {
      const info = calculatePaginationInfo(-1, 217, 50);
      
      expect(info.currentPage).toBe(1); // Should clamp to first page
      expect(info.itemsOnCurrentPage).toBe(50);
    });
  });
});