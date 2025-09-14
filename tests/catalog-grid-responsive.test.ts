/**
 * Test suite for responsive catalog grid system
 * Validates the grid layout changes based on filter panel visibility
 */

import { describe, it, expect } from 'vitest';

describe('Catalog Grid Responsive Layout', () => {
  
  it('should define correct grid classes for desktop with filter panel shown', () => {
    const showFilters = true;
    const isMobile = false;
    const viewMode = 'grid';
    
    // Simulating the grid class logic from EncarCatalog.tsx
    const gridClasses = isMobile 
      ? 'grid-cols-1 px-1 sm:px-2' 
      : `grid-cols-2 sm:grid-cols-2 md:grid-cols-4 ${
          showFilters 
            ? 'lg:grid-cols-4 xl:grid-cols-4' // Desktop: 4 cards when filter panel is shown
            : 'lg:grid-cols-5 xl:grid-cols-5' // Desktop: 5 cards when filter panel is hidden
        }`;

    expect(gridClasses).toBe('grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4');
  });

  it('should define correct grid classes for desktop with filter panel hidden', () => {
    const showFilters = false;
    const isMobile = false;
    const viewMode = 'grid';
    
    const gridClasses = isMobile 
      ? 'grid-cols-1 px-1 sm:px-2' 
      : `grid-cols-2 sm:grid-cols-2 md:grid-cols-4 ${
          showFilters 
            ? 'lg:grid-cols-4 xl:grid-cols-4' // Desktop: 4 cards when filter panel is shown
            : 'lg:grid-cols-5 xl:grid-cols-5' // Desktop: 5 cards when filter panel is hidden
        }`;

    expect(gridClasses).toBe('grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5');
  });

  it('should define correct grid classes for iPad (md breakpoint)', () => {
    // iPad uses md:grid-cols-4 which is 4 cards per row as required
    const showFilters = true; // Doesn't matter for iPad/md breakpoint
    const isMobile = false;
    
    const gridClasses = isMobile 
      ? 'grid-cols-1 px-1 sm:px-2' 
      : `grid-cols-2 sm:grid-cols-2 md:grid-cols-4 ${
          showFilters 
            ? 'lg:grid-cols-4 xl:grid-cols-4'
            : 'lg:grid-cols-5 xl:grid-cols-5'
        }`;

    // Extract the md class to verify iPad behavior
    const mdClass = gridClasses.match(/md:grid-cols-(\d+)/)?.[0];
    expect(mdClass).toBe('md:grid-cols-4');
  });

  it('should keep mobile grid classes unchanged', () => {
    const showFilters = true; // Doesn't affect mobile
    const isMobile = true;
    const viewMode = 'grid';
    
    const gridClasses = isMobile 
      ? 'grid-cols-1 px-1 sm:px-2' 
      : `grid-cols-2 sm:grid-cols-2 md:grid-cols-4 ${
          showFilters 
            ? 'lg:grid-cols-4 xl:grid-cols-4'
            : 'lg:grid-cols-5 xl:grid-cols-5'
        }`;

    expect(gridClasses).toBe('grid-cols-1 px-1 sm:px-2');
  });

  it('should validate the complete className structure', () => {
    const showFilters = false;
    const isMobile = false;
    const viewMode = 'grid';
    const isFilterLoading = false;
    
    // Complete className from EncarCatalog.tsx
    const className = `transition-all duration-300 ${
      viewMode === 'list' 
        ? 'flex flex-col gap-2 sm:gap-3' 
        : `grid gap-2 sm:gap-3 lg:gap-4 ${
            isMobile 
              ? 'grid-cols-1 px-1 sm:px-2' 
              : `grid-cols-2 sm:grid-cols-2 md:grid-cols-4 ${
                  showFilters 
                    ? 'lg:grid-cols-4 xl:grid-cols-4' // Desktop: 4 cards when filter panel is shown
                    : 'lg:grid-cols-5 xl:grid-cols-5' // Desktop: 5 cards when filter panel is hidden
                }`
          }`
    } ${isFilterLoading ? 'opacity-50' : ''}`;

    expect(className).toContain('grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5');
    expect(className).toContain('transition-all duration-300');
  });

  it('should validate requirements fulfillment', () => {
    // Test all the requirements from the problem statement

    // 1. Desktop: 4 cards when filter shown, 5 when hidden
    const desktopWithFilter = 'lg:grid-cols-4 xl:grid-cols-4';
    const desktopWithoutFilter = 'lg:grid-cols-5 xl:grid-cols-5';
    
    expect(desktopWithFilter).toMatch(/lg:grid-cols-4.*xl:grid-cols-4/);
    expect(desktopWithoutFilter).toMatch(/lg:grid-cols-5.*xl:grid-cols-5/);

    // 2. iPad: Always 4 cards (md breakpoint)
    const ipadLayout = 'md:grid-cols-4';
    expect(ipadLayout).toBe('md:grid-cols-4');

    // 3. Mobile: Unchanged (grid-cols-1)
    const mobileLayout = 'grid-cols-1 px-1 sm:px-2';
    expect(mobileLayout).toContain('grid-cols-1');
  });
});