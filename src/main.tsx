import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'
import cacheManager from '@/utils/cacheManager'

// Initialize cache manager and check for updates
cacheManager.initialize().then((cacheCleared) => {
  if (cacheCleared) {
    console.log('✅ Cache cleared due to version change');
  }
});

// Register service worker for caching with update handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
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
  });

  // Setup periodic cache refresh check (every 30 minutes)
  cacheManager.setupPeriodicRefresh(30);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
    <NavigationProvider>
      <App />
    </NavigationProvider>
  </ThemeProvider>
);
