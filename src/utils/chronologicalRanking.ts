/**
 * Chronological Ranking Utility
 * Handles proper chronological ordering and ranking of cars across all pages
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
 * Applies chronological ranking to all filtered cars
 */
export const applyChronologicalRanking = (
  cars: any[],
  sortBy: SortOption,
  carsPerPage: number = 50
): ChronologicalRankingResult => {
  // Sort all cars first
  const sortedCars = sortCarsByOption(cars, sortBy);
  
  // Apply ranking and pagination info
  const rankedCars: CarWithRank[] = sortedCars.map((car, index) => {
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
  
  const totalPages = Math.ceil(sortedCars.length / carsPerPage);
  
  return {
    rankedCars,
    totalPages,
    carsPerPage,
    totalCars: sortedCars.length,
    sortedBy: sortBy
  };
};

/**
 * Gets cars for a specific page from ranked results
 */
export const getCarsForPage = (
  rankedCars: CarWithRank[],
  pageNumber: number,
  carsPerPage: number = 50
): CarWithRank[] => {
  const startIndex = (pageNumber - 1) * carsPerPage;
  const endIndex = startIndex + carsPerPage;
  
  return rankedCars.slice(startIndex, endIndex);
};

/**
 * Sorts cars by the selected option with proper chronological ordering
 */
const sortCarsByOption = (cars: any[], sortBy: SortOption): any[] => {
  const sortedCars = [...cars];
  
  switch (sortBy) {
    case "recently_added":
      return sortedCars.sort((a, b) => {
        const dateA = new Date(a.created_at || a.last_synced_at || 0).getTime();
        const dateB = new Date(b.created_at || b.last_synced_at || 0).getTime();
        return dateB - dateA; // Newest first
      });
      
    case "price_low":
      return sortedCars.sort((a, b) => {
        const priceA = getBuyNowPrice(a) || 0;
        const priceB = getBuyNowPrice(b) || 0;
        return priceA - priceB; // Lowest first
      });
      
    case "price_high":
      return sortedCars.sort((a, b) => {
        const priceA = getBuyNowPrice(a) || 0;
        const priceB = getBuyNowPrice(b) || 0;
        return priceB - priceA; // Highest first
      });
      
    case "year_new":
      return sortedCars.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        if (yearA !== yearB) {
          return yearB - yearA; // Newest year first
        }
        // Secondary sort by recently added for same year
        const dateA = new Date(a.created_at || a.last_synced_at || 0).getTime();
        const dateB = new Date(b.created_at || b.last_synced_at || 0).getTime();
        return dateB - dateA;
      });
      
    case "year_old":
      return sortedCars.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        if (yearA !== yearB) {
          return yearA - yearB; // Oldest year first
        }
        // Secondary sort by recently added for same year
        const dateA = new Date(a.created_at || a.last_synced_at || 0).getTime();
        const dateB = new Date(b.created_at || b.last_synced_at || 0).getTime();
        return dateB - dateA;
      });
      
    case "mileage_low":
      return sortedCars.sort((a, b) => {
        const mileageA = getMileage(a) || 999999;
        const mileageB = getMileage(b) || 999999;
        return mileageA - mileageB; // Lowest mileage first
      });
      
    case "mileage_high":
      return sortedCars.sort((a, b) => {
        const mileageA = getMileage(a) || 0;
        const mileageB = getMileage(b) || 0;
        return mileageB - mileageA; // Highest mileage first
      });
      
    case "make_az":
      return sortedCars.sort((a, b) => {
        const makeA = (a.manufacturer?.name || a.make || "").toLowerCase();
        const makeB = (b.manufacturer?.name || b.make || "").toLowerCase();
        return makeA.localeCompare(makeB);
      });
      
    case "make_za":
      return sortedCars.sort((a, b) => {
        const makeA = (a.manufacturer?.name || a.make || "").toLowerCase();
        const makeB = (b.manufacturer?.name || b.make || "").toLowerCase();
        return makeB.localeCompare(makeA);
      });
      
    case "popular":
      return sortedCars.sort((a, b) => {
        const popularityA = a.popularity_score || a.lots?.[0]?.popularity_score || 0;
        const popularityB = b.popularity_score || b.lots?.[0]?.popularity_score || 0;
        return popularityB - popularityA; // Highest popularity first
      });
      
    default:
      return sortedCars;
  }
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
 * Validates if chronological ranking is consistent across all pages
 */
export const validateChronologicalRanking = (
  rankedCars: CarWithRank[],
  sortBy: SortOption
): boolean => {
  if (rankedCars.length <= 1) return true;
  
  // Check if ranks are sequential
  for (let i = 0; i < rankedCars.length; i++) {
    if (rankedCars[i].rank !== i + 1) {
      console.warn(`Invalid rank at index ${i}: expected ${i + 1}, got ${rankedCars[i].rank}`);
      return false;
    }
  }
  
  // Check if sorting is consistent
  for (let i = 1; i < rankedCars.length; i++) {
    const prev = rankedCars[i - 1];
    const curr = rankedCars[i];
    
    if (!isCorrectOrder(prev, curr, sortBy)) {
      console.warn(`Incorrect sort order at index ${i} for sort option ${sortBy}`);
      return false;
    }
  }
  
  return true;
};

/**
 * Enhanced validation for cross-page ranking consistency
 * Specifically checks that ranking is consistent across page boundaries
 */
export const validateCrossPageRanking = (
  rankedCars: CarWithRank[],
  carsPerPage: number = 50,
  sortBy: SortOption
): {
  isValid: boolean;
  errors: string[];
  pageValidations: Array<{
    page: number;
    isValid: boolean;
    errors: string[];
  }>;
} => {
  const errors: string[] = [];
  const pageValidations: Array<{
    page: number;
    isValid: boolean;
    errors: string[];
  }> = [];

  if (rankedCars.length === 0) {
    return { isValid: true, errors: [], pageValidations: [] };
  }

  const totalPages = Math.ceil(rankedCars.length / carsPerPage);

  // Validate each page individually
  for (let page = 1; page <= totalPages; page++) {
    const pageErrors: string[] = [];
    const pageCars = getCarsForPage(rankedCars, page, carsPerPage);
    
    // Check ranking within page
    for (let i = 0; i < pageCars.length; i++) {
      const expectedRank = (page - 1) * carsPerPage + i + 1;
      const expectedPageNumber = page;
      const expectedPositionInPage = i + 1;
      
      if (pageCars[i].rank !== expectedRank) {
        pageErrors.push(`Page ${page}, position ${i + 1}: expected rank ${expectedRank}, got ${pageCars[i].rank}`);
      }
      
      if (pageCars[i].pageNumber !== expectedPageNumber) {
        pageErrors.push(`Page ${page}, position ${i + 1}: expected pageNumber ${expectedPageNumber}, got ${pageCars[i].pageNumber}`);
      }
      
      if (pageCars[i].positionInPage !== expectedPositionInPage) {
        pageErrors.push(`Page ${page}, position ${i + 1}: expected positionInPage ${expectedPositionInPage}, got ${pageCars[i].positionInPage}`);
      }
    }
    
    // Check sort order within page
    for (let i = 1; i < pageCars.length; i++) {
      if (!isCorrectOrder(pageCars[i - 1], pageCars[i], sortBy)) {
        pageErrors.push(`Page ${page}: sort order violation between position ${i} and ${i + 1}`);
      }
    }
    
    // Check page boundary consistency
    if (page > 1) {
      const prevPageCars = getCarsForPage(rankedCars, page - 1, carsPerPage);
      const lastPrevCar = prevPageCars[prevPageCars.length - 1];
      const firstCurrCar = pageCars[0];
      
      // Check rank continuity
      if (firstCurrCar.rank !== lastPrevCar.rank + 1) {
        pageErrors.push(`Page boundary ${page - 1} to ${page}: rank discontinuity (${lastPrevCar.rank} -> ${firstCurrCar.rank})`);
      }
      
      // Check sort order continuity
      if (!isCorrectOrder(lastPrevCar, firstCurrCar, sortBy)) {
        pageErrors.push(`Page boundary ${page - 1} to ${page}: sort order violation`);
      }
    }
    
    pageValidations.push({
      page,
      isValid: pageErrors.length === 0,
      errors: pageErrors
    });
    
    errors.push(...pageErrors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    pageValidations
  };
};

/**
 * Quick validation function specifically for ranking consistency
 * Returns true if all rankings are correct across all pages
 */
export const isRankingConsistentAcrossPages = (
  rankedCars: CarWithRank[],
  carsPerPage: number = 50
): boolean => {
  const validation = validateCrossPageRanking(rankedCars, carsPerPage, 'recently_added');
  return validation.isValid;
};

/**
 * Helper to check if two cars are in correct order for the sort option
 */
const isCorrectOrder = (car1: any, car2: any, sortBy: SortOption): boolean => {
  switch (sortBy) {
    case "price_low":
      return getBuyNowPrice(car1) <= getBuyNowPrice(car2);
    case "price_high":
      return getBuyNowPrice(car1) >= getBuyNowPrice(car2);
    case "year_new":
      return (parseInt(car1.year) || 0) >= (parseInt(car2.year) || 0);
    case "year_old":
      return (parseInt(car1.year) || 0) <= (parseInt(car2.year) || 0);
    case "mileage_low":
      return getMileage(car1) <= getMileage(car2);
    case "mileage_high":
      return getMileage(car1) >= getMileage(car2);
    default:
      return true; // For other sort options, assume order is correct
  }
};