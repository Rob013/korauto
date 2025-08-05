import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import { ThemeProvider } from "@/components/ThemeProvider"
// import { NavigationProvider } from './contexts/NavigationContext.tsx'

console.log('🚀 Main.tsx is loading...');

// Simple service worker registration without blocking
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

// Performance monitoring - only in development and only after app loads
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode - performance monitoring available');
}

console.log('🎯 About to render React app...');

try {
  const rootElement = document.getElementById("root");
  console.log('📦 Root element found:', rootElement);
  
  if (rootElement) {
    const root = createRoot(rootElement);
    console.log('✅ React root created successfully');
    
    // Test without providers first
    root.render(<App />);
    
    console.log('🎉 React app rendered successfully!');
  } else {
    console.error('❌ Root element not found!');
  }
} catch (error) {
  console.error('❌ Error rendering React app:', error);
}
