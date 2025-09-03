import { describe, it, expect } from 'vitest';
import { mapFrontendSortToBackend, getSortParams } from '@/services/carsApi';

describe('Global Sorting Implementation', () => {
  describe('Frontend to Backend Sort Mapping', () => {
    it('should map all frontend sort options correctly', () => {
      const mappings = [
        // Price sorting
        { frontend: 'price_low', backend: 'price_asc' },
        { frontend: 'price_high', backend: 'price_desc' },
        
        // Year sorting  
        { frontend: 'year_new', backend: 'year_desc' },
        { frontend: 'year_old', backend: 'year_asc' },
        
        // Mileage sorting
        { frontend: 'mileage_low', backend: 'mileage_asc' },
        { frontend: 'mileage_high', backend: 'mileage_desc' },
        
        // Make sorting
        { frontend: 'make_az', backend: 'make_asc' },
        { frontend: 'make_za', backend: 'make_desc' },
        
        // Created date sorting
        { frontend: 'recently_added', backend: 'created_desc' },
        { frontend: 'oldest_first', backend: 'created_asc' },
        
        // Popularity
        { frontend: 'popular', backend: 'rank_desc' },
      ];

      mappings.forEach(({ frontend, backend }) => {
        expect(mapFrontendSortToBackend(frontend)).toBe(backend);
      });
    });

    it('should pass through backend sort options unchanged', () => {
      const backendOptions = [
        'price_asc', 'price_desc', 'rank_asc', 'rank_desc',
        'year_asc', 'year_desc', 'mileage_asc', 'mileage_desc',
        'make_asc', 'make_desc', 'created_asc', 'created_desc'
      ];

      backendOptions.forEach(option => {
        expect(mapFrontendSortToBackend(option)).toBe(option);
      });
    });
  });

  describe('Database Field Mapping', () => {
    it('should map sort options to correct database fields', () => {
      const expectedMappings = [
        // Price
        { sort: 'price_asc', field: 'price_cents', direction: 'ASC' },
        { sort: 'price_desc', field: 'price_cents', direction: 'DESC' },
        
        // Rank/Popularity
        { sort: 'rank_asc', field: 'rank_score', direction: 'ASC' },
        { sort: 'rank_desc', field: 'rank_score', direction: 'DESC' },
        
        // Year
        { sort: 'year_asc', field: 'year', direction: 'ASC' },
        { sort: 'year_desc', field: 'year', direction: 'DESC' },
        
        // Mileage
        { sort: 'mileage_asc', field: 'mileage_km', direction: 'ASC' },
        { sort: 'mileage_desc', field: 'mileage_km', direction: 'DESC' },
        
        // Make
        { sort: 'make_asc', field: 'make', direction: 'ASC' },
        { sort: 'make_desc', field: 'make', direction: 'DESC' },
        
        // Created date
        { sort: 'created_asc', field: 'created_at', direction: 'ASC' },
        { sort: 'created_desc', field: 'created_at', direction: 'DESC' },
      ];

      expectedMappings.forEach(({ sort, field, direction }) => {
        const result = getSortParams(sort);
        expect(result).toEqual({ field, direction });
      });
    });

    it('should handle frontend sort options by converting them first', () => {
      const frontendMappings = [
        { sort: 'price_low', field: 'price_cents', direction: 'ASC' },
        { sort: 'price_high', field: 'price_cents', direction: 'DESC' },
        { sort: 'year_new', field: 'year', direction: 'DESC' },
        { sort: 'year_old', field: 'year', direction: 'ASC' },
        { sort: 'mileage_low', field: 'mileage_km', direction: 'ASC' },
        { sort: 'mileage_high', field: 'mileage_km', direction: 'DESC' },
        { sort: 'make_az', field: 'make', direction: 'ASC' },
        { sort: 'make_za', field: 'make', direction: 'DESC' },
        { sort: 'recently_added', field: 'created_at', direction: 'DESC' },
        { sort: 'oldest_first', field: 'created_at', direction: 'ASC' },
        { sort: 'popular', field: 'rank_score', direction: 'DESC' },
      ];

      frontendMappings.forEach(({ sort, field, direction }) => {
        const result = getSortParams(sort);
        expect(result).toEqual({ field, direction });
      });
    });
  });

  describe('Global Sorting Requirements Compliance', () => {
    it('should support all required sort fields from problem statement', () => {
      // Problem statement mentions: price, year, mileage, etc.
      const requiredFields = ['price_cents', 'year', 'mileage_km'];
      
      const priceParams = getSortParams('price_asc');
      const yearParams = getSortParams('year_asc');
      const mileageParams = getSortParams('mileage_asc');

      expect(priceParams.field).toBe('price_cents');
      expect(yearParams.field).toBe('year');
      expect(mileageParams.field).toBe('mileage_km');
    });

    it('should ensure price_asc maps to correct field for global sorting', () => {
      // This ensures when frontend uses 'price_low', it gets sorted globally by price_cents ASC
      // which means page 1 will always show cheapest cars from entire dataset
      const result = getSortParams('price_low');
      expect(result).toEqual({ field: 'price_cents', direction: 'ASC' });
    });

    it('should handle default fallback correctly', () => {
      const result = getSortParams('invalid_sort_option');
      expect(result).toEqual({ field: 'price_cents', direction: 'ASC' });
    });
  });

  describe('Sorting Consistency', () => {
    it('should maintain consistent mapping between related sort options', () => {
      // Ensure ascending and descending versions map to same field with different directions
      const fieldPairs = [
        { asc: 'price_asc', desc: 'price_desc', field: 'price_cents' },
        { asc: 'year_asc', desc: 'year_desc', field: 'year' },
        { asc: 'mileage_asc', desc: 'mileage_desc', field: 'mileage_km' },
        { asc: 'make_asc', desc: 'make_desc', field: 'make' },
        { asc: 'rank_asc', desc: 'rank_desc', field: 'rank_score' },
        { asc: 'created_asc', desc: 'created_desc', field: 'created_at' },
      ];

      fieldPairs.forEach(({ asc, desc, field }) => {
        const ascParams = getSortParams(asc);
        const descParams = getSortParams(desc);
        
        expect(ascParams.field).toBe(field);
        expect(descParams.field).toBe(field);
        expect(ascParams.direction).toBe('ASC');
        expect(descParams.direction).toBe('DESC');
      });
    });
  });
});