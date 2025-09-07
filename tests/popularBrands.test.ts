import { describe, it, expect } from 'vitest';
import { getManufacturerCategory } from '@/utils/catalog-filter';

describe('Popular Brands Feature', () => {
  const popularBrands = ['Audi', 'Mercedes-Benz', 'Volkswagen', 'BMW', 'Renault', 'Peugeot', 'Volvo'];
  
  it('should identify popular brands with priority 0', () => {
    popularBrands.forEach(brand => {
      const category = getManufacturerCategory(brand);
      expect(category.priority).toBe(0);
      expect(category.categoryName).toBe('Popular Brands');
    });
  });

  it('should categorize non-popular brands with higher priorities', () => {
    const nonPopularBrands = [
      { name: 'Toyota', expectedPriority: 3 },
      { name: 'Honda', expectedPriority: 3 },
      { name: 'Ford', expectedPriority: 4 },
      { name: 'Hyundai', expectedPriority: 2 }
    ];

    nonPopularBrands.forEach(({ name, expectedPriority }) => {
      const category = getManufacturerCategory(name);
      expect(category.priority).toBe(expectedPriority);
      expect(category.categoryName).not.toBe('Popular Brands');
    });
  });

  it('should handle case-sensitive brand names', () => {
    const category1 = getManufacturerCategory('BMW');
    const category2 = getManufacturerCategory('bmw');
    
    expect(category1.priority).toBe(0);
    expect(category2.priority).not.toBe(0); // Case sensitive, should not match
  });

  it('should ensure brands moved from other categories are no longer there', () => {
    // BMW, Mercedes-Benz, Audi, Volkswagen were moved from German category
    const formerGermanBrands = ['Porsche', 'Opel'];
    formerGermanBrands.forEach(brand => {
      const category = getManufacturerCategory(brand);
      expect(category.priority).toBe(1); // Still German category
      expect(category.categoryName).toBe('German Brands');
    });

    // Renault, Peugeot were moved from French category
    const category = getManufacturerCategory('Citroën');
    expect(category.priority).toBe(6); // Still French category
    expect(category.categoryName).toBe('French Brands');

    // Volvo was moved from Luxury category
    const luxuryCategory = getManufacturerCategory('Jaguar');
    expect(luxuryCategory.priority).toBe(5); // Still Luxury category
    expect(luxuryCategory.categoryName).toBe('Luxury/European Brands');
  });
});