/**
 * Cache Manager - Handles cache invalidation and updates
 */

const APP_VERSION_KEY = 'korauto-app-version';
const FALLBACK_VERSION = '2025.06.02.003';
const PRESERVED_LOCALSTORAGE_KEYS = new Set([
  APP_VERSION_KEY,
  'korauto-ui-theme',
  'rememberMe',
]);

let resolvedVersion: string | null = null;

const resolveCurrentVersion = (): string => {
  if (resolvedVersion) {
    return resolvedVersion;
  }

  let version = FALLBACK_VERSION;

  try {
    const envVersion =
      (import.meta.env as Record<string, string | undefined>)?.VITE_APP_VERSION;
    if (envVersion && envVersion.trim().length > 0) {
      version = envVersion.trim();
    } else if (typeof window !== 'undefined') {
      const globalVersion = (window as unknown as {
        __APP_VERSION__?: string;
      }).__APP_VERSION__;
      if (globalVersion && globalVersion.trim().length > 0) {
        version = globalVersion.trim();
      } else if (typeof document !== 'undefined') {
        const metaVersion = document
          .querySelector('meta[name="app-version"]')
          ?.getAttribute('content');
        if (metaVersion && metaVersion.trim().length > 0) {
          version = metaVersion.trim();
        }
      }
    }
  } catch {
    // Use fallback version when environment lookup fails
  }

  resolvedVersion = version;
  return version;
};

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const safeGetItem = (storage: Storage | null, key: string): string | null => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (storage: Storage | null, key: string, value: string) => {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore write errors (private browsing, quota exceeded, etc.)
  }
};

const safeRemoveItem = (storage: Storage | null, key: string) => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore removal errors
  }
};

const shouldClearLocalKey = (key: string): boolean => {
  if (PRESERVED_LOCALSTORAGE_KEYS.has(key)) {
    return false;
  }
  return (
    key.startsWith('korauto-') ||
    key.startsWith('supabase.') ||
    key.startsWith('cache-')
  );
};

export const cacheManager = {
  refreshIntervalId: null as ReturnType<typeof setInterval> | null,

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return resolveCurrentVersion();
  },

  /**
   * Get stored app version
   */
  getStoredVersion(): string | null {
    const storage = getLocalStorage();
    return safeGetItem(storage, APP_VERSION_KEY);
  },

  /**
   * Update stored version
   */
  updateVersion(): void {
    const storage = getLocalStorage();
    const version = this.getCurrentVersion();
    if (version) {
      safeSetItem(storage, APP_VERSION_KEY, version);
    }
  },

  /**
   * Check if app version has changed
   */
  hasVersionChanged(): boolean {
    const storedVersion = this.getStoredVersion();
    const currentVersion = this.getCurrentVersion();

    if (!storedVersion) {
      return false;
    }

    return storedVersion !== currentVersion;
  },

  /**
   * Clear all caches (localStorage, sessionStorage, and service worker caches)
   */
  async clearAllCaches(): Promise<void> {
    try {
      const localStorageRef = getLocalStorage();
      const sessionStorageRef = getSessionStorage();

      const preservedEntries = new Map<string, string>();

      if (localStorageRef) {
        PRESERVED_LOCALSTORAGE_KEYS.forEach((key) => {
          const value = safeGetItem(localStorageRef, key);
          if (value !== null) {
            preservedEntries.set(key, value);
          }
        });

        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorageRef.length; i += 1) {
          const key = localStorageRef.key(i);
          if (!key) continue;
          if (shouldClearLocalKey(key)) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => safeRemoveItem(localStorageRef, key));

        preservedEntries.forEach((value, key) => {
          safeSetItem(localStorageRef, key, value);
        });
      }

      if (sessionStorageRef) {
        const sessionKeys: string[] = [];
        for (let i = 0; i < sessionStorageRef.length; i += 1) {
          const key = sessionStorageRef.key(i);
          if (!key) continue;
          if (key.startsWith('korauto-')) {
            sessionKeys.push(key);
          }
        }
        sessionKeys.forEach((key) => safeRemoveItem(sessionStorageRef, key));
      }

      if (typeof caches !== 'undefined') {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      console.log('✅ CacheManager cleared stale caches');
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  },

  /**
   * Force reload the application
   */
  forceReload(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },

  /**
   * Clear specific cache keys
   */
  clearSpecificCache(keys: string[]): void {
    const localStorageRef = getLocalStorage();
    const sessionStorageRef = getSessionStorage();

    keys.forEach((key) => {
      safeRemoveItem(localStorageRef, key);
      safeRemoveItem(sessionStorageRef, key);
    });
  },

  /**
   * Update service worker without forcing uninstall/reinstall
   */
  async updateServiceWorker(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (!registrations.length) {
        await navigator.serviceWorker.register('/sw.js');
        return;
      }

      await Promise.all(
        registrations.map(async (registration) => {
          try {
            await registration.update();
            if (registration.waiting) {
              registration.waiting.postMessage?.({ type: 'SKIP_WAITING' });
            }
          } catch (registrationError) {
            console.warn('Service worker update failed:', registrationError);
          }
        }),
      );
    } catch (error) {
      console.error('❌ Error updating service worker:', error);
    }
  },

  /**
   * Initialize cache manager - check version and clear if needed
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.hasVersionChanged()) {
        console.log('🔄 App version changed, refreshing cached data');
        await this.clearAllCaches();
        await this.updateServiceWorker();
        this.updateVersion();
        return true;
      }

      if (!this.getStoredVersion()) {
        this.updateVersion();
      }
    } catch (error) {
      console.error('❌ CacheManager initialization failed:', error);
    }

    return false;
  },

  /**
   * Periodic cache refresh (call this on app mount)
   */
  setupPeriodicRefresh(intervalMinutes: number = 30): void {
    if (typeof window === 'undefined') return;

    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    if (this.refreshIntervalId) {
      window.clearInterval(this.refreshIntervalId);
    }

    this.refreshIntervalId = window.setInterval(async () => {
      try {
        await this.initialize();
      } catch (error) {
        console.error('❌ Periodic cache refresh failed:', error);
      }
    }, intervalMs);
  },
};

export default cacheManager;
