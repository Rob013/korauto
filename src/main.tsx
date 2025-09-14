import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'
import { addResourceHints } from './utils/performance'

// ===== PERFORMANCE OPTIMIZATIONS =====
// Initialize critical performance enhancements before app load

// Add resource hints for better loading performance
addResourceHints();

// Optimize font loading
if ('fonts' in document) {
  // Preload critical fonts
  const criticalFonts = [
    '/fonts/Inter-Regular.woff2',
    '/fonts/Inter-Medium.woff2',
    '/fonts/Inter-SemiBold.woff2'
  ];
  
  criticalFonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Optimize loading performance with better resource prioritization
const loadingOptimizations = () => {
  // Enable save-data mode for slower connections
  const connection = (navigator as any).connection;
  if (connection && connection.saveData) {
    document.documentElement.classList.add('save-data');
  }
  
  // Add performance observer for Core Web Vitals
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 ${entry.name}: ${entry.value?.toFixed(2) || 'N/A'}`);
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Graceful fallback for older browsers
      console.log('Performance observer not fully supported');
    }
  }
};

// Register service worker for caching with enhanced error handling
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                console.log('🔄 New content available');
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.warn('⚠️ SW registration failed:', registrationError);
      });
  });
}

// Initialize loading optimizations
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadingOptimizations);
} else {
  loadingOptimizations();
}

// Enhanced root rendering with performance monitoring
const renderApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // Add performance attributes
  rootElement.setAttribute('data-performance-optimized', 'true');
  
  const root = createRoot(rootElement);
  
  root.render(
    <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </ThemeProvider>
  );
};

// Use requestIdleCallback for non-blocking render
if ('requestIdleCallback' in window) {
  requestIdleCallback(renderApp, { timeout: 2000 });
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(renderApp, 0);
}
