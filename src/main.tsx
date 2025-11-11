import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/iosOptimizations.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'
import cacheManager from '@/utils/cacheManager'
import { inject120FPSStyles } from '@/utils/frameRateOptimizer'
import initSmoothRuntime from '@/utils/runtimeSmoothness'
import initAntiFlicker from '@/utils/antiFlicker'
import { initializePerformanceOptimizations } from '@/utils/performanceOptimizer'
import { initialize120fpsScrolling } from '@/utils/scroll120fps'
import '@/utils/performanceOptimizations'

// Initialize performance optimizations immediately
initializePerformanceOptimizations();

// Initialize ultra-smooth 120fps scrolling
initialize120fpsScrolling();

// Initialize cache manager and check for updates
cacheManager.initialize().then((cacheCleared) => {
  if (cacheCleared) {
    console.log('✅ Cache cleared due to version change');
  }
});

// Register service worker for caching with update handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);

        const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
        const tryUpdate = () => {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return;
          }
          try {
            registration.update().catch(() => {
              // Silently ignore update errors
            });
          } catch (e) {
            // Ignore errors during update check
          }
        };

        tryUpdate();
        setInterval(tryUpdate, UPDATE_INTERVAL_MS);

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
  });

  // Setup periodic cache refresh check (every 30 minutes)
  cacheManager.setupPeriodicRefresh(30);
}

// Initialize anti-flicker and smoothness helpers before first render
try {
  initAntiFlicker();
  inject120FPSStyles();
  initSmoothRuntime();
} catch (e) {
  // no-op
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
    <NavigationProvider>
      <App />
    </NavigationProvider>
  </ThemeProvider>
);
