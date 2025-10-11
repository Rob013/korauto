import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'

// Load critical CSS immediately
import './index.css'

// Defer non-critical CSS
const loadNonCriticalCSS = () => {
  import('./utils/iosOptimizations.css')
}

// Defer cache manager initialization
const initializeCacheManager = async () => {
  const { default: cacheManager } = await import('@/utils/cacheManager')
  return cacheManager
}

// Initialize app immediately for better LCP
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
    <NavigationProvider>
      <App />
    </NavigationProvider>
  </ThemeProvider>
);

// Defer non-critical initialization after initial render
const deferNonCritical = (callback: () => void) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
};

deferNonCritical(() => {
  // Load non-critical CSS
  loadNonCriticalCSS();
  
  // Initialize cache manager
  initializeCacheManager().then((cacheManager) => {
    cacheManager.initialize().then((cacheCleared) => {
      if (cacheCleared) {
        console.log('✅ Cache cleared due to version change');
      }
    });
    
    // Setup periodic cache refresh check (every 30 minutes)
    cacheManager.setupPeriodicRefresh(30);
  });

  // Register service worker for caching with update handling
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);

        // Check for updates every 30 seconds
        setInterval(() => {
          registration.update();
        }, 30000);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker available');
                // Let the CacheUpdateNotification component handle the UI
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('🔄 Cache updated to version:', event.data.version);
      }
    });
  }
});
