/**
 * Ultra-smooth 120fps scroll optimization utilities
 * Optimized for high refresh rate displays and mobile devices
 */

let ultraSmoothCleanup: (() => void) | null = null;
let touchScrollCleanup: (() => void) | null = null;
let scrollingInitialized = false;
let pageHideCleanupRegistered = false;
const activeCleanups: Array<() => void> = [];

/**
 * Passive scroll listener for 120fps performance
 */
export const initializeUltraSmoothScroll = () => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (ultraSmoothCleanup) {
    return ultraSmoothCleanup;
  }

  let rafId: number | null = null;
  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      ticking = true;
      rafId = window.requestAnimationFrame(() => {
        ticking = false;
      });
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  ultraSmoothCleanup = () => {
    window.removeEventListener('scroll', handleScroll);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    ticking = false;
    ultraSmoothCleanup = null;
  };

  return ultraSmoothCleanup;
};

/**
 * Optimize touch scrolling for mobile devices
 */
export const optimizeTouchScroll = () => {
  if (typeof document === 'undefined') {
    return () => {};
  }

  if (touchScrollCleanup) {
    return touchScrollCleanup;
  }

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

  touchScrollCleanup = () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    touchScrollCleanup = null;
  };

  return touchScrollCleanup;
};

/**
 * Apply momentum-based scroll physics
 */
export const applyMomentumScroll = (element: HTMLElement) => {
  element.dataset.momentumScroll = 'true';
};

/**
 * Optimize scroll containers for 120fps
 */
export const optimize120fpsScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  // Get all scrollable elements
  const scrollables = document.querySelectorAll(
    '[class*="overflow"], [class*="scroll"], .scroll-area'
  );
  
  scrollables.forEach((element) => {
    const el = element as HTMLElement;
    if (el.dataset.momentumScroll !== 'true') {
      applyMomentumScroll(el);
    }
  });
};

/**
 * Initialize all 120fps scroll optimizations
 */
export const initialize120fpsScrolling = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const run = () => {
    if (!scrollingInitialized) {
      const cleanupFns: Array<() => void> = [];

      const smoothCleanup = initializeUltraSmoothScroll();
      if (typeof smoothCleanup === 'function') {
        cleanupFns.push(smoothCleanup);
      }

      const touchCleanup = optimizeTouchScroll();
      if (typeof touchCleanup === 'function') {
        cleanupFns.push(touchCleanup);
      }

      activeCleanups.splice(0, activeCleanups.length, ...cleanupFns);
      scrollingInitialized = true;
      registerPageHideCleanup();
    }

    optimize120fpsScroll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  if (typeof window !== 'undefined' && !loadHandlerRegistered) {
    window.addEventListener(
      'load',
      () => {
        requestAnimationFrame(() => {
          optimize120fpsScroll();
        });
      },
      { once: true }
    );
    loadHandlerRegistered = true;
  }
};

let loadHandlerRegistered = false;

const registerPageHideCleanup = () => {
  if (typeof window === 'undefined' || pageHideCleanupRegistered) {
    return;
  }

  window.addEventListener(
    'pagehide',
    () => {
      activeCleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch {
          // no-op
        }
      });
      activeCleanups.length = 0;
      scrollingInitialized = false;
      pageHideCleanupRegistered = false;
    },
    { once: true }
  );

  pageHideCleanupRegistered = true;
};
