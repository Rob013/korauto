import { useState, useCallback, useRef } from 'react';

interface BatchRequestOptions {
  batchSize?: number;
  delay?: number;
  maxRetries?: number;
}

interface BatchRequest<T> {
  key: string;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  retries: number;
}

/**
 * Utility for batching API requests to improve performance
 */
export class BatchAPIRequestor {
  private queue: BatchRequest<any>[] = [];
  private processing = false;
  private options: Required<BatchRequestOptions>;

  constructor(options: BatchRequestOptions = {}) {
    this.options = {
      batchSize: 5,
      delay: 100,
      maxRetries: 2,
      ...options
    };
  }

  /**
   * Add a request to the batch queue
   */
  async request<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Check if there's already a pending request with the same key
      const existingRequest = this.queue.find(req => req.key === key);
      if (existingRequest) {
        // Piggyback on existing request
        const originalResolve = existingRequest.resolve;
        const originalReject = existingRequest.reject;
        
        existingRequest.resolve = (value) => {
          originalResolve(value);
          resolve(value);
        };
        
        existingRequest.reject = (error) => {
          originalReject(error);
          reject(error);
        };
        return;
      }

      this.queue.push({
        key,
        request: requestFn,
        resolve,
        reject,
        retries: 0
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.options.batchSize);
      
      // Process batch in parallel
      await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const result = await item.request();
            item.resolve(result);
          } catch (error) {
            if (item.retries < this.options.maxRetries) {
              item.retries++;
              this.queue.unshift(item); // Add back to front of queue
            } else {
              item.reject(error);
            }
          }
        })
      );

      // Add delay between batches to prevent overwhelming the server
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.options.delay));
      }
    }

    this.processing = false;
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.forEach(item => {
      item.reject(new Error('Request cancelled'));
    });
    this.queue = [];
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }
}

/**
 * Hook for using batch API requests
 */
export const useBatchAPI = (options?: BatchRequestOptions) => {
  const batchRequestor = useRef(new BatchAPIRequestor(options));
  const [status, setStatus] = useState({ queueLength: 0, processing: false });

  const batchRequest = useCallback(async <T>(
    key: string, 
    requestFn: () => Promise<T>
  ): Promise<T> => {
    const result = await batchRequestor.current.request(key, requestFn);
    setStatus(batchRequestor.current.getStatus());
    return result;
  }, []);

  const clearQueue = useCallback(() => {
    batchRequestor.current.clear();
    setStatus({ queueLength: 0, processing: false });
  }, []);

  return {
    batchRequest,
    clearQueue,
    status
  };
};

/**
 * Specialized hook for car data fetching with intelligent batching
 */
export const useCarDataBatch = () => {
  const { batchRequest, clearQueue, status } = useBatchAPI({
    batchSize: 3, // Smaller batches for car data
    delay: 150,   // Slightly longer delay for complex car data
    maxRetries: 3
  });

  const fetchManufacturers = useCallback(() => {
    return batchRequest('manufacturers', async () => {
      // Your manufacturers API call here
      const response = await fetch('/api/manufacturers');
      return response.json();
    });
  }, [batchRequest]);

  const fetchModels = useCallback((manufacturerId: string) => {
    return batchRequest(`models-${manufacturerId}`, async () => {
      // Your models API call here
      const response = await fetch(`/api/models?manufacturer_id=${manufacturerId}`);
      return response.json();
    });
  }, [batchRequest]);

  const fetchGenerations = useCallback((modelId: string) => {
    return batchRequest(`generations-${modelId}`, async () => {
      // Your generations API call here
      const response = await fetch(`/api/generations?model_id=${modelId}`);
      return response.json();
    });
  }, [batchRequest]);

  const fetchCarDetails = useCallback((carId: string) => {
    return batchRequest(`car-${carId}`, async () => {
      // Your car details API call here
      const response = await fetch(`/api/cars/${carId}`);
      return response.json();
    });
  }, [batchRequest]);

  return {
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchCarDetails,
    clearQueue,
    status
  };
};

export default useBatchAPI;