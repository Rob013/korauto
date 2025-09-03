/**
 * Chronological Ranking Utility - DEPRECATED
 * 
 * ⚠️ WARNING: This file contains client-side sorting logic that has been deprecated.
 * All sorting is now handled by the backend API at /api/cars with global sorting.
 * 
 * This file is kept for backward compatibility but should not be used for new code.
 * Use the backend API with proper sort parameters instead.
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
 * @deprecated Use backend API /api/cars with sort parameter instead
 * Applies chronological ranking to all filtered cars
 */
export const applyChronologicalRanking = (
  cars: any[],
  sortBy: SortOption,
  carsPerPage: number = 50
): ChronologicalRankingResult => {
  console.warn('⚠️ DEPRECATED: applyChronologicalRanking is deprecated. Use backend API /api/cars with sort parameter instead.');
  
  // Just return the cars as-is without sorting (backend handles this now)
  const rankedCars: CarWithRank[] = cars.map((car, index) => {
    const rank = index + 1;
    const pageNumber = Math.ceil(rank / carsPerPage);
    const positionInPage = ((rank - 1) % carsPerPage) + 1;
    
    return {
      ...car,
      rank,
      pageNumber,
      positionInPage
    };
  });
  
  const totalPages = Math.ceil(cars.length / carsPerPage);
  
  return {
    rankedCars,
    totalPages,
    carsPerPage,
    totalCars: cars.length,
    sortedBy: sortBy
  };
};

/**
 * @deprecated Use backend pagination instead
 * Gets cars for a specific page from ranked results
 */
export const getCarsForPage = (
  rankedCars: CarWithRank[],
  pageNumber: number,
  carsPerPage: number = 50
): CarWithRank[] => {
  console.warn('⚠️ DEPRECATED: getCarsForPage is deprecated. Use backend API /api/cars with page parameter instead.');
  
  const startIndex = (pageNumber - 1) * carsPerPage;
  const endIndex = startIndex + carsPerPage;
  
  return rankedCars.slice(startIndex, endIndex);
};

/**
 * @deprecated All sorting is now handled by the backend API
 * CLIENT-SIDE SORTING IS NO LONGER USED - BACKEND HANDLES ALL SORTING
 */
const sortCarsByOption = (cars: any[], sortBy: SortOption): any[] => {
  console.error('🚫 CLIENT-SIDE SORTING BLOCKED: sortCarsByOption should not be used. All sorting is handled by the backend API /api/cars.');
  
  // Return cars as-is without sorting to prevent client-side sorting
  // The backend API should handle all sorting with proper global ordering
  return cars;
};

/**
 * Helper function to get buy now price from car data
 */
const getBuyNowPrice = (car: any): number => {
  // Try different price fields in priority order
  if (car.lots?.[0]?.buy_now) {
    return Number(car.lots[0].buy_now);
  }
  if (car.buy_now_price) {
    return Number(car.buy_now_price);
  }
  if (car.price) {
    return Number(car.price);
  }
  if (car.lots?.[0]?.final_price) {
    return Number(car.lots[0].final_price);
  }
  return 0;
};

/**
 * Helper function to get mileage from car data
 */
const getMileage = (car: any): number => {
  // Try different mileage fields in priority order
  if (car.lots?.[0]?.odometer?.km) {
    return Number(car.lots[0].odometer.km);
  }
  if (car.mileage) {
    return Number(car.mileage);
  }
  if (car.lots?.[0]?.odometer?.miles) {
    return Number(car.lots[0].odometer.miles) * 1.60934; // Convert miles to km
  }
  return 0;
};

/**
 * Gets ranking info for a specific car
 */
export const getCarRankingInfo = (
  carId: string,
  rankedCars: CarWithRank[]
): CarWithRank | null => {
  return rankedCars.find(car => car.id === carId) || null;
};

/**
 * @deprecated Backend sorting validation is handled server-side
 * Validates if chronological ranking is consistent
 */
export const validateChronologicalRanking = (
  rankedCars: CarWithRank[],
  sortBy: SortOption
): boolean => {
  console.warn('⚠️ DEPRECATED: validateChronologicalRanking is deprecated. Backend API handles sorting validation.');
  
  // Simplified validation since backend handles sorting
  if (rankedCars.length <= 1) return true;
  
  // Just check if ranks are sequential (basic check)
  for (let i = 0; i < rankedCars.length; i++) {
    if (rankedCars[i].rank !== i + 1) {
      console.warn(`Invalid rank at index ${i}: expected ${i + 1}, got ${rankedCars[i].rank}`);
      return false;
    }
  }
  
  return true;
};

/**
 * @deprecated Backend handles sort order validation
 * Helper to check if two cars are in correct order for the sort option
 */
const isCorrectOrder = (car1: any, car2: any, sortBy: SortOption): boolean => {
  console.warn('⚠️ DEPRECATED: isCorrectOrder is deprecated. Backend API handles sort order validation.');
  
  // Always return true since backend handles sort validation
  return true;
};