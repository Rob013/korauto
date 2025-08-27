/**
 * Mapping between frontend sort options and backend sort options
 * This enables the migration from client-side to backend sorting
 */

import { SortOption as FrontendSortOption } from '@/hooks/useSortedCars';
import { SortOption as BackendSortOption } from '@/services/carsApi';

/**
 * Maps frontend sort options to backend sort options
 */
export const mapFrontendToBackendSort = (frontendSort: FrontendSortOption): BackendSortOption => {
  const mapping: Record<FrontendSortOption, BackendSortOption> = {
    'recently_added': 'rank_desc', // Most recently added should use ranking
    'oldest_first': 'rank_asc',
    'price_low': 'price_asc',
    'price_high': 'price_desc',
    'year_new': 'rank_desc', // For now, map to rank - can be enhanced later
    'year_old': 'rank_asc',
    'mileage_low': 'rank_asc', // For now, map to rank - can be enhanced later
    'mileage_high': 'rank_desc',
    'make_az': 'rank_asc', // For now, map to rank - can be enhanced later
    'make_za': 'rank_desc',
    'popular': 'rank_desc'
  };

  return mapping[frontendSort] || 'price_asc'; // Default fallback
};

/**
 * Check if a sort option should use global backend sorting
 */
export const shouldUseBackendSorting = (totalCount: number, threshold: number = 30): boolean => {
  return totalCount > threshold;
};