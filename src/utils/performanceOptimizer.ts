/**
 * Comprehensive performance optimization utilities
 * Inspired by encar.com and premium Korean e-commerce sites
 */

const transitionsStyleId = 'performance-transitions-style';
let baseOptimizationsApplied = false;
let scrollListenerRegistered = false;
let scrollTicking = false;
let scrollHandler: ((this: Window, ev: Event) => void) | null = null;
const optimizedImages = new WeakSet<HTMLImageElement>();
const optimizedCards = new WeakSet<HTMLElement>();
let routeObserver: MutationObserver | null = null;
let pageHideCleanupRegistered = false;

/**
 * Anti-flickering initialization
 * Call this on app mount to prevent visual glitches
 */
export const initializeAntiFlicker = () => {
  // Prevent FOUC (Flash of Unstyled Content)
  document.documentElement.style.visibility = 'visible';
  
  // Force initial paint to prevent layout shifts
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      document.body.style.opacity = '1';
    });
  } else {
    setTimeout(() => {
      document.body.style.opacity = '1';
    }, 0);
  }
};

/**
 * Optimize all images for smooth loading without flickering
 */
export const optimizeImages = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const images = document.querySelectorAll<HTMLImageElement>('img[data-src], img[loading="lazy"]');

  images.forEach((element) => {
    if (optimizedImages.has(element)) {
      return;
    }

    optimizedImages.add(element);

    if (!element.hasAttribute('loading')) {
      element.loading = 'lazy';
    }

    if (!element.hasAttribute('decoding')) {
      element.decoding = 'async';
    }

    if (!element.style.transition) {
      element.style.transition = 'opacity 0.3s ease-out';
    }

    if (!element.complete) {
      element.style.opacity = '0';
      element.addEventListener(
        'load',
        () => {
          element.style.opacity = '1';
        },
        { once: true }
      );
    } else {
      element.style.opacity = '1';
    }
  });
};

/**
 * Apply hardware acceleration to elements
 */
export const applyHardwareAcceleration = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  
  elements.forEach((element) => {
    const el = element as HTMLElement;
    el.style.transform = 'translate3d(0, 0, 0)';
    el.style.backfaceVisibility = 'hidden';
    el.style.perspective = '1000px';
  });
};

/**
 * Optimize transitions for smooth 120fps performance
 */
export const optimizeTransitions = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.head.querySelector(`#${transitionsStyleId}`)) {
    return;
  }

  const style = document.createElement('style');
  style.id = transitionsStyleId;
  style.textContent = `
    *, *::before, *::after {
      -webkit-tap-highlight-color: transparent;
    }

    :where(button, a, input, select, textarea, [role="button"], [role="link"]) {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    :where(button:active, a:active, [role="button"]:active) {
      transition-duration: 80ms;
    }

    :where(button:hover, a:hover, [role="button"]:hover) {
      will-change: transform;
    }

    :where(button:not(:hover):not(:focus), a:not(:hover):not(:focus), [role="button"]:not(:hover):not(:focus)) {
      will-change: auto;
    }
  `;

  document.head.appendChild(style);
};

/**
 * Prevent layout shift by reserving space for images
 */
export const preventLayoutShift = () => {
  const images = document.querySelectorAll('img:not([width]):not([height])');
  
  images.forEach((img) => {
    const element = img as HTMLImageElement;
    // Add aspect ratio box
    if (!element.style.aspectRatio && element.naturalWidth && element.naturalHeight) {
      element.style.aspectRatio = `${element.naturalWidth} / ${element.naturalHeight}`;
    }
  });
};

/**
 * Smooth scroll to element without janking
 */
export const smoothScrollToElement = (element: HTMLElement, offset = 0) => {
  const targetPosition = element.getBoundingClientRect().top + window.scrollY - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
};

/**
 * Optimize card hover animations
 */
export const optimizeCardAnimations = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
  
  cards.forEach((card) => {
    const element = card as HTMLElement;

    if (optimizedCards.has(element)) {
      return;
    }

    optimizedCards.add(element);

    if (!element.style.backfaceVisibility) {
      element.style.backfaceVisibility = 'hidden';
    }

    const handleMouseEnter = () => {
      element.style.willChange = 'transform, box-shadow';
    };

    const handleMouseLeave = () => {
      element.style.willChange = 'auto';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
  });
};

/**
 * Reduce motion for users who prefer it
 */
export const respectReducedMotion = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    const style = document.createElement('style');
    style.textContent = `
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
  }
};

/**
 * Optimize scroll performance for 120fps
 */
export const optimizeScrollPerformance = () => {
  if (typeof window === 'undefined' || scrollListenerRegistered) {
    return;
  }

  scrollHandler = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        scrollTicking = false;
      });
    }
  };

  window.addEventListener('scroll', scrollHandler!, { passive: true });
  scrollListenerRegistered = true;
};

/**
 * Enable 120Hz display support
 */
export const enable120Hz = () => {
  // Check if high refresh rate is available
  const style = document.createElement('style');
  style.textContent = `
    @media (min-resolution: 2dppx) and (prefers-reduced-motion: no-preference) {
      * {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
    
    /* Optimize for 120Hz displays */
    @supports (animation-timeline: scroll()) {
      * {
        animation-timing-function: linear(0, 0.5 50%, 1);
      }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Initialize all performance optimizations
 */
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
  if (!baseOptimizationsApplied) {
    initializeAntiFlicker();
    optimizeTransitions();
    optimizeScrollPerformance();
    enable120Hz();
    respectReducedMotion();
    baseOptimizationsApplied = true;
  }

  scheduleDeferredOptimizations();
  ensureRouteObserver();
  registerPageHideCleanup();
};

const scheduleDeferredOptimizations = () => {
  const run = () => {
    optimizeImages();
    preventLayoutShift();
    optimizeCardAnimations();
  };

  if (typeof window !== 'undefined') {
    const idleCallback = (window as typeof window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    }).requestIdleCallback;

    if (typeof idleCallback === 'function') {
      idleCallback(run, { timeout: 300 });
      return;
    }
  }

  setTimeout(run, 32);
};

const ensureRouteObserver = () => {
  if (typeof document === 'undefined' || routeObserver) {
    return;
  }

  const root = document.getElementById('root');

  if (!root) {
    return;
  }

  let scheduled = false;

  routeObserver = new MutationObserver(() => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      scheduleDeferredOptimizations();
    });
  });

  routeObserver.observe(root, {
    childList: true,
    subtree: true
  });
};

const registerPageHideCleanup = () => {
  if (typeof window === 'undefined' || pageHideCleanupRegistered) {
    return;
  }

  window.addEventListener(
    'pagehide',
    () => {
      routeObserver?.disconnect();
      routeObserver = null;

      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
      }

      scrollListenerRegistered = false;
      scrollTicking = false;
      baseOptimizationsApplied = false;
      pageHideCleanupRegistered = false;
    },
    { once: true }
  );

  pageHideCleanupRegistered = true;
};

/**
 * Optimize specific component mount
 */
export const optimizeComponentMount = (ref: React.RefObject<HTMLElement>) => {
  if (!ref.current) return;
  
  const element = ref.current;
  
  // GPU acceleration
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.backfaceVisibility = 'hidden';
  
  // Optimize all children
  const children = element.querySelectorAll('*');
  children.forEach((child) => {
    const el = child as HTMLElement;
    if (el.classList.contains('card') || el.tagName === 'IMG') {
      el.style.transform = 'translate3d(0, 0, 0)';
      el.style.backfaceVisibility = 'hidden';
    }
  });
};
