/**
 * Global Sorting Service
 * Handles fetching and sorting of ALL filtered cars across pages
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
  shouldUseGlobalSorting(totalCars: number, threshold: number = 50): boolean {
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
}