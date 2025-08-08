import { describe, test, expect } from 'vitest';
import { buildFilter, normalizeFilters, createFiltersHash } from '../src/lib/search/buildFilter';

describe('buildFilter', () => {
  test('handles empty filters', () => {
    expect(buildFilter({})).toBe('');
    expect(buildFilter(undefined)).toBe('');
  });

  test('builds categorical filters with OR logic within facets', () => {
    const filters = {
      make: ['BMW', 'Audi'],
      fuel: ['Gasoline'],
    };
    
    const result = buildFilter(filters);
    expect(result).toContain('make IN ["BMW","Audi"]');
    expect(result).toContain('fuel IN ["Gasoline"]');
    expect(result).toContain(' AND ');
  });

  test('handles numeric array filters', () => {
    const filters = {
      owners: [1, 2],
      seats: [5],
    };
    
    const result = buildFilter(filters);
    expect(result).toContain('owners IN [1,2]');
    expect(result).toContain('seats IN [5]');
  });

  test('builds range filters with AND logic within ranges', () => {
    const filters = {
      year: { min: 2020, max: 2023 },
      price_eur: { min: 10000 },
      mileage_km: { max: 50000 },
    };
    
    const result = buildFilter(filters);
    expect(result).toContain('(year >= 2020 AND year <= 2023)');
    expect(result).toContain('(price_eur >= 10000)');
    expect(result).toContain('(mileage_km <= 50000)');
  });

  test('combines different filter types with AND logic', () => {
    const filters = {
      make: ['BMW'],
      year: { min: 2020 },
      owners: [1],
    };
    
    const result = buildFilter(filters);
    const parts = result.split(' AND ');
    expect(parts).toHaveLength(3);
    expect(result).toContain('make IN ["BMW"]');
    expect(result).toContain('(year >= 2020)');
    expect(result).toContain('owners IN [1]');
  });

  test('escapes quotes in string values', () => {
    const filters = {
      model: ['3 Series "Sedan"'],
    };
    
    const result = buildFilter(filters);
    expect(result).toContain('model IN ["3 Series \\"Sedan\\""]');
  });

  test('handles accident filter specially', () => {
    const filters = {
      accident: ['none', 'minor'],
    };
    
    const result = buildFilter(filters);
    expect(result).toContain('accident IN ["none","minor"]');
  });
});

describe('normalizeFilters', () => {
  test('normalizes string values to arrays', () => {
    const filters = {
      make: 'BMW',
      fuel: ['Gasoline', 'Diesel'],
    };
    
    const result = normalizeFilters(filters);
    expect(result.make).toEqual(['BMW']);
    expect(result.fuel).toEqual(['Gasoline', 'Diesel']);
  });

  test('filters out empty values', () => {
    const filters = {
      make: ['BMW', '', null],
      model: '',
      year: { min: null, max: 2023 },
    };
    
    const result = normalizeFilters(filters);
    expect(result.make).toEqual(['BMW']);
    expect(result.model).toBeUndefined();
    expect(result.year).toEqual({ max: 2023 });
  });

  test('coerces numeric values correctly', () => {
    const filters = {
      owners: ['1', '2'],
      seats: '5',
      year: { min: '2020', max: '2023' },
    };
    
    const result = normalizeFilters(filters);
    expect(result.owners).toEqual([1, 2]);
    expect(result.seats).toEqual([5]);
    expect(result.year).toEqual({ min: 2020, max: 2023 });
  });

  test('filters out invalid numeric values', () => {
    const filters = {
      owners: ['1', 'invalid', '2'],
      year: { min: 'invalid', max: 2023 },
    };
    
    const result = normalizeFilters(filters);
    expect(result.owners).toEqual([1, 2]);
    expect(result.year).toEqual({ max: 2023 });
  });
});

describe('createFiltersHash', () => {
  test('creates consistent hashes for same filters', () => {
    const filters1 = { make: ['BMW'], year: { min: 2020 } };
    const filters2 = { year: { min: 2020 }, make: ['BMW'] }; // Different order
    
    const hash1 = createFiltersHash(filters1);
    const hash2 = createFiltersHash(filters2);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(16);
  });

  test('creates different hashes for different filters', () => {
    const filters1 = { make: ['BMW'] };
    const filters2 = { make: ['Audi'] };
    
    const hash1 = createFiltersHash(filters1);
    const hash2 = createFiltersHash(filters2);
    
    expect(hash1).not.toBe(hash2);
  });

  test('handles empty filters', () => {
    const hash = createFiltersHash({});
    expect(hash).toBe('empty');
  });
});