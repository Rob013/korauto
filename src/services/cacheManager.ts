/**
 * Caching Layer
 * In-memory cache + IndexedDB with TTL support for sorted car data
 */

import { LeanCar } from './aggregateFetch';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface SortedCacheData {
  items: LeanCar[];
  total: number;
  params: any;
  sortKey: string;
}

export interface CacheConfig {
  memoryTTL: number; // TTL for in-memory cache (ms)
  indexedDBTTL: number; // TTL for IndexedDB cache (ms)
  maxMemorySize: number; // Max items in memory cache
  indexedDBName: string;
  indexedDBVersion: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  memoryTTL: 10 * 60 * 1000, // 10 minutes
  indexedDBTTL: 30 * 60 * 1000, // 30 minutes
  maxMemorySize: 50,
  indexedDBName: 'CarSortingCache',
  indexedDBVersion: 1
};

/**
 * Normalizes cache parameters to create consistent keys
 */
export function normalizeParams(filters: any, sort: string): string {
  const normalizedFilters = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return `${normalizedFilters}__${sort}`;
}

/**
 * In-memory LRU Cache
 */
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  constructor(
    private maxSize: number,
    private defaultTTL: number
  ) {}

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.evictExpired();
    
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    this.accessOrder.set(key, ++this.accessCounter);
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder.entries()) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * IndexedDB Cache Manager
 */
class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initialized = false;

  constructor(private config: CacheConfig) {}

  async init(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.indexedDBName, this.config.indexedDBVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async set(key: string, data: any, ttl: number = this.config.indexedDBTTL): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('IndexedDB not available');

    const entry: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key: string): Promise<any | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<any> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }

        if (Date.now() - entry.timestamp > entry.ttl) {
          // Entry expired, delete it
          this.delete(key).finally(() => resolve(null));
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cleanup(): Promise<void> {
    if (!this.db) return;

    const cutoff = Date.now() - this.config.indexedDBTTL;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Unified Cache Manager
 * Combines in-memory and IndexedDB caching with intelligent fallback
 */
export class CacheManager {
  private memoryCache: MemoryCache<SortedCacheData>;
  private indexedDBCache: IndexedDBCache;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new MemoryCache(this.config.maxMemorySize, this.config.memoryTTL);
    this.indexedDBCache = new IndexedDBCache(this.config);
  }

  async init(): Promise<void> {
    try {
      await this.indexedDBCache.init();
      // Cleanup expired entries on startup
      await this.indexedDBCache.cleanup();
    } catch (error) {
      console.warn('IndexedDB initialization failed, using memory-only cache:', error);
    }
  }

  /**
   * Get cached data, checking memory first, then IndexedDB
   */
  async get(filters: any, sort: string): Promise<SortedCacheData | null> {
    const key = normalizeParams(filters, sort);

    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult) {
      console.log('Cache hit (memory):', key);
      return memoryResult;
    }

    // Check IndexedDB
    try {
      const indexedDBResult = await this.indexedDBCache.get(key);
      if (indexedDBResult) {
        console.log('Cache hit (IndexedDB):', key);
        // Promote to memory cache
        this.memoryCache.set(key, indexedDBResult, this.config.memoryTTL);
        return indexedDBResult;
      }
    } catch (error) {
      console.warn('IndexedDB get error:', error);
    }

    console.log('Cache miss:', key);
    return null;
  }

  /**
   * Set cached data in both memory and IndexedDB
   */
  async set(filters: any, sort: string, data: SortedCacheData): Promise<void> {
    const key = normalizeParams(filters, sort);

    // Set in memory cache
    this.memoryCache.set(key, data, this.config.memoryTTL);

    // Set in IndexedDB
    try {
      await this.indexedDBCache.set(key, data, this.config.indexedDBTTL);
      console.log('Cache set:', key);
    } catch (error) {
      console.warn('IndexedDB set error:', error);
    }
  }

  /**
   * Check if data exists in cache
   */
  async has(filters: any, sort: string): Promise<boolean> {
    const key = normalizeParams(filters, sort);

    if (this.memoryCache.has(key)) {
      return true;
    }

    try {
      return await this.indexedDBCache.has(key);
    } catch (error) {
      console.warn('IndexedDB has error:', error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await this.indexedDBCache.clear();
    } catch (error) {
      console.warn('IndexedDB clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      config: this.config
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();