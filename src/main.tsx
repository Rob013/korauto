import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/iosOptimizations.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'
import cacheManager from '@/utils/cacheManager'
import { FrameRateOptimizer, inject120FPSStyles } from '@/utils/frameRateOptimizer'

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
        // Don't let service worker errors break the app
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('🔄 Cache updated to version:', event.data.version);
      }
    });
  });

  // Setup periodic cache refresh check (every 30 minutes)
  try {
    cacheManager.setupPeriodicRefresh(30);
  } catch (error) {
    console.error('❌ Cache manager setup failed:', error);
  }
} else {
  console.log('⚠️ Service Worker not supported');
}

// Initialize performance optimizations
const frameRateOptimizer = FrameRateOptimizer.getInstance();
inject120FPSStyles();

// Add mobile debugging
console.log('🚀 App starting...', {
  userAgent: navigator.userAgent,
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  },
  performance: {
    fps: frameRateOptimizer.getCurrentFPS(),
    capabilities: frameRateOptimizer.getCapabilities(),
    config: frameRateOptimizer.getConfig()
  }
});

// Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;"><h2>Error</h2><p>Root element not found. Please refresh the page.</p></div>';
} else {
  console.log('✅ Root element found');
  createRoot(rootElement).render(
    <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </ThemeProvider>
  );
}
