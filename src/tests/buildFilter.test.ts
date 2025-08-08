import { describe, it, expect } from 'vitest';
import { buildFilter, buildSQLFilter, convertLegacyFilters } from '../lib/search/buildFilter';
import { SearchFilters } from '../lib/search/types';

describe('buildFilter', () => {
  it('should build AND/OR filter logic correctly', () => {
    const filters: SearchFilters = {
      make: ['BMW', 'Mercedes'],
      fuel: ['Petrol', 'Diesel'],
      year: { min: 2020, max: 2023 }
    };

    const result = buildFilter(filters);
    
    // Should have AND between different facets
    expect(result).toContain('AND');
    
    // Should have OR within same facet
    expect(result).toContain('make = "BMW" OR make = "Mercedes"');
    expect(result).toContain('fuel = "Petrol" OR fuel = "Diesel"');
    
    // Should have range conditions
    expect(result).toContain('year >= 2020');
    expect(result).toContain('year <= 2023');
  });

  it('should handle single values without OR', () => {
    const filters: SearchFilters = {
      make: ['BMW'],
      year: { min: 2020 }
    };

    const result = buildFilter(filters);
    
    expect(result).toContain('make = "BMW"');
    expect(result).not.toContain('OR');
    expect(result).toContain('year >= 2020');
  });

  it('should handle empty filters', () => {
    const filters: SearchFilters = {};
    const result = buildFilter(filters);
    expect(result).toBe('');
  });

  it('should handle complex array filters with options', () => {
    const filters: SearchFilters = {
      options: ['GPS', 'Leather', 'Sunroof']
    };

    const result = buildFilter(filters);
    
    // Options should use CONTAINS with AND logic
    expect(result).toContain('CONTAINS');
    expect(result).toContain('GPS');
    expect(result).toContain('Leather');
    expect(result).toContain('Sunroof');
  });

  it('should handle numeric arrays correctly', () => {
    const filters: SearchFilters = {
      owners: [1, 2],
      seats: [5, 7]
    };

    const result = buildFilter(filters);
    
    expect(result).toContain('owners = "1" OR owners = "2"');
    expect(result).toContain('seats = "5" OR seats = "7"');
  });
});

describe('buildSQLFilter', () => {
  it('should build parameterized SQL with correct placeholders', () => {
    const filters: SearchFilters = {
      make: ['BMW', 'Mercedes'],
      year: { min: 2020, max: 2023 },
      price_eur: { min: 10000 }
    };

    const { whereClause, params } = buildSQLFilter(filters);
    
    // Should use parameterized queries
    expect(whereClause).toContain('$');
    expect(params).toHaveLength(5); // 2 makes + 2 year params + 1 price param
    expect(params).toContain('BMW');
    expect(params).toContain('Mercedes');
    expect(params).toContain(2020);
    expect(params).toContain(2023);
    expect(params).toContain(10000);
  });

  it('should handle empty filters with default WHERE clause', () => {
    const filters: SearchFilters = {};
    const { whereClause, params } = buildSQLFilter(filters);
    
    expect(whereClause).toBe('1=1');
    expect(params).toHaveLength(0);
  });
});

describe('convertLegacyFilters', () => {
  it('should convert legacy API filters to new format', () => {
    const legacyFilters = {
      manufacturer_id: '1',
      model_id: '10',
      from_year: '2020',
      to_year: '2023',
      buy_now_price_from: '10000',
      buy_now_price_to: '50000',
      color: '5',
      fuel_type: '1',
      transmission: '2'
    };

    const result = convertLegacyFilters(legacyFilters);
    
    expect(result.make).toEqual(['1']);
    expect(result.model).toEqual(['10']);
    expect(result.year).toEqual({ min: 2020, max: 2023 });
    expect(result.price_eur).toEqual({ min: 10000, max: 50000 });
    expect(result.exterior_color).toEqual(['5']);
    expect(result.fuel).toEqual(['1']);
    expect(result.transmission).toEqual(['2']);
  });

  it('should handle partial legacy filters', () => {
    const legacyFilters = {
      manufacturer_id: '1',
      from_year: '2020'
      // Missing to_year, should still work
    };

    const result = convertLegacyFilters(legacyFilters);
    
    expect(result.make).toEqual(['1']);
    expect(result.year).toEqual({ min: 2020 });
    expect(result.model).toBeUndefined();
  });

  it('should skip undefined and empty values', () => {
    const legacyFilters = {
      manufacturer_id: '',
      model_id: undefined,
      from_year: '2020'
    };

    const result = convertLegacyFilters(legacyFilters);
    
    expect(result.make).toBeUndefined();
    expect(result.model).toBeUndefined();
    expect(result.year).toEqual({ min: 2020 });
  });
});

describe('Filter edge cases', () => {
  it('should handle special characters in filter values', () => {
    const filters: SearchFilters = {
      make: ['BMW & Co.', 'Mercedes-Benz'],
      model: ['3-Series']
    };

    const result = buildFilter(filters);
    
    // Should escape quotes and handle special characters
    expect(result).toContain('BMW & Co.');
    expect(result).toContain('Mercedes-Benz');
    expect(result).toContain('3-Series');
  });

  it('should handle very large numbers in ranges', () => {
    const filters: SearchFilters = {
      price_eur: { min: 1000000, max: 9999999 },
      mileage_km: { max: 500000 }
    };

    const result = buildFilter(filters);
    
    expect(result).toContain('price_eur >= 1000000');
    expect(result).toContain('price_eur <= 9999999');
    expect(result).toContain('mileage_km <= 500000');
  });

  it('should handle ranges with only min or max values', () => {
    const filters: SearchFilters = {
      year: { min: 2020 },
      price_eur: { max: 50000 }
    };

    const result = buildFilter(filters);
    
    expect(result).toContain('year >= 2020');
    expect(result).toContain('price_eur <= 50000');
    expect(result).not.toContain('year <=');
    expect(result).not.toContain('price_eur >=');
  });
});