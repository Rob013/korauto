import { FilterState } from '@/hooks/useFiltersFromUrl';

export interface QueryParams {
  brand?: string;
  model?: string;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  yearMin?: string;
  yearMax?: string;
  priceMin?: string;
  priceMax?: string;
  mileageMin?: string;
  mileageMax?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
}

/**
 * Builds query parameters for the API from filter state.
 * Only includes selected filters; never sends empty/defaults.
 * 
 * @param filters - The current filter state
 * @returns Clean query parameters for API request
 */
export const buildQueryParams = (filters: FilterState): QueryParams => {
  const params: QueryParams = {};

  // Add only non-empty exact match filters
  if (filters.brand) params.brand = filters.brand;
  if (filters.model) params.model = filters.model;
  if (filters.fuel) params.fuel = filters.fuel;
  if (filters.transmission) params.transmission = filters.transmission;
  if (filters.bodyType) params.bodyType = filters.bodyType;
  if (filters.color) params.color = filters.color;
  if (filters.location) params.location = filters.location;
  if (filters.search) params.search = filters.search;

  // Add range filters only when both min and max are set, or when meaningful single values
  if (filters.yearMin !== undefined) params.yearMin = filters.yearMin.toString();
  if (filters.yearMax !== undefined) params.yearMax = filters.yearMax.toString();
  
  if (filters.priceMin !== undefined) params.priceMin = filters.priceMin.toString();
  if (filters.priceMax !== undefined) params.priceMax = filters.priceMax.toString();
  
  if (filters.mileageMin !== undefined) params.mileageMin = filters.mileageMin.toString();
  if (filters.mileageMax !== undefined) params.mileageMax = filters.mileageMax.toString();

  // Always include pagination and sort
  params.page = (filters.page || 1).toString();
  params.pageSize = (filters.pageSize || 20).toString();
  params.sort = filters.sort || 'price_asc';

  return params;
};

/**
 * Validates that range filters have min <= max
 * 
 * @param filters - The filter state to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateFilters = (filters: FilterState): string[] => {
  const errors: string[] = [];

  // Validate year range
  if (filters.yearMin !== undefined && filters.yearMax !== undefined) {
    if (filters.yearMin > filters.yearMax) {
      errors.push('Year minimum cannot be greater than maximum');
    }
  }

  // Validate price range
  if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
    if (filters.priceMin > filters.priceMax) {
      errors.push('Price minimum cannot be greater than maximum');
    }
  }

  // Validate mileage range
  if (filters.mileageMin !== undefined && filters.mileageMax !== undefined) {
    if (filters.mileageMin > filters.mileageMax) {
      errors.push('Mileage minimum cannot be greater than maximum');
    }
  }

  return errors;
};

/**
 * Checks if filters are valid (no validation errors)
 */
export const areFiltersValid = (filters: FilterState): boolean => {
  return validateFilters(filters).length === 0;
};