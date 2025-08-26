import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavigationProvider } from './contexts/NavigationContext.tsx'

// Register service worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
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
  <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
    <NavigationProvider>
      <App />
    </NavigationProvider>
  </ThemeProvider>
);
