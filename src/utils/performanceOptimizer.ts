/**
 * Comprehensive performance optimization utilities
 * Inspired by encar.com and premium Korean e-commerce sites
 */

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
  const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
  
  images.forEach((img) => {
    const element = img as HTMLImageElement;
    
    // Add smooth fade-in
    element.style.transition = 'opacity 0.3s ease-out';
    element.style.opacity = '0';
    
    // When loaded, fade in
    const handleLoad = () => {
      element.style.opacity = '1';
      element.removeEventListener('load', handleLoad);
    };
    
    element.addEventListener('load', handleLoad);
    
    // If already loaded
    if (element.complete) {
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
  const style = document.createElement('style');
  style.textContent = `
    /* Ultra-smooth 120fps transitions */
    * {
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Optimize all transitions with GPU acceleration */
    [class*="transition"],
    button,
    a,
    input,
    select,
    .card {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
      will-change: auto;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
    }
    
    /* Instant feedback for touch interactions */
    button:active,
    a:active,
    [role="button"]:active {
      transition-duration: 80ms;
      transform: translate3d(0, 0, 0) scale(0.98);
    }
    
    /* Optimize hover states */
    button:hover,
    a:hover,
    [role="button"]:hover {
      will-change: transform;
    }
    
    /* Remove will-change after animation */
    *:not(:hover):not(:active):not(:focus) {
      will-change: auto !important;
    }
    
    /* Smooth scrolling containers */
    * {
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
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
  const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
  
  cards.forEach((card) => {
    const element = card as HTMLElement;
    
    // GPU acceleration
    element.style.transform = 'translate3d(0, 0, 0)';
    element.style.backfaceVisibility = 'hidden';
    
    // Optimize hover
    element.addEventListener('mouseenter', () => {
      element.style.willChange = 'transform, box-shadow';
    }, { passive: true });
    
    element.addEventListener('mouseleave', () => {
      // Remove will-change after transition
      setTimeout(() => {
        element.style.willChange = 'auto';
      }, 300);
    }, { passive: true });
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
  let ticking = false;
  let lastScrollY = window.scrollY;
  
  // Passive scroll listener for better performance
  const handleScroll = () => {
    lastScrollY = window.scrollY;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        // Apply scroll optimizations
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Optimize all scrollable containers
  const scrollContainers = document.querySelectorAll('[class*="overflow"], [class*="scroll"]');
  scrollContainers.forEach((container) => {
    const el = container as HTMLElement;
    el.style.transform = 'translate3d(0, 0, 0)';
    el.style.backfaceVisibility = 'hidden';
    (el.style as any).webkitOverflowScrolling = 'touch';
    el.style.overscrollBehavior = 'contain';
  });
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
  initializeAntiFlicker();
  optimizeTransitions();
  optimizeScrollPerformance();
  enable120Hz();
  respectReducedMotion();
  
  // Apply on next frame
  requestAnimationFrame(() => {
    optimizeImages();
    preventLayoutShift();
    optimizeCardAnimations();
  });
  
  // Re-optimize on route change
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      requestAnimationFrame(() => {
        optimizeImages();
        preventLayoutShift();
        optimizeCardAnimations();
        optimizeScrollPerformance();
      });
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
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
