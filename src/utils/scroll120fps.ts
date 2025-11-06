/**
 * Ultra-smooth 120fps scroll optimization utilities
 * Optimized for high refresh rate displays and mobile devices
 */

let rafId: number | null = null;
let ticking = false;

/**
 * Passive scroll listener for 120fps performance
 */
export const initializeUltraSmoothScroll = () => {
  // Detect if high refresh rate is available
  const isHighRefreshRate = window.screen && (window.screen as any).availRefreshRate >= 120;
  
  // Apply GPU acceleration to main scroll container
  const applyScrollOptimizations = () => {
    document.body.style.transform = 'translate3d(0, 0, 0)';
    document.body.style.backfaceVisibility = 'hidden';
    document.body.style.perspective = '1000px';
    
    // Optimize all scroll containers
    const scrollContainers = document.querySelectorAll(
      '[class*="overflow"], [class*="scroll"], main, [role="main"]'
    );
    
    scrollContainers.forEach((container) => {
      const el = container as HTMLElement;
      el.style.transform = 'translate3d(0, 0, 0)';
      el.style.backfaceVisibility = 'hidden';
      (el.style as any).webkitOverflowScrolling = 'touch';
      el.style.overscrollBehavior = 'contain';
      el.style.willChange = 'scroll-position';
    });
  };
  
  // Apply optimizations
  applyScrollOptimizations();
  
  // Passive scroll event for maximum performance
  let lastScrollY = window.scrollY;
  let scrollDirection: 'up' | 'down' | null = null;
  
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    if (!ticking) {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        // Determine scroll direction
        if (currentScrollY > lastScrollY) {
          scrollDirection = 'down';
        } else if (currentScrollY < lastScrollY) {
          scrollDirection = 'up';
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
      });
      
      ticking = true;
    }
  };
  
  // Add passive scroll listener for best performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Optimize on route changes
  const observer = new MutationObserver(() => {
    requestAnimationFrame(applyScrollOptimizations);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
    observer.disconnect();
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  };
};

/**
 * Optimize touch scrolling for mobile devices
 */
export const optimizeTouchScroll = () => {
  let touchStartY = 0;
  let touchStartX = 0;
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const diffY = touchY - touchStartY;
    const diffX = touchX - touchStartX;
    
    // Determine if vertical scroll
    if (Math.abs(diffY) > Math.abs(diffX)) {
      // Allow native scroll
      return;
    }
  };
  
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
  };
};

/**
 * Apply momentum-based scroll physics
 */
export const applyMomentumScroll = (element: HTMLElement) => {
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.backfaceVisibility = 'hidden';
  (element.style as any).webkitOverflowScrolling = 'touch';
  element.style.overscrollBehavior = 'contain';
  element.style.scrollBehavior = 'smooth';
};

/**
 * Optimize scroll containers for 120fps
 */
export const optimize120fpsScroll = () => {
  // Get all scrollable elements
  const scrollables = document.querySelectorAll(
    '[class*="overflow"], [class*="scroll"], .scroll-area'
  );
  
  scrollables.forEach((element) => {
    const el = element as HTMLElement;
    applyMomentumScroll(el);
  });
};

/**
 * Initialize all 120fps scroll optimizations
 */
export const initialize120fpsScrolling = () => {
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeUltraSmoothScroll();
      optimizeTouchScroll();
      optimize120fpsScroll();
    });
  } else {
    initializeUltraSmoothScroll();
    optimizeTouchScroll();
    optimize120fpsScroll();
  }
  
  // Re-optimize after images load
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      optimize120fpsScroll();
    });
  });
};
