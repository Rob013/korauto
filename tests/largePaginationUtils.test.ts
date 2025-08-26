import { describe, it, expect } from 'vitest';
import {
  calculatePaginationInfo,
  formatPaginationNumber,
  generatePageRange,
  isValidPageNumber,
  getPaginationStats,
  generateApiPaginationParams,
  sliceDataForPage,
  getOptimizedPaginationConfig
} from '@/utils/largePaginationUtils';

describe('Large Pagination Utils', () => {

  describe('calculatePaginationInfo', () => {
    it('should handle the Audi A5 scenario (187 cars, 4 pages)', () => {
      const info = calculatePaginationInfo(4, 187, 50);
      
      expect(info.currentPage).toBe(4);
      expect(info.totalPages).toBe(4);
      expect(info.totalItems).toBe(187);
      expect(info.itemsPerPage).toBe(50);
      expect(info.startIndex).toBe(150);
      expect(info.endIndex).toBe(187);
      expect(info.itemsOnCurrentPage).toBe(37);
      expect(info.isFirstPage).toBe(false);
      expect(info.isLastPage).toBe(true);
      expect(info.hasNextPage).toBe(false);
      expect(info.hasPrevPage).toBe(true);
    });

    it('should handle large dataset scenario (180,000 cars, 3,600 pages)', () => {
      const info = calculatePaginationInfo(1800, 180000, 50);
      
      expect(info.currentPage).toBe(1800);
      expect(info.totalPages).toBe(3600);
      expect(info.totalItems).toBe(180000);
      expect(info.itemsPerPage).toBe(50);
      expect(info.startIndex).toBe(89950);
      expect(info.endIndex).toBe(90000);
      expect(info.itemsOnCurrentPage).toBe(50);
      expect(info.isFirstPage).toBe(false);
      expect(info.isLastPage).toBe(false);
      expect(info.hasNextPage).toBe(true);
      expect(info.hasPrevPage).toBe(true);
    });

    it('should clamp page numbers to valid bounds', () => {
      // Test page below minimum
      const infoBelow = calculatePaginationInfo(-1, 1000, 50);
      expect(infoBelow.currentPage).toBe(1);
      
      // Test page above maximum
      const infoAbove = calculatePaginationInfo(100, 1000, 50);
      expect(infoAbove.currentPage).toBe(20); // 1000/50 = 20 pages max
    });

    it('should handle edge cases', () => {
      // Empty dataset
      const empty = calculatePaginationInfo(1, 0, 50);
      expect(empty.totalPages).toBe(0);
      expect(empty.itemsOnCurrentPage).toBe(0);
      
      // Single item
      const single = calculatePaginationInfo(1, 1, 50);
      expect(single.totalPages).toBe(1);
      expect(single.itemsOnCurrentPage).toBe(1);
      
      // Exact multiple
      const exact = calculatePaginationInfo(2, 100, 50);
      expect(exact.totalPages).toBe(2);
      expect(exact.itemsOnCurrentPage).toBe(50);
    });
  });

  describe('formatPaginationNumber', () => {
    it('should format large numbers with commas', () => {
      expect(formatPaginationNumber(1000)).toBe('1,000');
      expect(formatPaginationNumber(25000)).toBe('25,000');
      expect(formatPaginationNumber(180000)).toBe('180,000');
      expect(formatPaginationNumber(3600)).toBe('3,600');
    });

    it('should handle small numbers', () => {
      expect(formatPaginationNumber(1)).toBe('1');
      expect(formatPaginationNumber(50)).toBe('50');
      expect(formatPaginationNumber(999)).toBe('999');
    });
  });

  describe('generatePageRange', () => {
    it('should show all pages for small datasets', () => {
      const range = generatePageRange(3, 5);
      expect(range).toEqual([1, 2, 3, 4, 5]);
    });

    it('should generate proper range for large datasets', () => {
      // Current page in middle
      const range1 = generatePageRange(1800, 3600, 5);
      expect(range1).toEqual([1, '...', 1798, 1799, 1800, 1801, 1802, '...', 3600]);
      
      // Current page near beginning
      const range2 = generatePageRange(3, 3600, 5);
      expect(range2).toEqual([1, 2, 3, 4, 5, '...', 3600]);
      
      // Current page near end
      const range3 = generatePageRange(3598, 3600, 5);
      expect(range3).toEqual([1, '...', 3596, 3597, 3598, 3599, 3600]);
    });

    it('should handle edge cases for large page numbers', () => {
      // First page
      const range1 = generatePageRange(1, 3600, 5);
      expect(range1[0]).toBe(1);
      expect(range1[range1.length - 1]).toBe(3600);
      
      // Last page
      const range2 = generatePageRange(3600, 3600, 5);
      expect(range2[0]).toBe(1);
      expect(range2[range2.length - 1]).toBe(3600);
    });
  });

  describe('isValidPageNumber', () => {
    it('should validate page numbers correctly', () => {
      expect(isValidPageNumber(1, 3600)).toBe(true);
      expect(isValidPageNumber(1800, 3600)).toBe(true);
      expect(isValidPageNumber(3600, 3600)).toBe(true);
      
      expect(isValidPageNumber(0, 3600)).toBe(false);
      expect(isValidPageNumber(-1, 3600)).toBe(false);
      expect(isValidPageNumber(3601, 3600)).toBe(false);
      expect(isValidPageNumber(1.5, 3600)).toBe(false);
    });
  });

  describe('getPaginationStats', () => {
    it('should generate correct stats for Audi A5 scenario', () => {
      const stats = getPaginationStats(4, 187, 50);
      
      expect(stats.displayText).toBe('187 items total • Page 4 of 4 • Showing 37 items');
      expect(stats.shortText).toBe('187 items');
      expect(stats.showing).toBe('Showing 151-187 of 187');
    });

    it('should generate correct stats for large dataset', () => {
      const stats = getPaginationStats(1800, 180000, 50);
      
      expect(stats.displayText).toBe('180,000 items total • Page 1,800 of 3,600 • Showing 50 items');
      expect(stats.shortText).toBe('180,000 items');
      expect(stats.showing).toBe('Showing 89,951-90,000 of 180,000');
    });

    it('should handle empty dataset', () => {
      const stats = getPaginationStats(1, 0, 50);
      
      expect(stats.displayText).toBe('No items found');
      expect(stats.shortText).toBe('0 items');
      expect(stats.showing).toBe('Showing 0 items');
    });
  });

  describe('generateApiPaginationParams', () => {
    it('should generate correct API parameters', () => {
      const params1 = generateApiPaginationParams(1, 50);
      expect(params1).toEqual({
        page: '1',
        per_page: '50',
        offset: '0',
        limit: '50'
      });

      const params1800 = generateApiPaginationParams(1800, 50);
      expect(params1800).toEqual({
        page: '1800',
        per_page: '50',
        offset: '89950',
        limit: '50'
      });

      const params3600 = generateApiPaginationParams(3600, 50);
      expect(params3600).toEqual({
        page: '3600',
        per_page: '50',
        offset: '179950',
        limit: '50'
      });
    });
  });

  describe('sliceDataForPage', () => {
    it('should slice data correctly for different pages', () => {
      const data = Array.from({ length: 187 }, (_, i) => ({ id: i + 1, model: 'A5' }));
      
      // Page 1: items 1-50
      const page1 = sliceDataForPage(data, 1, 50);
      expect(page1.length).toBe(50);
      expect(page1[0].id).toBe(1);
      expect(page1[49].id).toBe(50);
      
      // Page 4: items 151-187 (37 items)
      const page4 = sliceDataForPage(data, 4, 50);
      expect(page4.length).toBe(37);
      expect(page4[0].id).toBe(151);
      expect(page4[36].id).toBe(187);
    });

    it('should handle out-of-bounds pages gracefully by clamping to valid range', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      
      // Page beyond available data gets clamped to last valid page (page 2)
      const pageEmpty = sliceDataForPage(data, 5, 50);
      expect(pageEmpty.length).toBe(50); // Shows last 50 items (page 2)
      expect(pageEmpty[0].id).toBe(51); // First item on page 2
      expect(pageEmpty[49].id).toBe(100); // Last item
    });
  });

  describe('getOptimizedPaginationConfig', () => {
    it('should provide appropriate config for different dataset sizes', () => {
      // Small dataset
      const small = getOptimizedPaginationConfig(5);
      expect(small.showJumpToPage).toBe(false);
      expect(small.showFirstLastButtons).toBe(false);
      expect(small.showPageNumbers).toBe(true);
      expect(small.maxVisiblePages).toBe(5);
      
      // Medium dataset
      const medium = getOptimizedPaginationConfig(50);
      expect(medium.showJumpToPage).toBe(true);
      expect(medium.showFirstLastButtons).toBe(true);
      expect(medium.showPageNumbers).toBe(true);
      expect(medium.maxVisiblePages).toBe(5);
      
      // Large dataset (like our 3600 pages)
      const large = getOptimizedPaginationConfig(3600);
      expect(large.showJumpToPage).toBe(true);
      expect(large.showFirstLastButtons).toBe(true);
      expect(large.showPageNumbers).toBe(false); // Too many pages
      expect(large.maxVisiblePages).toBe(3);
      expect(large.enableKeyboardShortcuts).toBe(true);
    });
  });

  describe('Integration scenarios from problem statement', () => {
    it('should handle 180,000+ cars across 3000+ pages scenario', () => {
      const totalCars = 180000;
      const carsPerPage = 50;
      const expectedPages = 3600;
      
      // Test different page scenarios
      const scenarios = [
        { page: 1, expectedStart: 1, expectedEnd: 50 },
        { page: 1800, expectedStart: 89951, expectedEnd: 90000 },
        { page: 3600, expectedStart: 179951, expectedEnd: 180000 },
      ];
      
      scenarios.forEach(({ page, expectedStart, expectedEnd }) => {
        const info = calculatePaginationInfo(page, totalCars, carsPerPage);
        const stats = getPaginationStats(page, totalCars, carsPerPage);
        
        expect(info.totalPages).toBe(expectedPages);
        expect(info.startIndex + 1).toBe(expectedStart);
        expect(info.endIndex).toBe(expectedEnd);
        
        expect(stats.showing).toContain(`${expectedStart.toLocaleString()}-${expectedEnd.toLocaleString()}`);
      });
    });

    it('should handle Audi A5 filter scenario (187 cars → 4 pages)', () => {
      const totalCars = 187;
      const carsPerPage = 50;
      const expectedPages = 4;
      
      // Test all pages
      for (let page = 1; page <= expectedPages; page++) {
        const info = calculatePaginationInfo(page, totalCars, carsPerPage);
        const expectedCarsOnPage = page === 4 ? 37 : 50;
        
        expect(info.totalPages).toBe(expectedPages);
        expect(info.itemsOnCurrentPage).toBe(expectedCarsOnPage);
        
        if (page === 1) {
          expect(info.isFirstPage).toBe(true);
          expect(info.hasPrevPage).toBe(false);
        }
        
        if (page === expectedPages) {
          expect(info.isLastPage).toBe(true);
          expect(info.hasNextPage).toBe(false);
        }
      }
    });

    it('should provide efficient pagination for performance', () => {
      // Test that pagination calculations are O(1) for any page number
      const largePage = 2500;
      const totalCars = 500000;
      
      const startTime = performance.now();
      const info = calculatePaginationInfo(largePage, totalCars, 50);
      const apiParams = generateApiPaginationParams(largePage, 50);
      const stats = getPaginationStats(largePage, totalCars, 50);
      const endTime = performance.now();
      
      // Should be very fast (< 1ms)
      expect(endTime - startTime).toBeLessThan(1);
      
      // Results should be accurate
      expect(info.currentPage).toBe(largePage);
      expect(apiParams.page).toBe(largePage.toString());
      expect(stats.displayText).toContain('2,500');
    });
  });
});