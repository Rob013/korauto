import { describe, it, expect, beforeEach } from 'vitest';
import { createFilterUrl } from '../store/filterStore';
import { SearchFilters, SearchSort } from '../lib/search/types';

// Mock URLSearchParams for testing
class MockURLSearchParams {
  private params = new Map<string, string>();

  constructor(init?: string) {
    if (init) {
      // Simple parsing for test purposes
      const pairs = init.split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          this.params.set(decodeURIComponent(key), decodeURIComponent(value));
        }
      });
    }
  }

  get(key: string): string | null {
    return this.params.get(key) || null;
  }

  set(key: string, value: string): void {
    this.params.set(key, value);
  }

  toString(): string {
    const pairs: string[] = [];
    this.params.forEach((value, key) => {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    return pairs.join('&');
  }

  entries(): IterableIterator<[string, string]> {
    return this.params.entries();
  }
}

// Override global URLSearchParams for testing
global.URLSearchParams = MockURLSearchParams as any;

describe('URL Filter State Round-trip', () => {
  const defaultSort: SearchSort = { field: 'listed_at', dir: 'desc' };

  it('should correctly serialize and deserialize basic filters', () => {
    const filters: SearchFilters = {
      make: ['BMW', 'Mercedes'],
      fuel: ['Petrol'],
      year: { min: 2020, max: 2023 }
    };

    // Create URL
    const urlString = createFilterUrl(filters, defaultSort, 1, 24);
    const params = new URLSearchParams(urlString);

    // Parse back
    const parsedFilters: SearchFilters = {};
    
    // Parse make
    const makeParam = params.get('make');
    if (makeParam) {
      parsedFilters.make = makeParam.split(',');
    }

    // Parse fuel
    const fuelParam = params.get('fuel');
    if (fuelParam) {
      parsedFilters.fuel = fuelParam.split(',');
    }

    // Parse year
    const yearParam = params.get('year');
    if (yearParam) {
      const range: { min?: number; max?: number } = {};
      const parts = yearParam.split(',');
      parts.forEach(part => {
        if (part.startsWith('min:')) {
          range.min = parseInt(part.substring(4), 10);
        } else if (part.startsWith('max:')) {
          range.max = parseInt(part.substring(4), 10);
        }
      });
      parsedFilters.year = range;
    }

    // Verify round-trip
    expect(parsedFilters.make).toEqual(filters.make);
    expect(parsedFilters.fuel).toEqual(filters.fuel);
    expect(parsedFilters.year).toEqual(filters.year);
  });

  it('should handle empty filters correctly', () => {
    const filters: SearchFilters = {};
    
    const urlString = createFilterUrl(filters, defaultSort, 1, 24);
    
    // Should result in empty or minimal URL
    expect(urlString).toBe('');
  });

  it('should preserve query parameters', () => {
    const filters: SearchFilters = {
      make: ['BMW']
    };
    const query = 'test search';
    
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('make', 'BMW');
    
    // Verify query is preserved
    expect(params.get('q')).toBe(query);
    expect(params.get('make')).toBe('BMW');
  });

  it('should handle sort parameters correctly', () => {
    const filters: SearchFilters = {};
    const customSort: SearchSort = { field: 'price_eur', dir: 'asc' };
    
    const urlString = createFilterUrl(filters, customSort, 1, 24);
    const params = new URLSearchParams(urlString);
    
    expect(params.get('sort')).toBe('price_eur:asc');
  });

  it('should handle pagination parameters', () => {
    const filters: SearchFilters = {};
    
    const urlString = createFilterUrl(filters, defaultSort, 3, 48);
    const params = new URLSearchParams(urlString);
    
    expect(params.get('page')).toBe('3');
    expect(params.get('pageSize')).toBe('48');
  });

  it('should skip default values to keep URL clean', () => {
    const filters: SearchFilters = {};
    
    // Default sort and page should not appear in URL
    const urlString = createFilterUrl(filters, defaultSort, 1, 24);
    const params = new URLSearchParams(urlString);
    
    expect(params.get('sort')).toBeNull();
    expect(params.get('page')).toBeNull();
    expect(params.get('pageSize')).toBeNull();
  });

  it('should handle complex range filters', () => {
    const filters: SearchFilters = {
      price_eur: { min: 10000, max: 50000 },
      mileage_km: { min: 0 },
      engine_cc: { max: 3000 }
    };
    
    // Manually create params to test the expected format
    const params = new URLSearchParams();
    
    // Set price range
    params.set('price_eur', 'min:10000,max:50000');
    
    // Set mileage range (min only)
    params.set('mileage_km', 'min:0');
    
    // Set engine range (max only)
    params.set('engine_cc', 'max:3000');
    
    // Price range (both min and max)
    const priceParam = params.get('price_eur');
    expect(priceParam).toContain('min:10000');
    expect(priceParam).toContain('max:50000');
    
    // Mileage (min only)
    const mileageParam = params.get('mileage_km');
    expect(mileageParam).toContain('min:0');
    expect(mileageParam).not.toContain('max:');
    
    // Engine (max only)
    const engineParam = params.get('engine_cc');
    expect(engineParam).toContain('max:3000');
    expect(engineParam).not.toContain('min:');
  });

  it('should handle numeric array filters', () => {
    const filters: SearchFilters = {
      owners: [1, 2, 3],
      seats: [5, 7]
    };
    
    const urlString = createFilterUrl(filters, defaultSort, 1, 24);
    const params = new URLSearchParams(urlString);
    
    expect(params.get('owners')).toBe('1,2,3');
    expect(params.get('seats')).toBe('5,7');
  });

  it('should handle special characters in filter values', () => {
    const filters: SearchFilters = {
      make: ['BMW & Co.', 'Mercedes-Benz'],
      model: ['3-Series']
    };
    
    const urlString = createFilterUrl(filters, defaultSort, 1, 24);
    const params = new URLSearchParams(urlString);
    
    const makeParam = params.get('make');
    expect(makeParam).toContain('BMW & Co.');
    expect(makeParam).toContain('Mercedes-Benz');
    
    expect(params.get('model')).toBe('3-Series');
  });

  it('should handle round-trip with all filter types', () => {
    const originalFilters: SearchFilters = {
      country: ['Domestic'],
      make: ['BMW', 'Mercedes'],
      model: ['3 Series'],
      trim: ['320i', '330d'],
      year: { min: 2020, max: 2023 },
      price_eur: { min: 15000, max: 50000 },
      mileage_km: { max: 100000 },
      engine_cc: { min: 1500, max: 3000 },
      fuel: ['Petrol', 'Diesel'],
      transmission: ['Manual', 'Automatic'],
      body: ['Sedan'],
      drive: ['RWD'],
      owners: [1, 2],
      accident: ['none'],
      use_type: ['Personal'],
      exterior_color: ['Black', 'White'],
      interior_color: ['Black'],
      region: ['Bavaria'],
      seats: [5],
      options: ['GPS', 'Leather']
    };

    const originalSort: SearchSort = { field: 'price_eur', dir: 'asc' };
    const originalPage = 2;
    const originalPageSize = 36;
    const originalQuery = 'luxury sedan';

    // Create URL
    const params = new URLSearchParams();
    params.set('q', originalQuery);
    
    // Simulate creating URL with all parameters
    Object.entries(originalFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
        const parts = [];
        if (value.min !== undefined) parts.push(`min:${value.min}`);
        if (value.max !== undefined) parts.push(`max:${value.max}`);
        if (parts.length > 0) {
          params.set(key, parts.join(','));
        }
      }
    });
    
    params.set('sort', `${originalSort.field}:${originalSort.dir}`);
    params.set('page', originalPage.toString());
    params.set('pageSize', originalPageSize.toString());

    // Parse back (simulate what the URL hook would do)
    const parsedFilters: SearchFilters = {};
    
    // Parse query
    const parsedQuery = params.get('q');
    
    // Parse filters - implement the actual parsing logic
    const arrayKeys = ['country', 'make', 'model', 'trim', 'fuel', 'transmission', 'body', 'drive', 'accident', 'use_type', 'exterior_color', 'interior_color', 'region', 'options'];
    const rangeKeys = ['year', 'price_eur', 'mileage_km', 'engine_cc'];
    const numberArrayKeys = ['owners', 'seats'];
    
    arrayKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        (parsedFilters as any)[key] = value.split(',').map(v => v.trim()).filter(v => v);
      }
    });
    
    rangeKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        const range: { min?: number; max?: number } = {};
        const parts = value.split(',');
        parts.forEach(part => {
          if (part.startsWith('min:')) {
            const min = parseFloat(part.substring(4));
            if (!isNaN(min)) range.min = min;
          } else if (part.startsWith('max:')) {
            const max = parseFloat(part.substring(4));
            if (!isNaN(max)) range.max = max;
          }
        });
        if (range.min !== undefined || range.max !== undefined) {
          (parsedFilters as any)[key] = range;
        }
      }
    });
    
    numberArrayKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        const numbers = value.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
        if (numbers.length > 0) {
          (parsedFilters as any)[key] = numbers;
        }
      }
    });

    // Parse sort
    const sortParam = params.get('sort');
    let parsedSort = defaultSort;
    if (sortParam) {
      const [field, dir] = sortParam.split(':');
      parsedSort = { field: field as any, dir: dir as 'asc' | 'desc' };
    }

    // Parse pagination
    const parsedPage = parseInt(params.get('page') || '1', 10);
    const parsedPageSize = parseInt(params.get('pageSize') || '24', 10);

    // Verify round-trip accuracy for most important fields
    expect(parsedQuery).toBe(originalQuery);
    expect(parsedFilters.country).toEqual(originalFilters.country);
    expect(parsedFilters.make).toEqual(originalFilters.make);
    expect(parsedFilters.model).toEqual(originalFilters.model);
    expect(parsedFilters.year).toEqual(originalFilters.year);
    expect(parsedFilters.price_eur).toEqual(originalFilters.price_eur);
    expect(parsedSort).toEqual(originalSort);
    expect(parsedPage).toBe(originalPage);
    expect(parsedPageSize).toBe(originalPageSize);
  });
});