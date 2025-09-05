/**
 * Aggregate Fetch Service
 * High-performance fetching of ALL results from external APIs with optimizations
 */

import { fetchCarsWithKeyset, CarsApiResponse, CarsApiParams, Car } from './carsApi';
import { LeanCar } from '../types/cars';

export interface AggregateParams extends Omit<CarsApiParams, 'cursor' | 'limit'> {
  pageSize?: number;
}

export interface AggregateResult {
  items: LeanCar[];
  total: number;
  fetchedPages: number;
  duration: number;
}

export interface AggregateProgress {
  loaded: number;
  total: number;
  pages: number;
  estimatedRemaining?: number;
}

export type ProgressCallback = (progress: AggregateProgress) => void;

export class RetryConfig {
  constructor(
    public maxRetries: number = 3,
    public baseDelay: number = 1000,
    public maxDelay: number = 10000,
    public backoffFactor: number = 2
  ) {}

  getDelay(attempt: number): number {
    const delay = this.baseDelay * Math.pow(this.backoffFactor, attempt);
    return Math.min(delay, this.maxDelay);
  }
}

export class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(private limit: number = 4) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try {
          this.running++;
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      if (this.running < this.limit) {
        task();
      } else {
        this.queue.push(task);
      }
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.limit) {
      const task = this.queue.shift();
      if (task) task();
    }
  }
}

// Detect pagination style from first response
function detectPaginationStyle(response: CarsApiResponse): 'cursor' | 'page' {
  return response.nextCursor ? 'cursor' : 'page';
}

// Convert full car object to lean version for list view
function toLeanCar(car: Car): LeanCar {
  return {
    id: car.id,
    price: car.price,
    year: car.year,
    mileage: car.mileage,
    make: car.make,
    model: car.model,
    thumbnail: car.image_url
  };
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  signal?: AbortSignal
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      // Don't retry on non-retryable errors (4xx except 429)
      if (error instanceof Response) {
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }

      if (attempt < config.maxRetries) {
        const delay = config.getDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Fetches ALL results from the API using optimized concurrent requests
 */
export async function aggregateFetch(
  params: AggregateParams,
  options: {
    signal?: AbortSignal;
    onProgress?: ProgressCallback;
    concurrency?: number;
    retryConfig?: RetryConfig;
  } = {}
): Promise<AggregateResult> {
  const startTime = Date.now();
  const {
    signal,
    onProgress,
    concurrency = 4,
    retryConfig = new RetryConfig()
  } = options;

  const pageSize = params.pageSize || 50;
  const limiter = new ConcurrencyLimiter(concurrency);
  const allItems: LeanCar[] = [];
  let totalCount = 0;
  let fetchedPages = 0;
  let hasMore = true;
  let cursor: string | undefined;

  // First request to get total count and pagination style
  const firstParams: CarsApiParams = {
    ...params,
    limit: pageSize
  };

  const firstResponse = await withRetry(
    () => fetchCarsWithKeyset(firstParams),
    retryConfig,
    signal
  );

  if (signal?.aborted) throw new Error('Request aborted');

  const paginationStyle = detectPaginationStyle(firstResponse);
  totalCount = firstResponse.total;
  
  // Add first page items
  allItems.push(...firstResponse.items.map(toLeanCar));
  fetchedPages = 1;
  cursor = firstResponse.nextCursor;
  hasMore = !!cursor;

  onProgress?.({
    loaded: allItems.length,
    total: totalCount,
    pages: fetchedPages,
    estimatedRemaining: Math.max(0, totalCount - allItems.length)
  });

  // If using cursor pagination, fetch remaining pages concurrently in batches
  if (paginationStyle === 'cursor' && hasMore) {
    const promises: Promise<void>[] = [];
    
    // Fetch pages in smaller concurrent batches to avoid overwhelming the API
    while (hasMore && !signal?.aborted) {
      const batchPromises: Promise<void>[] = [];
      
      for (let i = 0; i < concurrency && hasMore && !signal?.aborted; i++) {
        if (!cursor) break;
        
        const currentCursor = cursor;
        const promise = limiter.execute(async (): Promise<CarsApiResponse | undefined> => {
          const response = await withRetry(
            () => fetchCarsWithKeyset({
              ...params,
              limit: pageSize,
              cursor: currentCursor
            }),
            retryConfig,
            signal
          );

          if (signal?.aborted) return undefined;

          const leanItems = response.items.map(toLeanCar);
          allItems.push(...leanItems);
          fetchedPages++;

          onProgress?.({
            loaded: allItems.length,
            total: totalCount,
            pages: fetchedPages,
            estimatedRemaining: Math.max(0, totalCount - allItems.length)
          });

          return response;
        });

        batchPromises.push(promise as any);
        
        try {
          const response = await promise;
          if (response) {
            cursor = response.nextCursor;
            hasMore = !!cursor;
          } else {
            hasMore = false;
            break;
          }
        } catch (error) {
          hasMore = false;
          break;
        }
      }

      await Promise.allSettled(batchPromises);
    }
  }

  if (signal?.aborted) throw new Error('Request aborted');

  const duration = Date.now() - startTime;

  return {
    items: allItems,
    total: totalCount,
    fetchedPages,
    duration
  };
}

/**
 * Estimates fetch time based on total count and previous fetch performance
 */
export function estimateFetchTime(
  totalCount: number,
  pageSize: number = 50,
  avgPageTime: number = 200
): number {
  const totalPages = Math.ceil(totalCount / pageSize);
  return totalPages * avgPageTime;
}

/**
 * Checks if aggregate fetch is recommended based on dataset size
 */
export function shouldUseAggregateFetch(
  totalCount: number,
  threshold: number = 100
): boolean {
  return totalCount <= threshold * 500; // Don't aggregate if > 50k items by default
}