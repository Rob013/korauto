/**
 * Web Worker for large dataset sorting
 * Keeps UI thread responsive for datasets > 50k items
 */

import { globalSort } from '../services/globalSort';
import type { LeanCar, SortKey, SortedResult } from '../types/cars';

export interface WorkerMessage {
  type: 'sort' | 'terminate';
  payload?: {
    items: LeanCar[];
    sortKey: SortKey;
    requestId: string;
  };
}

export interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  payload?: SortedResult | { error: string } | { progress: number };
  requestId?: string;
}

// Web Worker code as string (will be used to create worker)
const workerCode = `
// Import sorting logic (inline since we can't import modules in worker)
const POSITIVE_INFINITY = Number.MAX_SAFE_INTEGER;
const NEGATIVE_INFINITY = Number.MIN_SAFE_INTEGER;

function createComparator(sortKey) {
  switch (sortKey) {
    case 'price_asc':
      return (a, b) => {
        const aPrice = a.price ?? POSITIVE_INFINITY;
        const bPrice = b.price ?? POSITIVE_INFINITY;
        const priceDiff = aPrice - bPrice;
        return priceDiff !== 0 ? priceDiff : a.id.localeCompare(b.id);
      };

    case 'price_desc':
      return (a, b) => {
        const aPrice = a.price ?? NEGATIVE_INFINITY;
        const bPrice = b.price ?? NEGATIVE_INFINITY;
        const priceDiff = bPrice - aPrice;
        return priceDiff !== 0 ? priceDiff : a.id.localeCompare(b.id);
      };

    case 'year_asc':
      return (a, b) => {
        const aYear = a.year ?? POSITIVE_INFINITY;
        const bYear = b.year ?? POSITIVE_INFINITY;
        const yearDiff = aYear - bYear;
        return yearDiff !== 0 ? yearDiff : a.id.localeCompare(b.id);
      };

    case 'year_desc':
      return (a, b) => {
        const aYear = a.year ?? NEGATIVE_INFINITY;
        const bYear = b.year ?? NEGATIVE_INFINITY;
        const yearDiff = bYear - aYear;
        return yearDiff !== 0 ? yearDiff : a.id.localeCompare(b.id);
      };

    case 'mileage_asc':
      return (a, b) => {
        const aMileage = a.mileage ?? POSITIVE_INFINITY;
        const bMileage = b.mileage ?? POSITIVE_INFINITY;
        const mileageDiff = aMileage - bMileage;
        return mileageDiff !== 0 ? mileageDiff : a.id.localeCompare(b.id);
      };

    case 'mileage_desc':
      return (a, b) => {
        const aMileage = a.mileage ?? NEGATIVE_INFINITY;
        const bMileage = b.mileage ?? NEGATIVE_INFINITY;
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
      return (a, b) => {
        const aPrice = a.price ?? POSITIVE_INFINITY;
        const bPrice = b.price ?? POSITIVE_INFINITY;
        const priceDiff = aPrice - bPrice;
        return priceDiff !== 0 ? priceDiff : a.id.localeCompare(b.id);
      };
  }
}

function validateAndNormalizeCar(car) {
  return {
    ...car,
    price: typeof car.price === 'number' ? car.price : parseFloat(car.price) || 0,
    year: typeof car.year === 'number' ? car.year : parseInt(car.year) || 0,
    mileage: car.mileage !== undefined 
      ? (typeof car.mileage === 'number' ? car.mileage : parseFloat(car.mileage) || 0)
      : undefined
  };
}

function globalSortInWorker(items, sortKey) {
  const startTime = performance.now();
  
  if (!items || items.length === 0) {
    return {
      items: [],
      total: 0,
      sortKey,
      duration: 0
    };
  }

  const normalizedItems = items.map(validateAndNormalizeCar);
  const comparator = createComparator(sortKey);
  
  // For very large datasets, use chunked sorting with progress updates
  const CHUNK_SIZE = 10000;
  if (normalizedItems.length > CHUNK_SIZE) {
    const chunks = [];
    for (let i = 0; i < normalizedItems.length; i += CHUNK_SIZE) {
      chunks.push(normalizedItems.slice(i, i + CHUNK_SIZE));
    }
    
    // Sort each chunk
    const sortedChunks = chunks.map((chunk, index) => {
      const sorted = [...chunk].sort(comparator);
      // Send progress update
      self.postMessage({
        type: 'progress',
        payload: { progress: ((index + 1) / chunks.length) * 0.8 } // 80% for chunk sorting
      });
      return sorted;
    });
    
    // Merge sorted chunks
    let result = sortedChunks[0] || [];
    for (let i = 1; i < sortedChunks.length; i++) {
      const newResult = [];
      let left = 0, right = 0;
      
      while (left < result.length && right < sortedChunks[i].length) {
        if (comparator(result[left], sortedChunks[i][right]) <= 0) {
          newResult.push(result[left++]);
        } else {
          newResult.push(sortedChunks[i][right++]);
        }
      }
      
      while (left < result.length) newResult.push(result[left++]);
      while (right < sortedChunks[i].length) newResult.push(sortedChunks[i][right++]);
      
      result = newResult;
      
      // Send progress update for merging
      self.postMessage({
        type: 'progress',
        payload: { progress: 0.8 + ((i / sortedChunks.length) * 0.2) } // 20% for merging
      });
    }
    
    const duration = performance.now() - startTime;
    return {
      items: result,
      total: result.length,
      sortKey,
      duration
    };
  } else {
    // For smaller datasets, sort normally
    const sortedItems = [...normalizedItems].sort(comparator);
    const duration = performance.now() - startTime;
    
    return {
      items: sortedItems,
      total: sortedItems.length,
      sortKey,
      duration
    };
  }
}

self.onmessage = function(event) {
  const { type, payload } = event.data;
  
  if (type === 'sort') {
    try {
      const { items, sortKey, requestId } = payload;
      const result = globalSortInWorker(items, sortKey);
      
      self.postMessage({
        type: 'success',
        payload: result,
        requestId
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        payload: { error: error.message },
        requestId: payload?.requestId
      });
    }
  } else if (type === 'terminate') {
    self.close();
  }
};
`;

/**
 * Web Worker Manager for large dataset sorting
 */
export class SortWorkerManager {
  private worker: Worker | null = null;
  private activeRequests = new Map<string, {
    resolve: (value: SortedResult) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: number) => void;
  }>();

  constructor() {
    this.createWorker();
  }

  private createWorker(): void {
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload, requestId } = event.data;
        
        if (!requestId) return;
        
        const request = this.activeRequests.get(requestId);
        if (!request) return;
        
        switch (type) {
          case 'success':
            request.resolve(payload as SortedResult);
            this.activeRequests.delete(requestId);
            break;
            
          case 'error':
            request.reject(new Error((payload as { error: string }).error));
            this.activeRequests.delete(requestId);
            break;
            
          case 'progress':
            if (request.onProgress) {
              request.onProgress((payload as { progress: number }).progress);
            }
            break;
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.activeRequests.forEach(({ reject }) => {
          reject(new Error('Worker error'));
        });
        this.activeRequests.clear();
      };
      
      // Clean up blob URL
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.error('Failed to create sort worker:', error);
    }
  }

  /**
   * Sort items using Web Worker
   */
  async sortWithWorker(
    items: LeanCar[], 
    sortKey: SortKey,
    onProgress?: (progress: number) => void
  ): Promise<SortedResult> {
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    const requestId = `sort_${Date.now()}_${Math.random()}`;
    
    return new Promise<SortedResult>((resolve, reject) => {
      this.activeRequests.set(requestId, { resolve, reject, onProgress });
      
      const message: WorkerMessage = {
        type: 'sort',
        payload: { items, sortKey, requestId }
      };
      
      this.worker!.postMessage(message);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.activeRequests.has(requestId)) {
          this.activeRequests.delete(requestId);
          reject(new Error('Sort operation timed out'));
        }
      }, 30000);
    });
  }

  /**
   * Check if worker is available
   */
  isWorkerAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'terminate' });
      this.worker.terminate();
      this.worker = null;
    }
    
    this.activeRequests.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.activeRequests.clear();
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }
}

// Singleton instance
export const sortWorkerManager = new SortWorkerManager();

/**
 * High-level function to sort with automatic worker selection
 */
export async function sortWithOptimalMethod(
  items: LeanCar[],
  sortKey: SortKey,
  onProgress?: (progress: number) => void
): Promise<SortedResult> {
  const useWorker = items.length > 50000 && sortWorkerManager.isWorkerAvailable();
  
  if (useWorker) {
    console.log(`🔄 Using Web Worker for large dataset sort: ${items.length} items`);
    return sortWorkerManager.sortWithWorker(items, sortKey, onProgress);
  } else {
    console.log(`🔄 Using main thread for sort: ${items.length} items`);
    return globalSort(items, sortKey);
  }
}