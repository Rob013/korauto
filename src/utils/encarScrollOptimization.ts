/**
 * Advanced scroll optimization techniques inspired by encar.com
 * Implements high-performance scrolling for e-commerce sites
 */

/**
 * Enable hardware-accelerated scrolling container
 * Similar to Korean e-commerce sites like encar.com
 */
export const optimizeScrollContainer = (element: HTMLElement) => {
  // GPU acceleration
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
  
  // iOS momentum scrolling
  (element.style as any).webkitOverflowScrolling = 'touch';
  
  // Contain layout shifts during scroll
  element.style.contain = 'layout style paint';
  
  // Smooth scroll behavior
  element.style.scrollBehavior = 'smooth';
  
  // Prevent overscroll bounce on mobile
  element.style.overscrollBehavior = 'contain';
  
  // Optimize touch actions
  element.style.touchAction = 'pan-y pinch-zoom';
  
  // Will-change for scroll optimization
  element.style.willChange = 'scroll-position';
};

/**
 * Optimize card/item rendering for scroll performance
 */
export const optimizeScrollItem = (element: HTMLElement) => {
  // GPU layer for each item
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.backfaceVisibility = 'hidden';
  
  // Contain each card to prevent layout recalculation
  element.style.contain = 'layout style paint';
  
  // Optimize compositing
  element.style.isolation = 'isolate';
};

/**
 * Create high-performance scroll handler with RAF and throttling
 * Used by encar.com for infinite scroll and lazy loading
 */
export const createOptimizedScrollHandler = (
  callback: (scrollData: {
    scrollY: number;
    scrollDirection: 'up' | 'down';
    scrollSpeed: number;
    isScrolling: boolean;
  }) => void,
  options: {
    throttle?: number;
    passive?: boolean;
  } = {}
) => {
  const { throttle = 100, passive = true } = options;
  
  let rafId: number | null = null;
  let lastScrollY = 0;
  let lastTimestamp = 0;
  let scrollTimeout: NodeJS.Timeout;
  let isScrolling = false;
  
  const handler = () => {
    if (rafId !== null) return;
    
    isScrolling = true;
    rafId = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const currentTimestamp = performance.now();
      
      const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      const scrollSpeed = Math.abs(currentScrollY - lastScrollY) / 
                         (currentTimestamp - lastTimestamp || 1);
      
      callback({
        scrollY: currentScrollY,
        scrollDirection,
        scrollSpeed,
        isScrolling: true
      });
      
      lastScrollY = currentScrollY;
      lastTimestamp = currentTimestamp;
      rafId = null;
    });
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      callback({
        scrollY: window.scrollY,
        scrollDirection: window.scrollY > lastScrollY ? 'down' : 'up',
        scrollSpeed: 0,
        isScrolling: false
      });
    }, throttle);
  };
  
  const cleanup = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    clearTimeout(scrollTimeout);
  };
  
  return { handler, cleanup, options: { passive } };
};

/**
 * Lazy load images on scroll with Intersection Observer
 * Better performance than scroll event listeners
 */
export const createScrollLazyLoader = (options: {
  rootMargin?: string;
  threshold?: number;
} = {}) => {
  const { rootMargin = '50px', threshold = 0.01 } = options;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            // Preload image
            const tempImg = new Image();
            tempImg.onload = () => {
              img.src = src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            };
            tempImg.src = src;
          }
        }
      });
    },
    {
      rootMargin,
      threshold
    }
  );
  
  return observer;
};

/**
 * Smooth easing functions for scroll animations
 * Same as used in premium Korean e-commerce sites
 */
export const easingFunctions = {
  // Smooth deceleration (encar.com style)
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  
  // Smooth acceleration then deceleration
  easeInOutCubic: (t: number) => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  // Elastic bounce (for premium feel)
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : 
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  // Natural deceleration
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};

/**
 * Smooth scroll to position with custom easing
 * High-performance version using RAF
 */
export const smoothScrollToPosition = (
  targetY: number,
  duration: number = 800,
  easing: (t: number) => number = easingFunctions.easeOutQuart
) => {
  const startY = window.scrollY;
  const diff = targetY - startY;
  const startTime = performance.now();
  
  const scroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easing(progress);
    
    window.scrollTo(0, startY + diff * ease);
    
    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };
  
  requestAnimationFrame(scroll);
};

/**
 * Parallax scroll effect with RAF optimization
 */
export const createParallaxScroll = (
  element: HTMLElement,
  speed: number = 0.5
) => {
  let rafId: number | null = null;
  
  const updateParallax = () => {
    const scrollY = window.scrollY;
    const offset = scrollY * speed;
    element.style.transform = `translate3d(0, ${offset}px, 0)`;
  };
  
  const handler = () => {
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      updateParallax();
      rafId = null;
    });
  };
  
  window.addEventListener('scroll', handler, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handler);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
};

/**
 * Prevent scroll jank during expensive operations
 */
export const preventScrollJank = (callback: () => void) => {
  // Wait for next idle period
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 100 });
  } else {
    // Fallback to setTimeout
    setTimeout(callback, 1);
  }
};

/**
 * Optimize scroll performance for grid layouts
 */
export const optimizeGridScroll = (gridElement: HTMLElement) => {
  // Enable hardware acceleration
  gridElement.style.transform = 'translate3d(0, 0, 0)';
  gridElement.style.backfaceVisibility = 'hidden';
  
  // CSS containment for performance
  gridElement.style.contain = 'layout style paint';
  
  // Optimize rendering
  gridElement.style.willChange = 'transform';
  
  // Find all grid items and optimize them
  const items = gridElement.querySelectorAll(':scope > *');
  items.forEach((item) => {
    const element = item as HTMLElement;
    element.style.transform = 'translate3d(0, 0, 0)';
    element.style.backfaceVisibility = 'hidden';
    element.style.contain = 'layout style';
  });
};

/**
 * Detect if user prefers reduced motion
 */
export const shouldReduceMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get optimal scroll behavior based on user preference
 */
export const getScrollBehavior = (): ScrollBehavior => {
  return shouldReduceMotion() ? 'auto' : 'smooth';
};
