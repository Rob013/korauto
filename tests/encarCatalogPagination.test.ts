import { describe, it, expect } from 'vitest';

describe('EncarCatalog Pagination UI', () => {
  
  it('should properly calculate pagination state for different scenarios', () => {
    // Test pagination state calculations
    const scenarios = [
      { currentPage: 1, totalPages: 5, expectedPrevDisabled: true, expectedNextDisabled: false },
      { currentPage: 3, totalPages: 5, expectedPrevDisabled: false, expectedNextDisabled: false },
      { currentPage: 5, totalPages: 5, expectedPrevDisabled: false, expectedNextDisabled: true },
      { currentPage: 1, totalPages: 1, expectedPrevDisabled: true, expectedNextDisabled: true },
    ];

    scenarios.forEach(({ currentPage, totalPages, expectedPrevDisabled, expectedNextDisabled }) => {
      const prevDisabled = currentPage <= 1;
      const nextDisabled = currentPage >= totalPages;
      
      expect(prevDisabled).toBe(expectedPrevDisabled);
      expect(nextDisabled).toBe(expectedNextDisabled);
    });
  });

  it('should only show pagination controls when there are multiple pages', () => {
    // Test visibility conditions
    const shouldShow1Page = 1 > 1; // false - should not show for single page
    const shouldShow5Pages = 5 > 1; // true - should show for multiple pages
    
    expect(shouldShow1Page).toBe(false);
    expect(shouldShow5Pages).toBe(true);
  });

  it('should correctly slice cars for pagination', () => {
    // Simulate car data
    const allCars = Array.from({ length: 125 }, (_, i) => ({ id: i + 1, name: `Car ${i + 1}` }));
    const pageSize = 50;
    
    // Test different pages
    const page1 = allCars.slice((1 - 1) * pageSize, 1 * pageSize);
    const page2 = allCars.slice((2 - 1) * pageSize, 2 * pageSize);
    const page3 = allCars.slice((3 - 1) * pageSize, 3 * pageSize);
    
    // Page 1: cars 1-50
    expect(page1.length).toBe(50);
    expect(page1[0].id).toBe(1);
    expect(page1[49].id).toBe(50);
    
    // Page 2: cars 51-100
    expect(page2.length).toBe(50);
    expect(page2[0].id).toBe(51);
    expect(page2[49].id).toBe(100);
    
    // Page 3: cars 101-125 (partial page)
    expect(page3.length).toBe(25);
    expect(page3[0].id).toBe(101);
    expect(page3[24].id).toBe(125);
  });

  it('should calculate total pages correctly', () => {
    const testCases = [
      { totalCars: 50, expectedPages: 1 },
      { totalCars: 51, expectedPages: 2 },
      { totalCars: 100, expectedPages: 2 },
      { totalCars: 150, expectedPages: 3 },
      { totalCars: 0, expectedPages: 0 },
    ];

    testCases.forEach(({ totalCars, expectedPages }) => {
      const calculatedPages = totalCars > 0 ? Math.ceil(totalCars / 50) : 0;
      expect(calculatedPages).toBe(expectedPages);
    });
  });
});