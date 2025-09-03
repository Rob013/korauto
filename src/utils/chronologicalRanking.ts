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
 * Validates if chronological ranking is consistent
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