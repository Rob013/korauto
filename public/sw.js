// Enhanced Service Worker for optimal caching, performance, and loading
const VERSION = new Date().getTime(); // Use timestamp for versioning
const CACHE_NAME = `korauto-v${VERSION}`;
const STATIC_CACHE_NAME = `korauto-static-v${VERSION}`;
const ASSETS_CACHE_NAME = `korauto-assets-v${VERSION}`;
const IMAGES_CACHE_NAME = `korauto-images-v${VERSION}`;
const API_CACHE_NAME = `korauto-api-v${VERSION}`;

// Static assets to cache with priorities
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Critical assets to preload
const CRITICAL_ASSETS = [
  '/assets/index.css',
  '/assets/index.js'
];

// API endpoints to cache with smart patterns
const API_CACHE_PATTERNS = [
  /\/api\/manufacturers/,
  /\/api\/models/,
  /\/api\/generations/,
  /\/api\/cars\?/,
  /\/api\/filters/,
  /\/api\/status/
];

// Image patterns for optimized caching
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,
  /\/images\//,
  /\/photos\//,
  /\/uploads\//
];

// Font patterns
const FONT_PATTERNS = [
  /\.(woff|woff2|ttf|eot)$/i,
  /\/fonts\//
];

// Enhanced cache durations with performance consideration
const CACHE_DURATION = {
  API: 5 * 60 * 1000, // 5 minutes for API responses
  STATIC: 24 * 60 * 60 * 1000, // 24 hours for static assets
  IMAGES: 3 * 60 * 60 * 1000, // 3 hours for images
  ASSETS: 7 * 24 * 60 * 60 * 1000, // 7 days for versioned assets
  FONTS: 30 * 24 * 60 * 60 * 1000, // 30 days for fonts
  CRITICAL: 60 * 60 * 1000 // 1 hour for critical resources
};

// Performance monitoring
const PERFORMANCE_CACHE = new Map();

// Enhanced install event with smart preloading
self.addEventListener('install', (event) => {
  console.log('🔧 Installing enhanced service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => cache.addAll(STATIC_ASSETS)),
      
      // Preload critical assets
      caches.open(ASSETS_CACHE_NAME)
        .then((cache) => {
          // Only preload if network is good
          if (navigator.connection && navigator.connection.effectiveType === '4g') {
            return cache.addAll(CRITICAL_ASSETS.filter(asset => 
              // Check if asset exists before caching
              fetch(asset, { method: 'HEAD' }).then(() => true).catch(() => false)
            ));
          }
        })
    ]).then(() => {
      console.log('✅ Service worker installed successfully');
      self.skipWaiting();
    })
  );
});

// Enhanced activate event with intelligent cleanup
self.addEventListener('activate', (event) => {
  console.log('🚀 Activating enhanced service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const currentCaches = [CACHE_NAME, STATIC_CACHE_NAME, ASSETS_CACHE_NAME, IMAGES_CACHE_NAME, API_CACHE_NAME];
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Clear old performance data
      Promise.resolve(() => {
        PERFORMANCE_CACHE.clear();
      })
    ]).then(() => {
      console.log('✅ Service worker activated');
      self.clients.claim();
    })
  );
// Enhanced fetch event handler with smart routing and performance optimization
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and browser-specific URLs
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Performance monitoring
  const startTime = performance.now();
  
  // Route requests to appropriate handlers
  if (shouldHandleAsAsset(url)) {
    event.respondWith(handleAssetRequest(request, startTime));
  } else if (shouldHandleAsFont(url)) {
    event.respondWith(handleFontRequest(request, startTime));
  } else if (shouldHandleAsImage(url)) {
    event.respondWith(handleImageRequest(request, startTime));
  } else if (shouldHandleAsAPI(url)) {
    event.respondWith(handleAPIRequest(request, startTime));
  } else if (shouldHandleAsStatic(url)) {
    event.respondWith(handleStaticRequest(request, startTime));
  } else if (shouldHandleAsHTML(request)) {
    event.respondWith(handleHTMLRequest(request, startTime));
  } else {
    // Default: network first with performance tracking
    event.respondWith(handleDefaultRequest(request, startTime));
  }
});

// Smart request type detection
function shouldHandleAsAsset(url) {
  return url.pathname.startsWith('/assets/') || 
         url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.mjs');
}

function shouldHandleAsFont(url) {
  return FONT_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function shouldHandleAsImage(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         url.pathname.includes('/lovable-uploads/');
}

function shouldHandleAsAPI(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname + url.search));
}

function shouldHandleAsStatic(url) {
  return STATIC_ASSETS.includes(url.pathname);
}

function shouldHandleAsHTML(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// Enhanced API request handler with intelligent caching
async function handleAPIRequest(request, startTime) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Check if cached response is still fresh
  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'));
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATION.API) {
      logPerformance('API Cache Hit', startTime);
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
      logPerformance('API Network', startTime);
    }
    
    return networkResponse;
  } catch (error) {
    logPerformance('API Error', startTime);
    // Return stale cache if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Enhanced static asset handler with long-term caching
async function handleStaticRequest(request, startTime) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    logPerformance('Static Cache Hit', startTime);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      logPerformance('Static Network', startTime);
    }
    return networkResponse;
  } catch (error) {
    logPerformance('Static Error', startTime);
    throw error;
  }
}

// Enhanced asset handler with versioning support
async function handleAssetRequest(request, startTime) {
  const cache = await caches.open(ASSETS_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'));
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATION.ASSETS) {
      logPerformance('Asset Cache Hit', startTime);
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      headers.set('Cache-Control', 'public, max-age=604800'); // 7 days
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
      logPerformance('Asset Network', startTime);
    }
    
    return networkResponse;
  } catch (error) {
    logPerformance('Asset Error', startTime);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Enhanced font handler with very long caching
async function handleFontRequest(request, startTime) {
  const cache = await caches.open(ASSETS_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    logPerformance('Font Cache Hit', startTime);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('Cache-Control', 'public, max-age=2592000'); // 30 days
      headers.set('sw-cache-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
      logPerformance('Font Network', startTime);
    }
    
    return networkResponse;
  } catch (error) {
    logPerformance('Font Error', startTime);
    throw error;
  }
}

// Enhanced image handler with smart compression detection
async function handleImageRequest(request, startTime) {
  const cache = await caches.open(IMAGES_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'));
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATION.IMAGES) {
      logPerformance('Image Cache Hit', startTime);
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
      logPerformance('Image Network', startTime);
    }
    
    return networkResponse;
  } catch (error) {
    logPerformance('Image Error', startTime);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Enhanced HTML handler with network-first strategy
async function handleHTMLRequest(request, startTime) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      logPerformance('HTML Network', startTime);
    }
    
    return networkResponse;
  } catch (error) {
    logPerformance('HTML Error', startTime);
    // Fallback to cache for offline support
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page if available
    return cache.match('/') || new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Default request handler
async function handleDefaultRequest(request, startTime) {
  try {
    const networkResponse = await fetch(request);
    logPerformance('Default Network', startTime);
    return networkResponse;
  } catch (error) {
    logPerformance('Default Error', startTime);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Performance logging
function logPerformance(type, startTime) {
  const duration = performance.now() - startTime;
  
  if (!PERFORMANCE_CACHE.has(type)) {
    PERFORMANCE_CACHE.set(type, []);
  }
  
  const metrics = PERFORMANCE_CACHE.get(type);
  metrics.push(duration);
  
  // Keep only last 100 measurements
  if (metrics.length > 100) {
    metrics.shift();
  }
  
  // Log performance in development
  if (duration > 100) { // Log slow requests
    console.log(`⚠️ Slow ${type}: ${duration.toFixed(2)}ms`);
  }
}

// Message handling for performance reports
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PERFORMANCE_METRICS') {
    const metrics = {};
    for (const [type, timings] of PERFORMANCE_CACHE) {
      if (timings.length > 0) {
        const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
        metrics[type] = {
          average: avg.toFixed(2),
          count: timings.length,
          latest: timings[timings.length - 1].toFixed(2)
        };
      }
    }
    
    event.ports[0].postMessage({
      type: 'PERFORMANCE_METRICS',
      data: metrics
    });
  }
});
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

