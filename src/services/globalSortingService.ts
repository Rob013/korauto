/**
 * Global Sorting Service
 * @deprecated - This service is deprecated as sorting is now handled globally on the backend
 * using keyset pagination. Use fetchCarsWithKeyset from @/services/carsApi instead.
 * 
 * This file is kept for backwards compatibility but all client-side sorting 
 * has been moved to the backend for better performance and consistency.
 */

import { APIFilters } from '@/utils/catalog-filter';
import { SortOption } from '@/hooks/useSortedCars';
import { CarWithRank, applyChronologicalRanking, ChronologicalRankingResult } from '@/utils/chronologicalRanking';

export interface GlobalSortingState {
  isGlobalSorting: boolean;
  allCars: any[];
  rankedCars: CarWithRank[];
  totalCars: number;
  totalPages: number;
  currentSortBy: SortOption;
  isLoading: boolean;
  error: string | null;
  lastFetchKey: string;
}

export class GlobalSortingService {
  private cache = new Map<string, ChronologicalRankingResult>();
  private maxCacheSize = 10;

  /**
   * Creates a unique cache key for the current filters and sort option
   */
  private createCacheKey(filters: APIFilters, sortBy: SortOption): string {
    const filterKey = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `${filterKey}__${sortBy}`;
  }

  /**
   * Manages cache size to prevent memory leaks
   */
  private manageCacheSize(): void {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Gets cached result if available
   */
  getCachedResult(filters: APIFilters, sortBy: SortOption): ChronologicalRankingResult | null {
    const key = this.createCacheKey(filters, sortBy);
    return this.cache.get(key) || null;
  }

  /**
   * Caches sorting result
   */
  cacheResult(filters: APIFilters, sortBy: SortOption, result: ChronologicalRankingResult): void {
    const key = this.createCacheKey(filters, sortBy);
    this.cache.set(key, result);
    this.manageCacheSize();
  }

  /**
   * Applies global sorting to all cars with chronological ranking
   */
  async sortAllCars(
    allCars: any[],
    filters: APIFilters,
    sortBy: SortOption,
    carsPerPage: number = 50
  ): Promise<ChronologicalRankingResult> {
    // Check cache first
    const cached = this.getCachedResult(filters, sortBy);
    if (cached && cached.totalCars === allCars.length) {
      console.log(`📋 Using cached global sorting result for ${sortBy} (${cached.totalCars} cars)`);
      return cached;
    }

    console.log(`🔄 Applying global sorting to ${allCars.length} cars with sort option: ${sortBy}`);
    
    // Apply chronological ranking to all cars
    const result = applyChronologicalRanking(allCars, sortBy, carsPerPage);
    
    // Cache the result
    this.cacheResult(filters, sortBy, result);
    
    console.log(`✅ Global sorting complete: ${result.totalCars} cars ranked across ${result.totalPages} pages`);
    
    return result;
  }

  /**
   * Validates if a global sort is needed
   */
  shouldUseGlobalSorting(totalCars: number, threshold: number = 30): boolean {
    return totalCars > threshold;
  }

  /**
   * Clears cache (useful when filters change significantly)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Global sorting cache cleared');
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Filters cars based on current filter settings (client-side filtering)
   */
  applyClientSideFilters(cars: any[], filters: APIFilters): any[] {
    return cars.filter(car => {
      // Apply grade filter if specified
      if (filters.grade_iaai && filters.grade_iaai !== 'all') {
        const carGrade = car.lots?.[0]?.grade_iaai || '';
        if (carGrade.toLowerCase() !== filters.grade_iaai.toLowerCase()) {
          return false;
        }
      }

      // Add other client-side filters as needed
      return true;
    });
  }

  /**
   * Gets the appropriate dataset for sorting based on state
   */
  getDatasetForSorting(
    currentPageCars: any[],
    allCars: any[],
    useGlobalSorting: boolean
  ): any[] {
    if (useGlobalSorting && allCars.length > 0) {
      console.log(`📊 Using global dataset: ${allCars.length} cars`);
      return allCars;
    } else {
      console.log(`📄 Using current page dataset: ${currentPageCars.length} cars`);
      return currentPageCars;
    }
  }

  /**
   * Checks if the sort parameters have changed
   */
  hasSortParametersChanged(
    currentFilters: APIFilters,
    currentSortBy: SortOption,
    lastFilters: APIFilters,
    lastSortBy: SortOption
  ): boolean {
    const currentKey = this.createCacheKey(currentFilters, currentSortBy);
    const lastKey = this.createCacheKey(lastFilters, lastSortBy);
    return currentKey !== lastKey;
  }

  /**
   * Validates ranking consistency across all pages
   * Ensures perfect ranking from first page to last page
   */
  validateRankingConsistency(
    result: ChronologicalRankingResult,
    carsPerPage: number = 50
  ): {
    isValid: boolean;
    totalCars: number;
    totalPages: number;
    errors: string[];
    summary: string;
  } {
    const { rankedCars, totalCars, totalPages, sortedBy } = result;
    const errors: string[] = [];

    // Basic validation
    if (totalCars !== rankedCars.length) {
      errors.push(`Total cars mismatch: expected ${totalCars}, got ${rankedCars.length}`);
    }

    if (totalPages !== Math.ceil(totalCars / carsPerPage)) {
      errors.push(`Total pages mismatch: expected ${Math.ceil(totalCars / carsPerPage)}, got ${totalPages}`);
    }

    // Validate each page
    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * carsPerPage;
      const endIndex = Math.min(startIndex + carsPerPage, totalCars);
      const expectedCarsOnPage = endIndex - startIndex;

      const pageCars = rankedCars.slice(startIndex, endIndex);

      if (pageCars.length !== expectedCarsOnPage) {
        errors.push(`Page ${page}: expected ${expectedCarsOnPage} cars, got ${pageCars.length}`);
        continue;
      }

      // Validate ranks on this page
      for (let i = 0; i < pageCars.length; i++) {
        const expectedRank = startIndex + i + 1;
        const expectedPageNumber = page;
        const expectedPositionInPage = i + 1;

        const car = pageCars[i];

        if (car.rank !== expectedRank) {
          errors.push(`Page ${page}, position ${i + 1}: expected rank ${expectedRank}, got ${car.rank}`);
        }

        if (car.pageNumber !== expectedPageNumber) {
          errors.push(`Page ${page}, position ${i + 1}: expected pageNumber ${expectedPageNumber}, got ${car.pageNumber}`);
        }

        if (car.positionInPage !== expectedPositionInPage) {
          errors.push(`Page ${page}, position ${i + 1}: expected positionInPage ${expectedPositionInPage}, got ${car.positionInPage}`);
        }
      }

      // Validate sort order within page
      for (let i = 1; i < pageCars.length; i++) {
        if (!this.isCorrectSortOrder(pageCars[i - 1], pageCars[i], sortedBy)) {
          errors.push(`Page ${page}: sort order violation between position ${i} and ${i + 1}`);
        }
      }

      // Validate page boundary consistency (if not first page)
      if (page > 1) {
        const prevPageLastIndex = startIndex - 1;
        const prevPageLastCar = rankedCars[prevPageLastIndex];
        const currPageFirstCar = pageCars[0];

        // Check rank continuity
        if (currPageFirstCar.rank !== prevPageLastCar.rank + 1) {
          errors.push(`Page boundary ${page - 1} to ${page}: rank discontinuity (${prevPageLastCar.rank} -> ${currPageFirstCar.rank})`);
        }

        // Check sort order continuity
        if (!this.isCorrectSortOrder(prevPageLastCar, currPageFirstCar, sortedBy)) {
          errors.push(`Page boundary ${page - 1} to ${page}: sort order violation`);
        }
      }
    }

    const isValid = errors.length === 0;
    const summary = isValid 
      ? `✅ Perfect ranking: ${totalCars} cars across ${totalPages} pages`
      : `❌ Ranking issues: ${errors.length} errors found`;

    return {
      isValid,
      totalCars,
      totalPages,
      errors,
      summary
    };
  }

  /**
   * Helper method to check correct sort order between two cars
   */
  private isCorrectSortOrder(car1: any, car2: any, sortBy: SortOption): boolean {
    switch (sortBy) {
      case 'price_low':
        return this.getBuyNowPrice(car1) <= this.getBuyNowPrice(car2);
      case 'price_high':
        return this.getBuyNowPrice(car1) >= this.getBuyNowPrice(car2);
      case 'year_new':
        return (parseInt(car1.year) || 0) >= (parseInt(car2.year) || 0);
      case 'year_old':
        return (parseInt(car1.year) || 0) <= (parseInt(car2.year) || 0);
      case 'mileage_low':
        return this.getMileage(car1) <= this.getMileage(car2);
      case 'mileage_high':
        return this.getMileage(car1) >= this.getMileage(car2);
      case 'recently_added':
        const date1 = new Date(car1.created_at || car1.last_synced_at || 0).getTime();
        const date2 = new Date(car2.created_at || car2.last_synced_at || 0).getTime();
        return date1 >= date2;
      default:
        return true; // For other sort options, assume order is correct
    }
  }

  /**
   * Helper to get buy now price from car data
   */
  private getBuyNowPrice(car: any): number {
    if (car.lots?.[0]?.buy_now) return Number(car.lots[0].buy_now);
    if (car.buy_now_price) return Number(car.buy_now_price);
    if (car.price) return Number(car.price);
    if (car.lots?.[0]?.final_price) return Number(car.lots[0].final_price);
    return 0;
  }

  /**
   * Helper to get mileage from car data
   */
  private getMileage(car: any): number {
    if (car.lots?.[0]?.odometer?.km) return Number(car.lots[0].odometer.km);
    if (car.mileage) return Number(car.mileage);
    if (car.lots?.[0]?.odometer?.miles) return Number(car.lots[0].odometer.miles) * 1.60934;
    return 0;
  }

  /**
   * Quick validation method for production use
   * Returns true if ranking is perfect across all pages
   */
  isRankingPerfect(result: ChronologicalRankingResult, carsPerPage: number = 50): boolean {
    const validation = this.validateRankingConsistency(result, carsPerPage);
    return validation.isValid;
  }
}