/**
 * Advanced Performance Optimizations
 * Implements cutting-edge techniques for maximum stability and speed
 */

// ============= Resource Hints =============
export const addResourceHints = () => {
  const head = document.head;

  // DNS prefetch for external resources
  const dnsPrefetch = ['https://qtyyiqimkysmjnaocswe.supabase.co'];
  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    head.appendChild(link);
  });

  // Preconnect to critical origins
  const preconnect = ['https://qtyyiqimkysmjnaocswe.supabase.co'];
  preconnect.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    head.appendChild(link);
  });
};

// ============= Image Loading Optimization =============
export const optimizeImageLoading = () => {
  // Use Intersection Observer for lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Enable image decoding optimization
  document.querySelectorAll('img').forEach((img: HTMLImageElement) => {
    if ('decoding' in img) {
      img.decoding = 'async';
    }
  });
};

// ============= Script Loading Optimization =============
export const optimizeScriptLoading = () => {
  // Defer non-critical scripts
  document.querySelectorAll('script[data-defer]').forEach(script => {
    const newScript = document.createElement('script');
    newScript.src = script.getAttribute('src') || '';
    newScript.defer = true;
    script.parentNode?.replaceChild(newScript, script);
  });
};

// ============= Memory Management =============
export const setupMemoryManagement = () => {
  // Detect memory pressure and clean up
  if ('memory' in performance) {
    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const percentUsed = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (percentUsed > 0.9) {
          console.warn('🔴 High memory usage detected:', Math.round(percentUsed * 100) + '%');
          // Trigger garbage collection if available
          if ('gc' in window) {
            (window as any).gc();
          }
        } else if (percentUsed > 0.7) {
          console.log('🟡 Moderate memory usage:', Math.round(percentUsed * 100) + '%');
        }
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
  }
};

// ============= Render Optimization =============
export const optimizeRendering = () => {
  // Use content-visibility for off-screen content
  const style = document.createElement('style');
  style.textContent = `
    .optimize-rendering {
      content-visibility: auto;
      contain-intrinsic-size: auto 500px;
    }

    .optimize-rendering-strict {
      contain: layout style paint;
      content-visibility: auto;
    }

    /* Optimize animations */
    .optimized-animation {
      will-change: transform, opacity;
      transform: translateZ(0);
      backface-visibility: hidden;
    }

    /* Remove will-change after animation */
    .optimized-animation:not(:hover):not(:active):not(:focus) {
      will-change: auto;
    }
  `;
  document.head.appendChild(style);
};

// ============= Network Optimization =============
export const optimizeNetworkRequests = () => {
  // Implement request batching
  const requestQueue: Array<() => Promise<any>> = [];
  let batchTimeout: ReturnType<typeof setTimeout> | null = null;

  const processBatch = async () => {
    const batch = requestQueue.splice(0, 5); // Process 5 at a time
    await Promise.all(batch.map(req => req()));
    
    if (requestQueue.length > 0) {
      batchTimeout = setTimeout(processBatch, 100);
    } else {
      batchTimeout = null;
    }
  };

  (window as any).queueRequest = (request: () => Promise<any>) => {
    requestQueue.push(request);
    if (!batchTimeout) {
      batchTimeout = setTimeout(processBatch, 50);
    }
  };
};

// ============= Smooth Scrolling Enhancement =============
export const enhanceSmoothScrolling = () => {
  // Implement RAF-based smooth scrolling for better performance
  let scrolling = false;
  let targetScrollTop = 0;
  let currentScrollTop = 0;

  const smoothScroll = () => {
    if (!scrolling) return;

    const diff = targetScrollTop - currentScrollTop;
    const delta = diff * 0.1; // Easing factor

    if (Math.abs(delta) < 0.5) {
      window.scrollTo(0, targetScrollTop);
      scrolling = false;
      return;
    }

    currentScrollTop += delta;
    window.scrollTo(0, currentScrollTop);
    requestAnimationFrame(smoothScroll);
  };

  (window as any).smoothScrollTo = (top: number) => {
    targetScrollTop = top;
    currentScrollTop = window.scrollY;
    scrolling = true;
    requestAnimationFrame(smoothScroll);
  };
};

// ============= Initialize All Optimizations =============
export const initializePerformanceOptimizations = () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyOptimizations();
    });
  } else {
    applyOptimizations();
  }
};

const applyOptimizations = () => {
  addResourceHints();
  optimizeImageLoading();
  optimizeScriptLoading();
  setupMemoryManagement();
  optimizeRendering();
  optimizeNetworkRequests();
  enhanceSmoothScrolling();

  console.log('✅ Performance optimizations applied');
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initializePerformanceOptimizations();
}
