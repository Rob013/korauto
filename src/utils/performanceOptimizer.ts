// Performance optimizer utilities for mobile and desktop
import React from 'react';
import { debounce, throttle } from '@/utils/performance';

// Optimized scroll handler for mobile
export const createOptimizedScrollHandler = (callback: () => void, delay: number = 100) => {
  let ticking = false;
  
  const optimizedCallback = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  return throttle(optimizedCallback, delay);
};

// Image preloading for better perceived performance
export const preloadImages = (urls: string[], maxConcurrent: number = 3) => {
  return new Promise((resolve) => {
    let loadedCount = 0;
    let currentIndex = 0;
    
    const loadNext = () => {
      if (currentIndex >= urls.length) {
        if (loadedCount >= urls.length) {
          resolve(true);
        }
        return;
      }
      
      const img = new Image();
      const url = urls[currentIndex++];
      
      img.onload = img.onerror = () => {
        loadedCount++;
        loadNext();
      };
      
      img.src = url;
    };
    
    // Start loading with concurrency limit
    for (let i = 0; i < Math.min(maxConcurrent, urls.length); i++) {
      loadNext();
    }
  });
};

// Optimized component wrapper for better re-render performance
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom shallow comparison for better performance
    const keys = Object.keys(prevProps) as Array<keyof P>;
    
    for (const key of keys) {
      if (prevProps[key] !== nextProps[key]) {
        // Skip re-render for certain non-critical props
        if (key === 'timestamp' || key === 'lastUpdated') {
          continue;
        }
        return false;
      }
    }
    return true;
  });
};

// Mobile-specific performance optimizations
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

export const getMobileOptimizedConfig = () => {
  const isMobile = isMobileDevice();
  
  return {
    // Reduce quality and size for mobile
    imageQuality: isMobile ? 60 : 80,
    maxImageWidth: isMobile ? 400 : 800,
    // Smaller batch sizes for mobile
    batchSize: isMobile ? 10 : 20,
    // Longer debounce for mobile to reduce API calls
    debounceDelay: isMobile ? 300 : 150,
    // Larger intersection margins for mobile
    intersectionMargin: isMobile ? '150px' : '100px',
    // Reduced animation duration for smoother mobile experience
    animationDuration: isMobile ? 200 : 300,
  };
};

// Batch DOM updates for better performance
export const batchDOMOperations = (operations: Array<() => void>) => {
  requestAnimationFrame(() => {
    operations.forEach(op => op());
  });
};

// Memory cleanup utilities
export const cleanupMemory = () => {
  // Force garbage collection if available (dev mode)
  if (process.env.NODE_ENV === 'development' && (window as any).gc) {
    (window as any).gc();
  }
};

// Optimized event listener management
export class EventManager {
  private listeners: Map<string, Array<{ element: Element; handler: EventListener; options?: AddEventListenerOptions }>> = new Map();
  
  add(element: Element, event: string, handler: EventListener, options?: AddEventListenerOptions) {
    const key = `${event}-${element.tagName}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key)!.push({ element, handler, options });
    element.addEventListener(event, handler, options);
  }
  
  remove(element: Element, event: string, handler: EventListener) {
    const key = `${event}-${element.tagName}`;
    const listeners = this.listeners.get(key);
    
    if (listeners) {
      const index = listeners.findIndex(l => l.element === element && l.handler === handler);
      if (index > -1) {
        listeners.splice(index, 1);
        element.removeEventListener(event, handler);
      }
    }
  }
  
  cleanup() {
    this.listeners.forEach((listeners, key) => {
      listeners.forEach(({ element, handler }) => {
        element.removeEventListener(key.split('-')[0], handler);
      });
    });
    this.listeners.clear();
  }
}

export const createEventManager = () => new EventManager();