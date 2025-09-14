import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'
import { getHighRefreshRateManager, loadHighRefreshRatePreferences } from './utils/highRefreshRate'

// Initialize high refresh rate support
const initializeHighRefreshRate = async () => {
  try {
    // Load user preferences
    const preferences = loadHighRefreshRatePreferences();
    
    // Initialize the high refresh rate manager with user preferences
    const manager = await getHighRefreshRateManager(preferences);
    
    // Update CSS custom properties for global high refresh rate support
    const stats = manager.getStats();
    if (stats.capabilities?.isHighRefreshSupported) {
      document.documentElement.style.setProperty('--screen-refresh-rate', stats.targetFrameRate.toString());
      document.documentElement.style.setProperty('--frame-time', `${1000 / stats.targetFrameRate}ms`);
      document.documentElement.style.setProperty('--optimal-transition-duration', `${(1000 / stats.targetFrameRate) * 0.5}ms`);
      
      // Add a class to the document for CSS targeting
      if (stats.targetFrameRate > 60) {
        document.documentElement.classList.add('high-refresh-rate-supported');
        
        if (stats.targetFrameRate >= 120) {
          document.documentElement.classList.add('fps-120-supported');
        } else if (stats.targetFrameRate >= 90) {
          document.documentElement.classList.add('fps-90-supported');
        }
      }
      
      console.log(`🚀 High refresh rate initialized: ${stats.targetFrameRate}fps`);
    }
  } catch (error) {
    console.warn('Failed to initialize high refresh rate support:', error);
  }
};

// Register service worker for caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Initialize high refresh rate support before rendering
initializeHighRefreshRate().then(() => {
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </ThemeProvider>
  );
});
