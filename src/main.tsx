import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'
import { injectCriticalCSS } from './utils/criticalFixes'

// Inject critical CSS immediately for performance
injectCriticalCSS();

// Enhanced service worker registration for performance
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use enhanced service worker in production, regular one in development
    const swFile = process.env.NODE_ENV === 'production' ? '/sw-enhanced.js' : '/sw.js';
    
    navigator.serviceWorker.register(swFile)
      .then((registration) => {
        console.log('🎯 Service Worker registered successfully:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, prompt user to refresh
                if (confirm('New version available! Refresh to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
      
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
    <NavigationProvider>
      <App />
    </NavigationProvider>
  </ThemeProvider>
);
