import { describe, test, expect } from 'vitest';

// Mock URL search params for testing
class MockURLSearchParams {
  private params: Map<string, string[]> = new Map();

  constructor(init?: string | string[][] | Record<string, string> | URLSearchParams) {
    if (typeof init === 'string') {
      // Parse query string
      const pairs = init.substring(1).split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          this.append(decodeURIComponent(key), decodeURIComponent(value));
        }
      });
    }
  }

  get(name: string): string | null {
    const values = this.params.get(name);
    return values && values.length > 0 ? values[0] : null;
  }

  getAll(name: string): string[] {
    return this.params.get(name) || [];
  }

  set(name: string, value: string): void {
    this.params.set(name, [value]);
  }

  append(name: string, value: string): void {
    const existing = this.params.get(name) || [];
    this.params.set(name, [...existing, value]);
  }

  entries(): IterableIterator<[string, string]> {
    const result: [string, string][] = [];
    for (const [key, values] of this.params) {
      for (const value of values) {
        result.push([key, value]);
      }
    }
    return result[Symbol.iterator]();
  }

  toString(): string {
    const pairs: string[] = [];
    for (const [key, value] of this.entries()) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    return pairs.join('&');
  }
}

// Import the functions we need to test (these would normally be extracted to utils)
import { DEFAULT_SORT, DEFAULT_PAGE_SIZE } from '../src/lib/search/types';
import { normalizeFilters } from '../src/lib/search/buildFilter';

// Extract utility functions for testing
function parseUrlParams(searchParams: MockURLSearchParams) {
  const state = {
    filters: {} as any,
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    query: '',
  };

  // Parse page
  const pageParam = searchParams.get('page');
  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (page > 0) state.page = page;
  }

  // Parse pageSize
  const pageSizeParam = searchParams.get('pageSize');
  if (pageSizeParam) {
    const pageSize = parseInt(pageSizeParam, 10);
    if (pageSize > 0 && pageSize <= 100) state.pageSize = pageSize;
  }

  // Parse query
  const queryParam = searchParams.get('q');
  if (queryParam) state.query = queryParam;

  // Parse sort
  const sortParam = searchParams.get('sort');
  if (sortParam) {
    const [field, dir] = sortParam.split(':');
    if (field && dir && ['asc', 'desc'].includes(dir)) {
      if (['listed_at', 'price_eur', 'mileage_km', 'year'].includes(field)) {
        state.sort = { field: field as any, dir: dir as 'asc' | 'desc' };
      }
    }
  }

  // Parse filters (compact JSON format)
  const filtersParam = searchParams.get('filters');
  if (filtersParam) {
    try {
      const rawFilters = JSON.parse(decodeURIComponent(filtersParam));
      state.filters = normalizeFilters(rawFilters);
    } catch (error) {
      console.warn('Failed to parse filters from URL:', error);
    }
  }

  return state;
}

function stateToUrlParams(state: {
  filters: any;
  sort: any;
  page: number;
  pageSize: number;
  query: string;
}): MockURLSearchParams {
  const params = new MockURLSearchParams();

  // Add page if not 1
  if (state.page > 1) {
    params.set('page', state.page.toString());
  }

  // Add pageSize if not default
  if (state.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('pageSize', state.pageSize.toString());
  }

  // Add query if present
  if (state.query) {
    params.set('q', state.query);
  }

  // Add sort if not default
  if (state.sort && (state.sort.field !== DEFAULT_SORT.field || state.sort.dir !== DEFAULT_SORT.dir)) {
    params.set('sort', `${state.sort.field}:${state.sort.dir}`);
  }

  // Add filters if present (compact JSON format)
  if (state.filters && Object.keys(state.filters).length > 0) {
    const filtersJson = JSON.stringify(state.filters);
    params.set('filters', encodeURIComponent(filtersJson));
  }

  return params;
}

describe('URL Filters', () => {
  test('parses basic URL parameters correctly', () => {
    const searchParams = new MockURLSearchParams('?page=2&q=BMW&sort=price_eur:asc');
    const state = parseUrlParams(searchParams);
    
    expect(state.page).toBe(2);
    expect(state.query).toBe('BMW');
    expect(state.sort).toEqual({ field: 'price_eur', dir: 'asc' });
  });

  test('parses filter JSON from URL', () => {
    const filters = { make: ['BMW', 'Audi'], year: { min: 2020, max: 2023 } };
    const filtersJson = encodeURIComponent(JSON.stringify(filters));
    const searchParams = new MockURLSearchParams(`?filters=${filtersJson}`);
    const state = parseUrlParams(searchParams);
    
    expect(state.filters.make).toEqual(['BMW', 'Audi']);
    expect(state.filters.year).toEqual({ min: 2020, max: 2023 });
  });

  test('handles invalid URL parameters gracefully', () => {
    const searchParams = new MockURLSearchParams('?page=invalid&sort=invalid:format');
    const state = parseUrlParams(searchParams);
    
    expect(state.page).toBe(1); // Falls back to default
    expect(state.sort).toEqual(DEFAULT_SORT); // Falls back to default
  });

  test('round-trip conversion maintains state', () => {
    const originalState = {
      filters: { make: ['BMW'], year: { min: 2020 } },
      sort: { field: 'price_eur' as const, dir: 'desc' as const },
      page: 3,
      pageSize: 50,
      query: 'test search',
    };

    const urlParams = stateToUrlParams(originalState);
    const parsedState = parseUrlParams(urlParams);

    expect(parsedState.filters).toEqual(originalState.filters);
    expect(parsedState.sort).toEqual(originalState.sort);
    expect(parsedState.page).toBe(originalState.page);
    expect(parsedState.pageSize).toBe(originalState.pageSize);
    expect(parsedState.query).toBe(originalState.query);
  });

  test('omits default values from URL', () => {
    const state = {
      filters: {},
      sort: DEFAULT_SORT,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      query: '',
    };

    const urlParams = stateToUrlParams(state);
    const urlString = urlParams.toString();
    
    expect(urlString).toBe(''); // Should be empty when all defaults
  });

  test('includes only non-default values in URL', () => {
    const state = {
      filters: { make: ['BMW'] },
      sort: { field: 'price_eur' as const, dir: 'asc' as const },
      page: 2,
      pageSize: DEFAULT_PAGE_SIZE,
      query: '',
    };

    const urlParams = stateToUrlParams(state);
    const urlString = urlParams.toString();
    
    expect(urlString).toContain('page=2');
    expect(urlString).toContain('sort=price_eur%3Aasc');
    expect(urlString).toContain('filters=');
    expect(urlString).not.toContain('pageSize='); // Should not include default pageSize
    expect(urlString).not.toContain('q='); // Should not include empty query
  });

  test('handles complex filter structures', () => {
    const filters = {
      make: ['BMW', 'Mercedes-Benz'],
      model: ['X5', 'C-Class'],
      year: { min: 2018, max: 2023 },
      price_eur: { max: 50000 },
      mileage_km: { min: 10000 },
      fuel: ['Gasoline', 'Diesel'],
      transmission: ['Automatic'],
    };

    const state = {
      filters,
      sort: DEFAULT_SORT,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      query: '',
    };

    const urlParams = stateToUrlParams(state);
    const parsedState = parseUrlParams(urlParams);

    expect(parsedState.filters).toEqual(filters);
  });

  test('handles filter edge cases', () => {
    const state = {
      filters: { make: [], model: [''], year: { min: undefined, max: 2023 } },
      sort: DEFAULT_SORT,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      query: '',
    };

    const urlParams = stateToUrlParams(state);
    const parsedState = parseUrlParams(urlParams);

    // Empty arrays and undefined values should be filtered out
    expect(parsedState.filters.make).toBeUndefined();
    expect(parsedState.filters.model).toBeUndefined();
    expect(parsedState.filters.year).toEqual({ max: 2023 });
  });
});