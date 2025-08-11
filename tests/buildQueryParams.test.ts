import { describe, it, expect } from 'vitest';
import { buildQueryParams, validateFilters, areFiltersValid } from '@/utils/buildQueryParams';
import { FilterState } from '@/hooks/useFiltersFromUrl';

describe('buildQueryParams', () => {
  it('should include only non-empty exact match filters', () => {
    const filters: FilterState = {
      brand: 'audi',
      model: 'a3',
      fuel: undefined,
      transmission: '',
      color: 'black',
      page: 1,
      sort: 'price_asc',
    };

    const result = buildQueryParams(filters);

    expect(result).toEqual({
      brand: 'audi',
      model: 'a3',
      color: 'black',
      page: '1',
      pageSize: '20',
      sort: 'price_asc',
    });
  });

  it('should include range filters when set', () => {
    const filters: FilterState = {
      yearMin: 2018,
      yearMax: 2022,
      priceMin: 15000,
      priceMax: 30000,
      mileageMin: 0,
      mileageMax: 100000,
      page: 1,
      sort: 'year_desc',
    };

    const result = buildQueryParams(filters);

    expect(result).toEqual({
      yearMin: '2018',
      yearMax: '2022',
      priceMin: '15000',
      priceMax: '30000',
      mileageMin: '0',
      mileageMax: '100000',
      page: '1',
      pageSize: '20',
      sort: 'year_desc',
    });
  });

  it('should handle partial range filters', () => {
    const filters: FilterState = {
      yearMin: 2020,
      // yearMax not set
      priceMax: 50000,
      // priceMin not set
      page: 2,
    };

    const result = buildQueryParams(filters);

    expect(result).toEqual({
      yearMin: '2020',
      priceMax: '50000',
      page: '2',
      pageSize: '20',
      sort: 'price_asc',
    });
  });

  it('should always include pagination and sort with defaults', () => {
    const filters: FilterState = {};

    const result = buildQueryParams(filters);

    expect(result).toEqual({
      page: '1',
      pageSize: '20',
      sort: 'price_asc',
    });
  });
});

describe('validateFilters', () => {
  it('should return empty array for valid filters', () => {
    const filters: FilterState = {
      yearMin: 2018,
      yearMax: 2022,
      priceMin: 15000,
      priceMax: 30000,
      mileageMin: 50000,
      mileageMax: 100000,
    };

    const errors = validateFilters(filters);
    expect(errors).toEqual([]);
  });

  it('should validate year range', () => {
    const filters: FilterState = {
      yearMin: 2022,
      yearMax: 2018, // Invalid: min > max
    };

    const errors = validateFilters(filters);
    expect(errors).toContain('Year minimum cannot be greater than maximum');
  });

  it('should validate price range', () => {
    const filters: FilterState = {
      priceMin: 30000,
      priceMax: 15000, // Invalid: min > max
    };

    const errors = validateFilters(filters);
    expect(errors).toContain('Price minimum cannot be greater than maximum');
  });

  it('should validate mileage range', () => {
    const filters: FilterState = {
      mileageMin: 100000,
      mileageMax: 50000, // Invalid: min > max
    };

    const errors = validateFilters(filters);
    expect(errors).toContain('Mileage minimum cannot be greater than maximum');
  });

  it('should validate multiple ranges', () => {
    const filters: FilterState = {
      yearMin: 2022,
      yearMax: 2018,
      priceMin: 30000,
      priceMax: 15000,
    };

    const errors = validateFilters(filters);
    expect(errors).toHaveLength(2);
    expect(errors).toContain('Year minimum cannot be greater than maximum');
    expect(errors).toContain('Price minimum cannot be greater than maximum');
  });

  it('should allow equal min and max values', () => {
    const filters: FilterState = {
      yearMin: 2020,
      yearMax: 2020, // Valid: equal values
      priceMin: 25000,
      priceMax: 25000, // Valid: equal values
    };

    const errors = validateFilters(filters);
    expect(errors).toEqual([]);
  });

  it('should ignore incomplete ranges', () => {
    const filters: FilterState = {
      yearMin: 2022, // Only min set, no max
      priceMax: 15000, // Only max set, no min
    };

    const errors = validateFilters(filters);
    expect(errors).toEqual([]);
  });
});

describe('areFiltersValid', () => {
  it('should return true for valid filters', () => {
    const filters: FilterState = {
      yearMin: 2018,
      yearMax: 2022,
      priceMin: 15000,
      priceMax: 30000,
    };

    expect(areFiltersValid(filters)).toBe(true);
  });

  it('should return false for invalid filters', () => {
    const filters: FilterState = {
      yearMin: 2022,
      yearMax: 2018, // Invalid
    };

    expect(areFiltersValid(filters)).toBe(false);
  });
});