import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'

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

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </ThemeProvider>
  </AppErrorBoundary>
);
