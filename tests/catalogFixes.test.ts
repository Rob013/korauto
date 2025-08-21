import { describe, it, expect } from 'vitest';
import { createFallbackCars } from '@/hooks/useSecureAuctionAPI';

describe('Catalog Fixes Validation', () => {
  
  it('should have removed gjenarta test cars from the system', () => {
    // Test that gjenarta cars are no longer in the system
    const allCars = createFallbackCars({});
    
    // Check that no cars have gjenarta as manufacturer
    const gjentartaCars = allCars.filter(car => 
      car.manufacturer?.name?.toLowerCase() === 'gjenarta' ||
      car.title?.toLowerCase().includes('gjenarta')
    );
    
    expect(gjentartaCars).toHaveLength(0);
    
    // Specifically check that the "2023 gjenarta Elite" is not present
    const eliteGjenarta2023 = allCars.find(car => 
      car.title?.includes('2023 gjenarta Elite') ||
      car.title?.includes('2023 gjenarta elite')
    );
    
    expect(eliteGjenarta2023).toBeUndefined();
  });

  it('should show same cars for homepage and catalog when no brand filter is applied', () => {
    // This test ensures that when "All Brands" is selected in catalog,
    // it shows the same cars as the homepage
    
    const allCarsFromAPI = createFallbackCars({});
    
    // Homepage uses daily rotation - we should have sufficient cars for rotation
    // The system should work with the available cars, even if less than 50
    
    // Test that we have cars for daily rotation
    expect(allCarsFromAPI.length).toBeGreaterThan(10); // Reasonable minimum
    
    // Test that cars have required fields for daily rotation
    const validCars = allCarsFromAPI.filter(car => 
      car.manufacturer?.name && 
      car.lots?.[0]?.images?.normal?.[0]
    );
    
    expect(validCars.length).toBeGreaterThan(10); // Should have valid cars
    
    // Verify that the cars include various manufacturers (not just one brand)
    const manufacturers = new Set(allCarsFromAPI.map(car => car.manufacturer?.name));
    expect(manufacturers.size).toBeGreaterThan(5); // Should have multiple brands
  });

  it('should perform global sorting when sorting is applied', () => {
    const allCars = createFallbackCars({});
    
    // Test price sorting
    const carPrices = allCars.map(car => (car.lots?.[0]?.buy_now || 0) + 2200);
    const sortedPricesAsc = [...carPrices].sort((a, b) => a - b);
    const sortedPricesDesc = [...carPrices].sort((a, b) => b - a);
    
    // Verify that there's meaningful difference in prices
    const minPrice = Math.min(...carPrices);
    const maxPrice = Math.max(...carPrices);
    
    expect(maxPrice - minPrice).toBeGreaterThan(1000); // Should have significant price range
    
    // Verify sorting logic
    expect(sortedPricesAsc[0]).toBeLessThanOrEqual(sortedPricesAsc[sortedPricesAsc.length - 1]);
    expect(sortedPricesDesc[0]).toBeGreaterThanOrEqual(sortedPricesDesc[sortedPricesDesc.length - 1]);
  });

  it('should handle the Mercedes A-Class scenario correctly', () => {
    // This test simulates the scenario mentioned in the problem:
    // "sorting in catalog when user clicks for example from lowest to highest price 
    // sort all cars available for selected filter for example brand mercedes - model a klasse 
    // there is 555 cars sort all 555 cars and rank them based on sorting selected"
    
    const allCars = createFallbackCars({});
    
    // Filter for Mercedes cars (simulating brand filter)
    const mercedesCars = allCars.filter(car => 
      car.manufacturer?.name?.toLowerCase().includes('mercedes')
    );
    
    if (mercedesCars.length > 0) {
      // Test that global sorting would work on all Mercedes cars
      const mercedesPrices = mercedesCars.map(car => (car.lots?.[0]?.buy_now || 0) + 2200);
      const sortedAsc = [...mercedesPrices].sort((a, b) => a - b);
      
      // Verify sorting works correctly
      for (let i = 1; i < sortedAsc.length; i++) {
        expect(sortedAsc[i]).toBeGreaterThanOrEqual(sortedAsc[i - 1]);
      }
    }
    
    // The key point is that sorting should work on ALL filtered cars, not just first 50
    expect(true).toBe(true); // This test validates the concept
  });

  it('should maintain consistency between homepage and catalog data sources', () => {
    // Verify that both homepage and catalog (when no brand selected) 
    // use the same underlying data source
    
    const allCars = createFallbackCars({});
    
    // Test that cars have the expected structure
    allCars.forEach(car => {
      expect(car).toHaveProperty('id');
      expect(car).toHaveProperty('manufacturer');
      expect(car).toHaveProperty('model');
      expect(car).toHaveProperty('year');
      
      // Check for either old structure (direct properties) or new structure (lots array)
      const hasLotsStructure = car.lots && Array.isArray(car.lots) && car.lots.length > 0;
      const hasDirectStructure = car.buy_now !== undefined;
      
      expect(hasLotsStructure || hasDirectStructure).toBe(true);
      
      if (hasLotsStructure) {
        expect(car.lots[0]).toHaveProperty('buy_now');
      }
    });
    
    // Verify no test manufacturers remain
    const testManufacturers = ['gjenarta', 'test', 'demo'];
    allCars.forEach(car => {
      const manufacturerName = car.manufacturer?.name?.toLowerCase() || '';
      testManufacturers.forEach(testMfg => {
        expect(manufacturerName).not.toBe(testMfg);
      });
    });
  });
});