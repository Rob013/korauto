// Service Worker for caching API responses and static assets with 120fps performance optimization
// CRITICAL: Update this version number to force cache refresh for all users
const VERSION = '2025.06.02.001'; // YYYY.MM.DD.BUILD format - Updated for stability fixes
const CACHE_NAME = `korauto-v${VERSION}`;
const STATIC_CACHE_NAME = `korauto-static-v${VERSION}`;
const ASSETS_CACHE_NAME = `korauto-assets-v${VERSION}`;
const HIGH_PERFORMANCE_CACHE = `korauto-high-perf-v${VERSION}`;

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// High-priority assets for 120fps performance
const HIGH_PERFORMANCE_ASSETS = [
  // Critical JS chunks for frame rate optimization
  '/assets/frameRateOptimizer-*.js',
  '/assets/vendor-*.js',
  '/assets/index-*.js',
  // Critical CSS for layout stability
  '/assets/index-*.css'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/manufacturers/,
  /\/api\/models/,
  /\/api\/generations/,
  /\/api\/cars\?/
];

// Cache duration in milliseconds (shorter for fresher content)
const CACHE_DURATION = {
  API: 2 * 60 * 1000, // 2 minutes for API responses (reduced for fresher data)
  STATIC: 12 * 60 * 60 * 1000, // 12 hours for static assets
  IMAGES: 30 * 60 * 1000, // 30 minutes for images
  ASSETS: 24 * 60 * 60 * 1000, // 24 hours for versioned assets (JS/CSS)
  FONTS: 7 * 24 * 60 * 60 * 1000, // 7 days for fonts
  HIGH_PERFORMANCE: 30 * 60 * 1000 // 30 minutes for performance-critical assets
};

// Install event - cache static assets and prioritize performance-critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => cache.addAll(STATIC_ASSETS)),
      
      // Preload high-performance assets for 120fps optimization
      caches.open(HIGH_PERFORMANCE_CACHE)
        .then((cache) => {
          // Preload critical assets for frame rate optimization
          return Promise.all(
            HIGH_PERFORMANCE_ASSETS.map(async (asset) => {
              try {
                const response = await fetch(asset);
                if (response.ok) {
                  return cache.put(asset, response);
                }
              } catch (error) {
                // Silently fail for asset preloading
                console.log('Failed to preload asset:', asset);
              }
            })
          );
        })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and notify clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete ALL old caches to force fresh content
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== ASSETS_CACHE_NAME && 
                cacheName !== HIGH_PERFORMANCE_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
    .then(() => {
      // Notify all clients about the update safely
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          try {
            client.postMessage({
              type: 'CACHE_UPDATED',
              version: VERSION
            });
          } catch (e) {
            // Ignore errors when posting to clients
            console.log('Could not post message to client:', e);
          }
        });
      });
    })
    .catch(error => {
      console.error('Service worker activation error:', error);
    })
  );
});

// Fetch event - serve from cache with fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle build assets (JS, CSS files with hashes)
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css')) {
    event.respondWith(handleAssetRequest(request));
    return;
  }

  // Handle font files
  if (url.pathname.includes('/fonts/') || 
      url.pathname.endsWith('.woff2') || 
      url.pathname.endsWith('.woff') || 
      url.pathname.endsWith('.ttf')) {
    event.respondWith(handleFontRequest(request));
    return;
  }

  // Handle API requests
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image' || 
      url.pathname.endsWith('.png') || 
      url.pathname.endsWith('.jpg') || 
      url.pathname.endsWith('.jpeg') || 
      url.pathname.endsWith('.gif') || 
      url.pathname.endsWith('.webp') || 
      url.pathname.includes('/lovable-uploads/')) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle HTML documents with network-first strategy
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(handleHTMLRequest(request));
    return;
  }

  // Handle performance-critical assets (frame rate optimizer, etc.)
  if (HIGH_PERFORMANCE_ASSETS.some(pattern => url.pathname.includes(pattern.replace('*', '')))) {
    event.respondWith(handleHighPerformanceAsset(request));
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Handle high-performance assets with immediate cache response
async function handleHighPerformanceAsset(request) {
  const cache = await caches.open(HIGH_PERFORMANCE_CACHE);
  const cachedResponse = await cache.match(request);

  // Return cached version immediately for performance-critical assets
  if (cachedResponse) {
    // Update cache in background for next time
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Silently fail background update
    });
    
    return cachedResponse;
  }

  // If not cached, fetch and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Handle API requests with network-first strategy for fresh data
async function handleAPIRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Always try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response and add cache date
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      headers.set('sw-version', VERSION);
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Only use cache as fallback when network fails
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is too old
      const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'));
      const now = new Date();
      
      if (now - cacheDate < CACHE_DURATION.API) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'));
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATION.IMAGES) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Handle build assets (JS/CSS) with long cache and cache-first strategy
async function handleAssetRequest(request) {
  const cache = await caches.open(ASSETS_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Assets with hashes can be cached indefinitely
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle font files with very long cache
async function handleFontRequest(request) {
  const cache = await caches.open(ASSETS_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fonts rarely change, cache them for long periods
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle HTML documents with network-first strategy
async function handleHTMLRequest(request) {
  try {
    // Always try network first for HTML to ensure latest version
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}