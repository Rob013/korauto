import { createRoot } from 'react-dom/client';
import './index.css';
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavigationProvider } from './contexts/NavigationContext.tsx';
import App from './App.tsx';
import React from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('🚨 ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      );
    }

    return (this.props as any).children;
  }
}

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

console.log('🚀 Main.tsx starting...');
console.log('🚀 React version check:', React.version);

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root container not found');
}

console.log('🚀 Creating React root...');
const root = createRoot(container);

console.log('🚀 Rendering app...');
root.render(
  <ErrorBoundary>
    <ThemeProvider defaultTheme="system" storageKey="korauto-ui-theme">
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

console.log('🚀 App rendered successfully');
