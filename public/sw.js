// Service Worker for caching API responses and static assets with 120fps performance optimization
const VERSION = new Date().getTime(); // Use timestamp for versioning
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

// Cache duration in milliseconds (optimized for 120fps performance)
const CACHE_DURATION = {
  API: 5 * 60 * 1000, // 5 minutes for API responses
  STATIC: 24 * 60 * 60 * 1000, // 24 hours for static assets
  IMAGES: 60 * 60 * 1000, // 1 hour for images
  ASSETS: 7 * 24 * 60 * 60 * 1000, // 7 days for versioned assets (JS/CSS)
  FONTS: 30 * 24 * 60 * 60 * 1000, // 30 days for fonts
  HIGH_PERFORMANCE: 60 * 60 * 1000 // 1 hour for performance-critical assets
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

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== ASSETS_CACHE_NAME && 
                cacheName !== HIGH_PERFORMANCE_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
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

// Handle API requests with cache-first strategy for GET requests
async function handleAPIRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Check if cached response is still fresh
  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'));
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATION.API) {
      return cachedResponse;
    }
  }

  try {
    // Fetch fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response and add cache date
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
    // Return stale cache if network fails
    if (cachedResponse) {
      return cachedResponse;
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