/**
 * Cookie Management Utility
 * 
 * Provides secure cookie management with size limits and validation.
 * Requirements:
 * - Each cookie must be <1KB
 * - Total cookies must be <4KB per request
 * - Store only session ID and basic preferences
 * - HttpOnly and Secure flags on sensitive cookies
 */

export interface CookieOptions {
  /** Expiration time in seconds */
  maxAge?: number;
  /** Expiration date */
  expires?: Date;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Secure flag (HTTPS only) */
  secure?: boolean;
  /** HttpOnly flag (server-only access) */
  httpOnly?: boolean;
  /** SameSite attribute */
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface CookieValidationResult {
  isValid: boolean;
  errors: string[];
  size: number;
}

export interface CookieStats {
  totalSize: number;
  cookieCount: number;
  largestCookie: { name: string; size: number };
  cookies: Array<{ name: string; size: number; value: string }>;
}

export class CookieManager {
  private static readonly MAX_COOKIE_SIZE = 1024; // 1KB
  private static readonly MAX_TOTAL_SIZE = 4096; // 4KB
  private static readonly SESSION_COOKIE_NAME = 'session_id';
  private static readonly PREFERENCES_COOKIE_NAME = 'user_preferences';

  /**
   * Validates a cookie value and options
   */
  private static validateCookie(name: string, value: string, options?: CookieOptions): CookieValidationResult {
    const errors: string[] = [];
    
    // Calculate cookie size (name=value + options overhead)
    const cookieString = this.buildCookieString(name, value, options);
    const size = new Blob([cookieString]).size;
    
    if (size > this.MAX_COOKIE_SIZE) {
      errors.push(`Cookie "${name}" exceeds maximum size of ${this.MAX_COOKIE_SIZE} bytes (current: ${size} bytes)`);
    }
    
    if (!name || name.trim().length === 0) {
      errors.push('Cookie name cannot be empty');
    }
    
    if (name.includes('=') || name.includes(';') || name.includes(',')) {
      errors.push('Cookie name contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      size
    };
  }

  /**
   * Builds a cookie string with all options
   */
  private static buildCookieString(name: string, value: string, options?: CookieOptions): string {
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (options?.path) cookieString += `; path=${options.path}`;
    if (options?.domain) cookieString += `; domain=${options.domain}`;
    if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
    if (options?.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
    if (options?.secure) cookieString += '; secure';
    if (options?.httpOnly) cookieString += '; httponly';
    if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
    
    return cookieString;
  }

  /**
   * Gets current cookie statistics
   */
  static getCookieStats(): CookieStats {
    const cookies = document.cookie.split(';')
      .filter(cookie => cookie.trim().length > 0)
      .map(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        const value = valueParts.join('=');
        const size = new Blob([cookie.trim()]).size;
        return { name: name.trim(), size, value: value || '' };
      });

    const totalSize = cookies.reduce((sum, cookie) => sum + cookie.size, 0);
    const largestCookie = cookies.reduce((largest, cookie) => 
      cookie.size > largest.size ? cookie : largest, 
      { name: '', size: 0 }
    );

    return {
      totalSize,
      cookieCount: cookies.length,
      largestCookie,
      cookies
    };
  }

  /**
   * Checks if adding a new cookie would exceed total size limit
   */
  private static checkTotalSizeLimit(newCookieSize: number, excludeCookieName?: string): boolean {
    const stats = this.getCookieStats();
    let currentSize = stats.totalSize;
    
    // If we're updating an existing cookie, subtract its current size
    if (excludeCookieName) {
      const existingCookie = stats.cookies.find(c => c.name === excludeCookieName);
      if (existingCookie) {
        currentSize -= existingCookie.size;
      }
    }
    
    return (currentSize + newCookieSize) <= this.MAX_TOTAL_SIZE;
  }

  /**
   * Sets a cookie with validation and size checking
   */
  static setCookie(name: string, value: string, options?: CookieOptions): boolean {
    try {
      // Validate the cookie
      const validation = this.validateCookie(name, value, options);
      
      if (!validation.isValid) {
        console.error('Cookie validation failed:', validation.errors);
        return false;
      }

      // Check total size limit
      if (!this.checkTotalSizeLimit(validation.size, name)) {
        const stats = this.getCookieStats();
        console.error(`Setting cookie "${name}" would exceed total size limit. Current: ${stats.totalSize} bytes, Max: ${this.MAX_TOTAL_SIZE} bytes`);
        return false;
      }

      // Build and set the cookie
      const cookieString = this.buildCookieString(name, value, options);
      document.cookie = cookieString;
      
      console.log(`Cookie "${name}" set successfully (${validation.size} bytes)`);
      return true;
    } catch (error) {
      console.error('Error setting cookie:', error);
      return false;
    }
  }

  /**
   * Gets a cookie value
   */
  static getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [cookieName, ...valueParts] = cookie.trim().split('=');
      if (cookieName === name) {
        return valueParts.join('=') ? decodeURIComponent(valueParts.join('=')) : '';
      }
    }
    
    return null;
  }

  /**
   * Deletes a cookie
   */
  static deleteCookie(name: string, path?: string, domain?: string): void {
    const options: CookieOptions = {
      expires: new Date(0),
      path: path || '/',
      domain
    };
    
    document.cookie = this.buildCookieString(name, '', options);
  }

  /**
   * Sets a secure session ID cookie
   */
  static setSessionId(sessionId: string): boolean {
    return this.setCookie(this.SESSION_COOKIE_NAME, sessionId, {
      httpOnly: false, // Note: client-side can't set httpOnly, this would need server-side implementation
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });
  }

  /**
   * Gets the current session ID
   */
  static getSessionId(): string | null {
    return this.getCookie(this.SESSION_COOKIE_NAME);
  }

  /**
   * Clears the session ID
   */
  static clearSession(): void {
    this.deleteCookie(this.SESSION_COOKIE_NAME);
  }

  /**
   * Sets user preferences as a JSON cookie
   */
  static setPreferences(preferences: Record<string, any>): boolean {
    try {
      const jsonString = JSON.stringify(preferences);
      return this.setCookie(this.PREFERENCES_COOKIE_NAME, jsonString, {
        secure: window.location.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    } catch (error) {
      console.error('Error setting preferences:', error);
      return false;
    }
  }

  /**
   * Gets user preferences from cookie
   */
  static getPreferences<T = Record<string, any>>(): T | null {
    try {
      const preferencesString = this.getCookie(this.PREFERENCES_COOKIE_NAME);
      if (!preferencesString) return null;
      
      return JSON.parse(preferencesString) as T;
    } catch (error) {
      console.error('Error parsing preferences:', error);
      return null;
    }
  }

  /**
   * Updates specific preference values
   */
  static updatePreferences(updates: Record<string, any>): boolean {
    const currentPreferences = this.getPreferences() || {};
    const newPreferences = { ...currentPreferences, ...updates };
    return this.setPreferences(newPreferences);
  }

  /**
   * Clears all application cookies
   */
  static clearAllCookies(): void {
    const stats = this.getCookieStats();
    stats.cookies.forEach(cookie => {
      this.deleteCookie(cookie.name);
    });
  }

  /**
   * Monitors cookie usage and logs warnings
   */
  static monitorUsage(): CookieStats {
    const stats = this.getCookieStats();
    
    // Log warnings for size limits
    if (stats.totalSize > this.MAX_TOTAL_SIZE * 0.8) {
      console.warn(`Cookie storage approaching limit: ${stats.totalSize}/${this.MAX_TOTAL_SIZE} bytes (${Math.round(stats.totalSize / this.MAX_TOTAL_SIZE * 100)}%)`);
    }
    
    stats.cookies.forEach(cookie => {
      if (cookie.size > this.MAX_COOKIE_SIZE * 0.8) {
        console.warn(`Cookie "${cookie.name}" approaching size limit: ${cookie.size}/${this.MAX_COOKIE_SIZE} bytes`);
      }
    });
    
    return stats;
  }

  /**
   * Optimizes cookies by removing expired or unnecessary ones
   */
  static optimizeCookies(): void {
    const stats = this.getCookieStats();
    
    // If we're approaching the limit, log suggestions
    if (stats.totalSize > this.MAX_TOTAL_SIZE * 0.9) {
      console.warn('Cookie storage near capacity. Consider removing unnecessary cookies.');
      
      // Log largest cookies for manual review
      const sortedCookies = stats.cookies.sort((a, b) => b.size - a.size);
      console.log('Largest cookies:', sortedCookies.slice(0, 3));
    }
  }
}

// Export convenience functions
export const {
  setCookie,
  getCookie,
  deleteCookie,
  setSessionId,
  getSessionId,
  clearSession,
  setPreferences,
  getPreferences,
  updatePreferences,
  clearAllCookies,
  getCookieStats,
  monitorUsage,
  optimizeCookies
} = CookieManager;