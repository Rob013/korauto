/**
 * Chronological Ranking Utility - DEPRECATED
 * 
 * This module is deprecated as sorting is now handled entirely on the backend
 * for better performance and global consistency. All sorting operations
 * should use the /api/cars endpoint with sort parameters.
 * 
 * @deprecated Use backend sorting via fetchCarsWithPagination() instead
 */

import { SortOption } from '@/hooks/useSortedCars';

export interface CarWithRank {
  id: string;
  rank: number;
  pageNumber: number;
  positionInPage: number;
  [key: string]: any;
}

export interface ChronologicalRankingResult {
  rankedCars: CarWithRank[];
  totalPages: number;
  carsPerPage: number;
  totalCars: number;
  sortedBy: SortOption;
}

/**
 * @deprecated - All sorting should be handled on the backend via /api/cars endpoint
 */
export const applyChronologicalRanking = (
  cars: any[],
  sortBy: SortOption,
  carsPerPage: number = 50
): ChronologicalRankingResult => {
  console.warn('⚠️ applyChronologicalRanking is deprecated. Use backend sorting via /api/cars endpoint instead.');
  
  // For backward compatibility, return unsorted cars with minimal ranking
  const rankedCars: CarWithRank[] = cars.map((car, index) => ({
    ...car,
    rank: index + 1,
    pageNumber: Math.ceil((index + 1) / carsPerPage),
    positionInPage: ((index) % carsPerPage) + 1
  }));
  
  return {
    rankedCars,
    totalPages: Math.ceil(cars.length / carsPerPage),
    carsPerPage,
    totalCars: cars.length,
    sortedBy: sortBy
  };
};

/**
 * @deprecated - Use backend pagination via /api/cars endpoint instead
 */
export const getCarsForPage = (
  rankedCars: CarWithRank[],
  pageNumber: number,
  carsPerPage: number = 50
): CarWithRank[] => {
  console.warn('⚠️ getCarsForPage is deprecated. Use backend pagination via /api/cars endpoint instead.');
  
  const startIndex = (pageNumber - 1) * carsPerPage;
  const endIndex = startIndex + carsPerPage;
  return rankedCars.slice(startIndex, endIndex);
};

/**
 * @deprecated - All sorting handled on backend now
 */
export const getCarRankingInfo = (
  carId: string,
  rankedCars: CarWithRank[]
): CarWithRank | null => {
  return rankedCars.find(car => car.id === carId) || null;
};

/**
 * @deprecated - Backend handles sorting validation
 */
export const validateChronologicalRanking = (
  rankedCars: CarWithRank[],
  sortBy: SortOption
): boolean => {
  console.warn('⚠️ validateChronologicalRanking is deprecated. Backend handles sort validation.');
  return true; // Always return true for backward compatibility
};