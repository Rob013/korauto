/**
 * External API Guard - Blocks external API calls when READ_SOURCE=db
 * 
 * This guard ensures fail-fast behavior when the application is configured
 * to read only from the database and prevents accidental external API calls.
 */

// List of external API hosts that should be blocked when READ_SOURCE=db
const EXTERNAL_API_HOSTS = [
  'encar.com',
  'api.encar.com',
  'www.encar.com',
  'auction.co.kr',
  'api.auction.co.kr',
  'www.auction.co.kr',
  'autoauction.co.kr',
  'api.autoauction.co.kr',
  // Add other external API hosts as needed
];

/**
 * Checks if READ_SOURCE is set to 'db' mode
 */
export function isDbOnlyMode(): boolean {
  // Check both client and server environment
  const readSource = 
    (typeof process !== 'undefined' && process.env?.READ_SOURCE) || 
    (typeof globalThis !== 'undefined' && 
     globalThis.importMeta?.env?.VITE_READ_SOURCE) ||
    (typeof import.meta !== 'undefined' && 
     import.meta.env?.VITE_READ_SOURCE) ||
    'db'; // Default to db mode
  
  return readSource === 'db';
}

/**
 * Checks if a URL is an external API call that should be blocked
 */
export function isExternalApiCall(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return EXTERNAL_API_HOSTS.some(host => 
      hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    // If URL parsing fails, assume it's not an external API call
    return false;
  }
}

/**
 * Guards against external API calls when READ_SOURCE=db
 * Throws an error with a clear message if an external API call is attempted
 */
export function guardExternalApiCall(url: string, context?: string): void {
  if (isDbOnlyMode() && isExternalApiCall(url)) {
    const message = [
      '🚫 External API call blocked: READ_SOURCE=db mode is enabled',
      `Attempted URL: ${url}`,
      context ? `Context: ${context}` : '',
      'This application is configured to read ONLY from the database.',
      'To allow external API calls, set READ_SOURCE=api in environment variables.'
    ].filter(Boolean).join('\n');
    
    throw new Error(message);
  }
}

/**
 * Wrapper for fetch that includes external API guard
 */
export function guardedFetch(url: string, options?: RequestInit, context?: string): Promise<Response> {
  guardExternalApiCall(url, context);
  return fetch(url, options);
}

/**
 * Express/Deno middleware to block external API calls at the network level
 */
export function createExternalApiBlockMiddleware() {
  return (req: Request, res?: any, next?: any) => {
    if (isDbOnlyMode()) {
      const url = req.url;
      if (isExternalApiCall(url)) {
        const error = new Error(
          `🚫 External API call blocked by middleware: ${url}. READ_SOURCE=db mode is enabled.`
        );
        
        if (res && typeof res.status === 'function') {
          // Express-style response
          return res.status(403).json({
            error: 'External API calls blocked',
            message: error.message,
            readSource: 'db'
          });
        } else {
          // Deno/other environments
          throw error;
        }
      }
    }
    
    if (next) next();
  };
}

/**
 * Logs when external API guard blocks a request
 */
export function logExternalApiBlocked(url: string, context?: string): void {
  console.warn('🚫 External API call blocked:', {
    url,
    context,
    readSource: 'db',
    message: 'READ_SOURCE=db mode blocks external API calls'
  });
}