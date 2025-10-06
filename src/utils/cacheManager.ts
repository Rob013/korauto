/**
 * Cache Manager - Handles cache invalidation and updates
 */

const APP_VERSION_KEY = 'korauto-app-version';
const CURRENT_VERSION = Date.now().toString(); // Use timestamp as version

export const cacheManager = {
  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return CURRENT_VERSION;
  },

  /**
   * Get stored app version
   */
  getStoredVersion(): string | null {
    return localStorage.getItem(APP_VERSION_KEY);
  },

  /**
   * Update stored version
   */
  updateVersion(): void {
    localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
  },

  /**
   * Check if app version has changed
   */
  hasVersionChanged(): boolean {
    const storedVersion = this.getStoredVersion();
    return storedVersion !== null && storedVersion !== CURRENT_VERSION;
  },

  /**
   * Clear all caches (localStorage, sessionStorage, and service worker caches)
   */
  async clearAllCaches(): Promise<void> {
    try {
      // Clear localStorage (keep theme and essential settings)
      const theme = localStorage.getItem('korauto-ui-theme');
      const rememberMe = localStorage.getItem('rememberMe');
      
      localStorage.clear();
      
      // Restore essential settings
      if (theme) localStorage.setItem('korauto-ui-theme', theme);
      if (rememberMe) localStorage.setItem('rememberMe', rememberMe);
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      console.log('✅ All caches cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  },

  /**
   * Force reload the application
   */
  forceReload(): void {
    window.location.reload();
  },

  /**
   * Clear specific cache keys
   */
  clearSpecificCache(keys: string[]): void {
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },

  /**
   * Update service worker and clear caches
   */
  async updateServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          // Unregister old service workers
          await registration.unregister();
        }

        // Clear all caches
        await this.clearAllCaches();

        // Register new service worker
        await navigator.serviceWorker.register('/sw.js');
        
        console.log('✅ Service worker updated successfully');
      } catch (error) {
        console.error('❌ Error updating service worker:', error);
      }
    }
  },

  /**
   * Initialize cache manager - check version and clear if needed
   */
  async initialize(): Promise<boolean> {
    const hasChanged = this.hasVersionChanged();
    
    if (hasChanged) {
      console.log('🔄 App version changed, clearing caches...');
      await this.clearAllCaches();
      await this.updateServiceWorker();
      this.updateVersion();
      return true; // Cache was cleared
    }
    
    // Update version if this is first visit
    if (!this.getStoredVersion()) {
      this.updateVersion();
    }
    
    return false; // Cache not cleared
  },

  /**
   * Periodic cache refresh (call this on app mount)
   */
  setupPeriodicRefresh(intervalMinutes: number = 30): void {
    setInterval(async () => {
      console.log('🔄 Performing periodic cache check...');
      await this.initialize();
    }, intervalMinutes * 60 * 1000);
  }
};

export default cacheManager;
