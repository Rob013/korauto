import { isDbOnlyMode } from '@/config/featureFlags';

// List of external API hosts that should be blocked in DB-only mode
const EXTERNAL_API_HOSTS = [
  'auctionsapi.com',
  'api.auctionsapi.com',
  'auctions-api.com',
  'external-api.example.com',
  'secure-cars-api-external', // Special marker for secure-cars-api that calls external APIs
  // Add other external API hosts here
];

// External API guard class
export class ExternalApiGuard {
  /**
   * Blocks external API calls when READ_SOURCE=db
   * Throws error with clear message for fail-fast behavior
   */
  static checkExternalApiCall(url: string, context?: string): void {
    if (!isDbOnlyMode()) {
      return; // External API calls are allowed
    }

    // Check if URL contains any external API hosts
    const containsExternalHost = EXTERNAL_API_HOSTS.some(host => 
      url.includes(host)
    );

    if (containsExternalHost) {
      const errorMessage = `🚫 External API call blocked in DB-only mode (READ_SOURCE=db): ${url}${context ? ` [Context: ${context}]` : ''}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Wrapper for fetch that enforces the external API guard
   */
  static async guardedFetch(url: string, init?: RequestInit, context?: string): Promise<Response> {
    ExternalApiGuard.checkExternalApiCall(url, context);
    return fetch(url, init);
  }

  /**
   * Check if a URL is an external API call
   */
  static isExternalApiUrl(url: string): boolean {
    return EXTERNAL_API_HOSTS.some(host => url.includes(host));
  }

  /**
   * Middleware function for intercepting external API calls
   */
  static createFetchInterceptor() {
    if (!isDbOnlyMode()) {
      return; // No interception needed in external mode
    }

    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch to check external API calls
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      ExternalApiGuard.checkExternalApiCall(url, 'Intercepted fetch call');
      
      return originalFetch.call(this, input, init);
    };

    console.log('🛡️ External API guard activated - blocking external API calls in DB-only mode');
  }

  /**
   * Production middleware guard for Next.js/Express-style middleware
   */
  static productionGuard() {
    if (typeof window !== 'undefined' && isDbOnlyMode()) {
      // Client-side guard
      ExternalApiGuard.createFetchInterceptor();
    }
  }
}

// Auto-initialize guard in production
if (typeof window !== 'undefined') {
  ExternalApiGuard.productionGuard();
}