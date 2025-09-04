import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  // Exact match filters
  brand?: string;
  model?: string;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  
  // Enhanced filters for old layout
  condition?: string; // new, used, certified
  saleStatus?: string; // available, sold, pending
  drivetrain?: string; // AWD, FWD, RWD, 4WD
  doors?: string; // 2, 3, 4, 5
  
  // Range filters
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  
  // New range filters for enhanced experience
  engineSizeMin?: number; // Engine displacement in L
  engineSizeMax?: number;
  accidentCountMax?: number; // Maximum accident count
  
  // Pagination and sorting
  page?: number;
  pageSize?: number;
  sort?: string;
  
  // Search
  search?: string;
  
  // Boolean filters for enhanced filtering
  hasImages?: boolean; // Only cars with images
  isCertified?: boolean; // Only certified cars
  noAccidents?: boolean; // Only cars with no accident history
}

export const useFiltersFromUrl = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const filters: FilterState = {
    brand: searchParams.get('brand') || undefined,
    model: searchParams.get('model') || undefined,
    fuel: searchParams.get('fuel') || undefined,
    transmission: searchParams.get('transmission') || undefined,
    bodyType: searchParams.get('bodyType') || undefined,
    color: searchParams.get('color') || undefined,
    location: searchParams.get('location') || undefined,
    
    // Enhanced filters
    condition: searchParams.get('condition') || undefined,
    saleStatus: searchParams.get('saleStatus') || undefined,
    drivetrain: searchParams.get('drivetrain') || undefined,
    doors: searchParams.get('doors') || undefined,
    
    // Range filters
    yearMin: searchParams.get('yearMin') ? parseInt(searchParams.get('yearMin')!) : undefined,
    yearMax: searchParams.get('yearMax') ? parseInt(searchParams.get('yearMax')!) : undefined,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
    mileageMin: searchParams.get('mileageMin') ? parseInt(searchParams.get('mileageMin')!) : undefined,
    mileageMax: searchParams.get('mileageMax') ? parseInt(searchParams.get('mileageMax')!) : undefined,
    
    // Enhanced range filters
    engineSizeMin: searchParams.get('engineSizeMin') ? parseFloat(searchParams.get('engineSizeMin')!) : undefined,
    engineSizeMax: searchParams.get('engineSizeMax') ? parseFloat(searchParams.get('engineSizeMax')!) : undefined,
    accidentCountMax: searchParams.get('accidentCountMax') ? parseInt(searchParams.get('accidentCountMax')!) : undefined,
    
    // Boolean filters
    hasImages: searchParams.get('hasImages') === 'true' ? true : undefined,
    isCertified: searchParams.get('isCertified') === 'true' ? true : undefined,
    noAccidents: searchParams.get('noAccidents') === 'true' ? true : undefined,
    
    // Pagination and sorting
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    sort: searchParams.get('sort') || 'price_asc',
    search: searchParams.get('search') || undefined,
  };

  // Update filters in URL
  const updateFilters = useCallback((newFilters: Partial<FilterState>, options?: { replace?: boolean }) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Remove undefined/null values
    const cleanFilters = Object.entries(updatedFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value.toString();
      }
      return acc;
    }, {} as Record<string, string>);

    // Always include page (default to 1) and sort (default)
    if (!cleanFilters.page) cleanFilters.page = '1';
    if (!cleanFilters.sort) cleanFilters.sort = 'price_asc';

    setSearchParams(cleanFilters, { replace: options?.replace });
  }, [filters, setSearchParams]);

  // Clear all filters except page and sort
  const clearFilters = useCallback(() => {
    setSearchParams({ page: '1', sort: filters.sort || 'price_asc' });
  }, [setSearchParams, filters.sort]);

  // Update single filter
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    // For sort and page changes, don't reset page to maintain accumulated cars
    if (key === 'sort' || key === 'page') {
      updateFilters({ [key]: value });
    } else {
      // Reset to page 1 when any other filter changes
      updateFilters({ [key]: value, page: 1 });
    }
  }, [updateFilters]);

  // Handle dependent filters: when brand changes, reset model
  const updateBrand = useCallback((brand: string | undefined) => {
    updateFilters({ brand, model: undefined, page: 1 });
  }, [updateFilters]);

  return {
    filters,
    updateFilters,
    updateFilter,
    updateBrand,
    clearFilters,
  };
};