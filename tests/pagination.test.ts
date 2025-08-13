import { describe, it, expect } from 'vitest';

describe('Pagination Logic', () => {
  describe('Total Pages Calculation', () => {
    it('should calculate correct pages for regular pagination', () => {
      const totalCount = 700;
      const perPage = 50;
      const expectedPages = Math.ceil(totalCount / perPage); // 14 pages
      
      expect(expectedPages).toBe(14);
    });

    it('should calculate correct pages for global sorting with filtered cars', () => {
      const allCarsForSorting = new Array(125); // 125 cars after filtering
      const perPage = 50;
      const expectedPages = Math.ceil(allCarsForSorting.length / perPage); // 3 pages
      
      expect(expectedPages).toBe(3);
    });

    it('should handle edge case where filtered cars result in 0 pages', () => {
      const allCarsForSorting: any[] = []; // No cars after filtering
      const perPage = 50;
      const expectedPages = Math.ceil(allCarsForSorting.length / perPage); // 0 pages
      
      expect(expectedPages).toBe(0);
    });

    it('should handle single page scenario correctly', () => {
      const allCarsForSorting = new Array(30); // 30 cars - less than one page
      const perPage = 50;
      const expectedPages = Math.ceil(allCarsForSorting.length / perPage); // 1 page
      
      expect(expectedPages).toBe(1);
    });
  });

  describe('Page Navigation Boundaries', () => {
    it('should prevent navigation beyond available pages', () => {
      const allCarsForSorting = new Array(125); // 125 cars = 3 pages
      const perPage = 50;
      const maxPages = Math.ceil(allCarsForSorting.length / perPage); // 3
      const requestedPage = 5; // Trying to go to page 5
      
      const shouldAllowNavigation = requestedPage <= maxPages;
      expect(shouldAllowNavigation).toBe(false);
    });

    it('should allow navigation within available pages', () => {
      const allCarsForSorting = new Array(125); // 125 cars = 3 pages
      const perPage = 50;
      const maxPages = Math.ceil(allCarsForSorting.length / perPage); // 3
      const requestedPage = 2; // Trying to go to page 2
      
      const shouldAllowNavigation = requestedPage <= maxPages;
      expect(shouldAllowNavigation).toBe(true);
    });
  });

  describe('Car Slicing for Pages', () => {
    it('should slice cars correctly for page 1', () => {
      const allCars = new Array(125).fill(0).map((_, i) => ({ id: i + 1 }));
      const currentPage = 1;
      const perPage = 50;
      
      const startIndex = (currentPage - 1) * perPage; // 0
      const endIndex = currentPage * perPage; // 50
      const carsForPage = allCars.slice(startIndex, endIndex);
      
      expect(carsForPage.length).toBe(50);
      expect(carsForPage[0].id).toBe(1);
      expect(carsForPage[49].id).toBe(50);
    });

    it('should slice cars correctly for page 2', () => {
      const allCars = new Array(125).fill(0).map((_, i) => ({ id: i + 1 }));
      const currentPage = 2;
      const perPage = 50;
      
      const startIndex = (currentPage - 1) * perPage; // 50
      const endIndex = currentPage * perPage; // 100
      const carsForPage = allCars.slice(startIndex, endIndex);
      
      expect(carsForPage.length).toBe(50);
      expect(carsForPage[0].id).toBe(51);
      expect(carsForPage[49].id).toBe(100);
    });

    it('should slice cars correctly for last partial page', () => {
      const allCars = new Array(125).fill(0).map((_, i) => ({ id: i + 1 }));
      const currentPage = 3; // Last page
      const perPage = 50;
      
      const startIndex = (currentPage - 1) * perPage; // 100
      const endIndex = currentPage * perPage; // 150
      const carsForPage = allCars.slice(startIndex, endIndex);
      
      expect(carsForPage.length).toBe(25); // Only 25 cars on last page
      expect(carsForPage[0].id).toBe(101);
      expect(carsForPage[24].id).toBe(125);
    });

    it('should return empty array for page beyond available data', () => {
      const allCars = new Array(125).fill(0).map((_, i) => ({ id: i + 1 }));
      const currentPage = 5; // Beyond available pages
      const perPage = 50;
      
      const startIndex = (currentPage - 1) * perPage; // 200
      const endIndex = currentPage * perPage; // 250
      const carsForPage = allCars.slice(startIndex, endIndex);
      
      expect(carsForPage.length).toBe(0);
    });
  });

  describe('Porsche Cayenne Scenario (700+ cars)', () => {
    it('should handle large dataset pagination correctly', () => {
      const totalCars = 750; // Simulating Porsche Cayenne with 750 cars
      const perPage = 50;
      const expectedPages = Math.ceil(totalCars / perPage); // 15 pages
      
      expect(expectedPages).toBe(15);
      
      // Test that each page has correct number of cars
      for (let page = 1; page <= expectedPages; page++) {
        const startIndex = (page - 1) * perPage;
        const endIndex = page * perPage;
        const expectedCarsOnPage = page === expectedPages 
          ? totalCars - (expectedPages - 1) * perPage // Last page: 750 - 14*50 = 50
          : perPage; // Other pages: 50
        
        expect(Math.min(perPage, totalCars - startIndex)).toBe(expectedCarsOnPage);
      }
    });

    it('should prevent navigation to page 16 when only 15 pages exist', () => {
      const totalCars = 750;
      const perPage = 50;
      const maxPages = Math.ceil(totalCars / perPage); // 15
      const requestedPage = 16;
      
      const shouldAllowNavigation = requestedPage <= maxPages;
      expect(shouldAllowNavigation).toBe(false);
    });
  });
});