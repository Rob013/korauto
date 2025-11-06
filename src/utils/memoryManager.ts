/**
 * Memory management utilities for heavy load scenarios
 */

export class MemoryManager {
  private static instance: MemoryManager;
  private readonly MAX_CACHED_IMAGES = 50;
  private readonly MAX_CACHED_DATA = 100;
  private imageCache = new Map<string, string>();
  private dataCache = new Map<string, any>();

  private constructor() {
    this.setupMemoryMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Setup memory monitoring to prevent leaks
   */
  private setupMemoryMonitoring() {
    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usedMemoryMB = memory.usedJSHeapSize / 1048576;
          const totalMemoryMB = memory.totalJSHeapSize / 1048576;
          const percentUsed = (usedMemoryMB / totalMemoryMB) * 100;

          // If memory usage is above 80%, trigger cleanup
          if (percentUsed > 80) {
            console.warn('🧹 High memory usage detected, cleaning up...');
            this.forceCleanup();
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Cache image URL with limit
   */
  cacheImage(key: string, url: string) {
    if (this.imageCache.size >= this.MAX_CACHED_IMAGES) {
      // Remove oldest entry
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
    this.imageCache.set(key, url);
  }

  /**
   * Get cached image URL
   */
  getCachedImage(key: string): string | undefined {
    return this.imageCache.get(key);
  }

  /**
   * Cache data with limit
   */
  cacheData(key: string, data: any) {
    if (this.dataCache.size >= this.MAX_CACHED_DATA) {
      // Remove oldest entry
      const firstKey = this.dataCache.keys().next().value;
      this.dataCache.delete(firstKey);
    }
    this.dataCache.set(key, data);
  }

  /**
   * Get cached data
   */
  getCachedData(key: string): any | undefined {
    return this.dataCache.get(key);
  }

  /**
   * Force cleanup of all caches
   */
  forceCleanup() {
    // Clear half of image cache
    const imagesToRemove = Math.floor(this.imageCache.size / 2);
    const imageKeys = Array.from(this.imageCache.keys());
    for (let i = 0; i < imagesToRemove; i++) {
      this.imageCache.delete(imageKeys[i]);
    }

    // Clear half of data cache
    const dataToRemove = Math.floor(this.dataCache.size / 2);
    const dataKeys = Array.from(this.dataCache.keys());
    for (let i = 0; i < dataToRemove; i++) {
      this.dataCache.delete(dataKeys[i]);
    }

    // Request garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    console.log('🧹 Memory cleanup completed');
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.imageCache.clear();
    this.dataCache.clear();
    console.log('🧹 All caches cleared');
  }

  /**
   * Get memory stats
   */
  getStats() {
    return {
      imageCacheSize: this.imageCache.size,
      dataCacheSize: this.dataCache.size,
      maxImageCache: this.MAX_CACHED_IMAGES,
      maxDataCache: this.MAX_CACHED_DATA,
    };
  }
}

export default MemoryManager.getInstance();
