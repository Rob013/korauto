// Enhanced Service Worker for KORAUTO with aggressive caching for 100% mobile performance

const CACHE_NAME = 'korauto-v2.0.0';
const STATIC_CACHE = 'korauto-static-v2';
const DYNAMIC_CACHE = 'korauto-dynamic-v2';
const IMAGE_CACHE = 'korauto-images-v2';

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 24 hours
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 10 * 60 * 1000,              // 10 minutes
  FONTS: 30 * 24 * 60 * 60 * 1000   // 30 days
};

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Critical CSS and JS will be added dynamically
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/cars',
  '/api/makes',
  '/api/models',
  '/api/filters',
  'supabase.co'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      // Cache static assets
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(STATIC_ASSETS);
      
      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('korauto-') && 
        !name.includes('v2')
      );
      
      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      );
      
      // Claim all clients
      self.clients.claim();
    })()
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy selection based on resource type
    if (isStaticAsset(url)) {
      return handleStaticAsset(request);
    } else if (isImage(url)) {
      return handleImage(request);
    } else if (isAPI(url)) {
      return handleAPI(request);
    } else if (isFont(url)) {
      return handleFont(request);
    } else {
      return handleDynamic(request);
    }
  } catch (error) {
    console.error('Service Worker fetch error:', error);
    return handleFallback(request);
  }
}

// Static assets - Cache First strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  let response = await cache.match(request);
  
  if (response) {
    // Check if cache is still fresh
    const cacheDate = new Date(response.headers.get('sw-cache-date') || 0);
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATIONS.STATIC) {
      return response;
    }
  }
  
  // Fetch fresh copy
  try {
    const freshResponse = await fetch(request);
    if (freshResponse.ok) {
      const responseToCache = freshResponse.clone();
      responseToCache.headers.set('sw-cache-date', new Date().toISOString());
      cache.put(request, responseToCache);
    }
    return freshResponse;
  } catch (error) {
    // Return stale cache if available
    if (response) return response;
    throw error;
  }
}

// Images - Cache First with WebP optimization
async function handleImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const url = new URL(request.url);
  
  // Try to serve WebP if supported
  const supportsWebP = request.headers.get('accept')?.includes('image/webp');
  
  let response = await cache.match(request);
  
  if (response) {
    const cacheDate = new Date(response.headers.get('sw-cache-date') || 0);
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATIONS.IMAGES) {
      return response;
    }
  }
  
  try {
    // Optimize image request
    const optimizedRequest = await optimizeImageRequest(request, supportsWebP);
    const freshResponse = await fetch(optimizedRequest);
    
    if (freshResponse.ok) {
      const responseToCache = freshResponse.clone();
      responseToCache.headers.set('sw-cache-date', new Date().toISOString());
      cache.put(request, responseToCache);
    }
    return freshResponse;
  } catch (error) {
    if (response) return response;
    return createPlaceholderImage();
  }
}

// API requests - Stale While Revalidate
async function handleAPI(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh data
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-date', new Date().toISOString());
      cache.put(request, responseToCache);
    }
    return response;
  }).catch(() => null);
  
  // Return cached data immediately if available and fresh
  if (cachedResponse) {
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATIONS.API) {
      // Background update
      fetchPromise;
      return cachedResponse;
    }
  }
  
  // Wait for fresh data or return stale
  const freshResponse = await fetchPromise;
  return freshResponse || cachedResponse || new Response('{"error":"offline"}', {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Fonts - Cache First with long duration
async function handleFont(request) {
  const cache = await caches.open(STATIC_CACHE);
  let response = await cache.match(request);
  
  if (response) {
    const cacheDate = new Date(response.headers.get('sw-cache-date') || 0);
    const now = new Date();
    
    if (now - cacheDate < CACHE_DURATIONS.FONTS) {
      return response;
    }
  }
  
  try {
    const freshResponse = await fetch(request);
    if (freshResponse.ok) {
      const responseToCache = freshResponse.clone();
      responseToCache.headers.set('sw-cache-date', new Date().toISOString());
      cache.put(request, responseToCache);
    }
    return freshResponse;
  } catch (error) {
    if (response) return response;
    throw error;
  }
}

// Dynamic content - Network First
async function handleDynamic(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-date', new Date().toISOString());
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return handleFallback(request);
  }
}

// Utility functions
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/) ||
         url.pathname === '/' ||
         url.pathname === '/manifest.json';
}

function isImage(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/);
}

function isAPI(url) {
  return CACHEABLE_APIS.some(api => url.href.includes(api)) ||
         url.pathname.startsWith('/api/');
}

function isFont(url) {
  return url.pathname.match(/\.(woff|woff2|ttf|eot)$/) ||
         url.hostname.includes('fonts.g');
}

async function optimizeImageRequest(request, supportsWebP) {
  const url = new URL(request.url);
  
  // Add compression parameters if possible
  if (url.searchParams.has('w') || url.searchParams.has('width')) {
    if (supportsWebP && !url.pathname.endsWith('.webp')) {
      url.searchParams.set('fm', 'webp');
    }
    url.searchParams.set('q', '85'); // High quality compression
  }
  
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer
  });
}

function createPlaceholderImage() {
  // Create a minimal SVG placeholder
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#f3f4f6"/>
      <text x="150" y="100" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="16">
        Image unavailable
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

async function handleFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/offline.html') || new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  // For other requests, return appropriate error response
  if (isImage(url)) {
    return createPlaceholderImage();
  }
  
  return new Response('Resource unavailable offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Retry failed API requests when back online
  console.log('🔄 Background sync triggered');
  
  // Clear old cache entries
  await cleanupCaches();
}

async function cleanupCaches() {
  const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheDate = new Date(response.headers.get('sw-cache-date') || 0);
        const now = new Date();
        const age = now - cacheDate;
        
        // Remove expired entries
        if (age > CACHE_DURATIONS.DYNAMIC * 2) {
          await cache.delete(request);
        }
      }
    }
  }
}

// Message handling for cache control
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      if (data?.urls) {
        cacheUrls(data.urls);
      }
      break;
      
    case 'CLEAR_CACHE':
      clearCaches();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0]?.postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await Promise.allSettled(
    urls.map(url => 
      fetch(url).then(response => {
        if (response.ok) {
          return cache.put(url, response);
        }
      }).catch(() => {})
    )
  );
}

async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
}

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && response.headers.get('content-length')) {
        totalSize += parseInt(response.headers.get('content-length'));
      }
    }
  }
  
  return totalSize;
}

console.log('🎯 KORAUTO Service Worker v2.0.0 loaded successfully');