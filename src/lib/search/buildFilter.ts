import { SearchReq } from './types';

/**
 * Builds a filter query string from the filters object
 * Implements AND across facets and OR within each facet
 * @param filters The filters object from SearchReq
 * @returns Filter query string
 */
export function buildFilter(filters: SearchReq['filters']): string {
  if (!filters) return '';
  
  const parts: string[] = [];
  
  // Helper function to create IN clause for arrays (OR within a facet)
  const createInClause = (field: string, values: string[]): string | null => {
    if (!values?.length) return null;
    const quotedValues = values.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',');
    return `${field} IN [${quotedValues}]`;
  };
  
  // Categorical filters (OR within a facet, AND across facets)
  const categoricalFields = [
    'country', 'make', 'model', 'trim', 'fuel', 'transmission', 
    'body', 'drive', 'use_type', 'exterior_color', 'interior_color', 
    'region', 'options'
  ] as const;
  
  categoricalFields.forEach(field => {
    const values = filters[field];
    if (values?.length) {
      const clause = createInClause(field, values);
      if (clause) parts.push(clause);
    }
  });
  
  // Numeric array filters
  if (filters.owners?.length) {
    parts.push(`owners IN [${filters.owners.join(',')}]`);
  }
  
  if (filters.seats?.length) {
    parts.push(`seats IN [${filters.seats.join(',')}]`);
  }
  
  // Accident filter with special handling
  if (filters.accident?.length) {
    const quotedValues = filters.accident.map(s => `"${s}"`).join(',');
    parts.push(`accident IN [${quotedValues}]`);
  }
  
  // Numeric range filters (AND within a range)
  const createRangeClause = (field: string, range: { min?: number; max?: number }): string | null => {
    if (!range) return null;
    
    const conditions: string[] = [];
    if (typeof range.min === 'number') {
      conditions.push(`${field} >= ${range.min}`);
    }
    if (typeof range.max === 'number') {
      conditions.push(`${field} <= ${range.max}`);
    }
    
    return conditions.length > 0 ? conditions.join(' AND ') : null;
  };
  
  const rangeFields = ['year', 'price_eur', 'mileage_km', 'engine_cc'] as const;
  rangeFields.forEach(field => {
    const range = filters[field];
    if (range) {
      const clause = createRangeClause(field, range);
      if (clause) parts.push(`(${clause})`);
    }
  });
  
  return parts.join(' AND ');
}

/**
 * Converts filters to a standardized format for consistent processing
 * @param filters Raw filters object
 * @returns Normalized filters object
 */
export function normalizeFilters(filters: any): SearchReq['filters'] {
  if (!filters) return {};
  
  const normalized: SearchReq['filters'] = {};
  
  // Ensure array fields are arrays
  const arrayFields = [
    'country', 'make', 'model', 'trim', 'fuel', 'transmission',
    'body', 'drive', 'use_type', 'exterior_color', 'interior_color',
    'region', 'options', 'accident'
  ];
  
  arrayFields.forEach(field => {
    const value = filters[field];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        normalized[field] = value.filter(v => v != null && v !== '');
      } else if (typeof value === 'string' && value.trim()) {
        normalized[field] = [value.trim()];
      }
    }
  });
  
  // Ensure numeric array fields are numeric arrays
  const numericArrayFields = ['owners', 'seats'];
  numericArrayFields.forEach(field => {
    const value = filters[field];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        normalized[field] = value.map(Number).filter(n => !isNaN(n));
      } else if (!isNaN(Number(value))) {
        normalized[field] = [Number(value)];
      }
    }
  });
  
  // Ensure range fields are properly formatted
  const rangeFields = ['year', 'price_eur', 'mileage_km', 'engine_cc'];
  rangeFields.forEach(field => {
    const value = filters[field];
    if (value && typeof value === 'object') {
      const range: { min?: number; max?: number } = {};
      if (value.min !== undefined && value.min !== null && !isNaN(Number(value.min))) {
        range.min = Number(value.min);
      }
      if (value.max !== undefined && value.max !== null && !isNaN(Number(value.max))) {
        range.max = Number(value.max);
      }
      if (range.min !== undefined || range.max !== undefined) {
        normalized[field] = range;
      }
    }
  });
  
  return normalized;
}

/**
 * Creates a hash of the filters for cache key generation
 * @param filters Filters object
 * @returns Hash string
 */
export function createFiltersHash(filters: SearchReq['filters']): string {
  if (!filters) return 'empty';
  
  const normalized = normalizeFilters(filters);
  const sortedKeys = Object.keys(normalized).sort();
  const pairs = sortedKeys.map(key => `${key}:${JSON.stringify(normalized[key])}`);
  
  return btoa(pairs.join('|')).replace(/[+/=]/g, '').slice(0, 16);
}