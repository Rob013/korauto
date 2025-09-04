/**
 * Global Sorting Service
 * High-performance sorting with stable comparators and NULLS LAST behavior
 */

// LeanCar interface moved here to avoid circular dependency
export interface LeanCar {
  id: string;
  price: number;
  year: number;
  mileage?: number;
  make: string;
  model: string;
  thumbnail?: string;
}

export type SortKey = 
  | 'price_asc' | 'price_desc'
  | 'year_asc' | 'year_desc'
  | 'mileage_asc' | 'mileage_desc'
  | 'make_asc' | 'make_desc'
  | 'model_asc' | 'model_desc';

export interface SortedResult {
  items: LeanCar[];
  total: number;
  sortKey: SortKey;
  duration: number;
}

export interface PaginatedResult {
  items: LeanCar[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
}

// Constants for null handling
const POSITIVE_INFINITY = Number.MAX_SAFE_INTEGER;
const NEGATIVE_INFINITY = Number.MIN_SAFE_INTEGER;

/**
 * Stable comparator function that ensures consistent ordering
 * Uses secondary sort by ID to ensure stability
 */
function createComparator(sortKey: SortKey): (a: LeanCar, b: LeanCar) => number {
  switch (sortKey) {
    case 'price_asc':
      return (a, b) => {
        const aPrice = (a.price !== undefined && a.price !== null) ? a.price : POSITIVE_INFINITY;
        const bPrice = (b.price !== undefined && b.price !== null) ? b.price : POSITIVE_INFINITY;
        const priceDiff = aPrice - bPrice;
        return priceDiff !== 0 ? priceDiff : a.id.localeCompare(b.id);
      };

    case 'price_desc':
      return (a, b) => {
        const aPrice = (a.price !== undefined && a.price !== null) ? a.price : NEGATIVE_INFINITY;
        const bPrice = (b.price !== undefined && b.price !== null) ? b.price : NEGATIVE_INFINITY;
        const priceDiff = bPrice - aPrice;
        return priceDiff !== 0 ? priceDiff : a.id.localeCompare(b.id);
      };

    case 'year_asc':
      return (a, b) => {
        const aYear = (a.year !== undefined && a.year !== null) ? a.year : POSITIVE_INFINITY;
        const bYear = (b.year !== undefined && b.year !== null) ? b.year : POSITIVE_INFINITY;
        const yearDiff = aYear - bYear;
        return yearDiff !== 0 ? yearDiff : a.id.localeCompare(b.id);
      };

    case 'year_desc':
      return (a, b) => {
        const aYear = (a.year !== undefined && a.year !== null) ? a.year : NEGATIVE_INFINITY;
        const bYear = (b.year !== undefined && b.year !== null) ? b.year : NEGATIVE_INFINITY;
        const yearDiff = bYear - aYear;
        return yearDiff !== 0 ? yearDiff : a.id.localeCompare(b.id);
      };

    case 'mileage_asc':
      return (a, b) => {
        const aMileage = (a.mileage !== undefined && a.mileage !== null) ? a.mileage : POSITIVE_INFINITY;
        const bMileage = (b.mileage !== undefined && b.mileage !== null) ? b.mileage : POSITIVE_INFINITY;
        const mileageDiff = aMileage - bMileage;
        return mileageDiff !== 0 ? mileageDiff : a.id.localeCompare(b.id);
      };

    case 'mileage_desc':
      return (a, b) => {
        const aMileage = (a.mileage !== undefined && a.mileage !== null) ? a.mileage : NEGATIVE_INFINITY;
        const bMileage = (b.mileage !== undefined && b.mileage !== null) ? b.mileage : NEGATIVE_INFINITY;
        const mileageDiff = bMileage - aMileage;
        return mileageDiff !== 0 ? mileageDiff : a.id.localeCompare(b.id);
      };

    case 'make_asc':
      return (a, b) => {
        const makeDiff = a.make.localeCompare(b.make);
        return makeDiff !== 0 ? makeDiff : a.id.localeCompare(b.id);
      };

    case 'make_desc':
      return (a, b) => {
        const makeDiff = b.make.localeCompare(a.make);
        return makeDiff !== 0 ? makeDiff : a.id.localeCompare(b.id);
      };

    case 'model_asc':
      return (a, b) => {
        const modelDiff = a.model.localeCompare(b.model);
        return modelDiff !== 0 ? modelDiff : a.id.localeCompare(b.id);
      };

    case 'model_desc':
      return (a, b) => {
        const modelDiff = b.model.localeCompare(a.model);
        return modelDiff !== 0 ? modelDiff : a.id.localeCompare(b.id);
      };

    default:
      // Default to price ascending
      return (a, b) => {
        const aPrice = (a.price !== undefined && a.price !== null) ? a.price : POSITIVE_INFINITY;
        const bPrice = (b.price !== undefined && b.price !== null) ? b.price : POSITIVE_INFINITY;
        const priceDiff = aPrice - bPrice;
        return priceDiff !== 0 ? priceDiff : a.id.localeCompare(b.id);
      };
  }
}

/**
 * Validates that car data has proper numeric types
 */
function validateAndNormalizeCar(car: LeanCar): LeanCar {
  return {
    ...car,
    price: (car.price !== undefined && car.price !== null && typeof car.price === 'number') ? car.price : 
           (typeof car.price === 'string' && !isNaN(parseFloat(car.price))) ? parseFloat(car.price) : undefined,
    year: (car.year !== undefined && car.year !== null && typeof car.year === 'number') ? car.year : 
          (typeof car.year === 'string' && !isNaN(parseInt(car.year))) ? parseInt(car.year) : undefined,
    mileage: car.mileage !== undefined && car.mileage !== null
      ? (typeof car.mileage === 'number' ? car.mileage : 
         (typeof car.mileage === 'string' && !isNaN(parseFloat(car.mileage))) ? parseFloat(car.mileage) : undefined)
      : undefined
  };
}

/**
 * Main global sorting function with validation and performance tracking
 */
export function globalSort(items: LeanCar[], sortKey: SortKey): SortedResult {
  const startTime = performance.now();
  
  if (!items || items.length === 0) {
    return {
      items: [],
      total: 0,
      sortKey,
      duration: 0
    };
  }

  console.log(`🔄 Starting global sort: ${sortKey} (${items.length} items)`);

  // Validate and normalize data
  const normalizedItems = items.map(validateAndNormalizeCar);
  
  // Create comparator function
  const comparator = createComparator(sortKey);
  
  // Perform stable sort
  const sortedItems = [...normalizedItems].sort(comparator);
  
  const duration = performance.now() - startTime;
  
  console.log(`✅ Global sort completed: ${sortKey} in ${duration.toFixed(2)}ms`);
  
  return {
    items: sortedItems,
    total: sortedItems.length,
    sortKey,
    duration
  };
}

/**
 * Paginate sorted results
 */
export function paginateSortedResults(
  sortedItems: LeanCar[], 
  page: number, 
  pageSize: number
): PaginatedResult {
  const total = sortedItems.length;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  
  const items = sortedItems.slice(startIndex, endIndex);
  
  return {
    items,
    total,
    totalPages,
    currentPage,
    pageSize,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages
  };
}

/**
 * Check if we should use Web Worker for sorting
 */
export function shouldUseWebWorker(itemCount: number, threshold: number = 50000): boolean {
  return itemCount > threshold;
}

/**
 * Validate sort results for testing
 */
export function validateSortOrder(items: LeanCar[], sortKey: SortKey): boolean {
  if (items.length <= 1) return true;
  
  const comparator = createComparator(sortKey);
  
  for (let i = 1; i < items.length; i++) {
    if (comparator(items[i - 1], items[i]) > 0) {
      console.error(`Sort validation failed at index ${i} for ${sortKey}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Get expected first item for a given sort order (useful for testing)
 */
export function getExpectedFirstItem(items: LeanCar[], sortKey: SortKey): LeanCar | null {
  if (items.length === 0) return null;
  
  const sorted = globalSort(items, sortKey);
  return sorted.items[0] || null;
}

/**
 * Performance profiler for sorting operations
 */
export class SortProfiler {
  private measurements: Array<{
    sortKey: SortKey;
    itemCount: number;
    duration: number;
    timestamp: number;
  }> = [];

  record(sortKey: SortKey, itemCount: number, duration: number): void {
    this.measurements.push({
      sortKey,
      itemCount,
      duration,
      timestamp: Date.now()
    });

    // Keep only last 100 measurements
    if (this.measurements.length > 100) {
      this.measurements = this.measurements.slice(-100);
    }
  }

  getAverageTime(sortKey?: SortKey): number {
    const filtered = sortKey 
      ? this.measurements.filter(m => m.sortKey === sortKey)
      : this.measurements;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  getStats() {
    return {
      totalMeasurements: this.measurements.length,
      averageTime: this.getAverageTime(),
      bySort: Object.fromEntries(
        Array.from(new Set(this.measurements.map(m => m.sortKey)))
          .map(sortKey => [sortKey, this.getAverageTime(sortKey)])
      )
    };
  }

  clear(): void {
    this.measurements = [];
  }
}

// Singleton profiler instance
export const sortProfiler = new SortProfiler();