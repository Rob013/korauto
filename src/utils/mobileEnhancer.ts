/**
 * Mobile Enhancement Utilities
 * iOS-inspired touch interactions and gestures
 */

/**
 * Initialize mobile enhancements
 */
export const initMobileEnhancers = () => {
  if (typeof window === 'undefined') return;

  // Add iOS-style momentum scrolling
  (document.documentElement.style as any).webkitOverflowScrolling = 'touch';
  
  // Prevent iOS bounce effect on body
  document.body.style.overscrollBehavior = 'none';
  
  // Add touch event listeners for better feedback
  addTouchFeedback();
  
  // Optimize scroll performance
  optimizeScrollPerformance();
  
  // Add pull-to-refresh hint
  addPullToRefreshHint();
};

/**
 * Add visual feedback for touch interactions
 */
const addTouchFeedback = () => {
  let touchStartTime: number;
  let touchElement: HTMLElement | null = null;

  document.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    const target = e.target as HTMLElement;
    
    // Only add feedback to interactive elements
    if (
      target.matches('button, a, [role="button"], .card-hover, .hover-lift, .hover-lift-gentle')
    ) {
      touchElement = target;
      target.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
      target.style.transform = 'scale(0.97) translateZ(0)';
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (touchElement) {
      const touchDuration = Date.now() - touchStartTime;
      
      // Animate back with slight bounce for quick taps
      if (touchDuration < 150) {
        touchElement.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      } else {
        touchElement.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
      }
      
      touchElement.style.transform = 'scale(1) translateZ(0)';
      touchElement = null;
    }
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    if (touchElement) {
      touchElement.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
      touchElement.style.transform = 'scale(1) translateZ(0)';
      touchElement = null;
    }
  }, { passive: true });
};

/**
 * Optimize scroll performance with requestAnimationFrame
 */
const optimizeScrollPerformance = () => {
  let ticking = false;
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Add scroll state to document for CSS hooks
        if (lastScrollY > 50) {
          document.documentElement.setAttribute('data-scrolled', 'true');
        } else {
          document.documentElement.removeAttribute('data-scrolled');
        }
        
        ticking = false;
      });

      ticking = true;
    }
  }, { passive: true });
};

/**
 * Add subtle pull-to-refresh hint
 */
const addPullToRefreshHint = () => {
  let startY = 0;
  let currentY = 0;
  let pulling = false;

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      pulling = false;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0) {
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 80 && !pulling) {
        pulling = true;
        // Visual feedback could be added here
        navigator.vibrate?.(10);
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (pulling) {
      pulling = false;
      // Refresh logic would go here
    }
    startY = 0;
    currentY = 0;
  }, { passive: true });
};

/**
 * Add haptic feedback for supported devices
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 5,
      medium: 10,
      heavy: 15
    };
    navigator.vibrate(patterns[type]);
  }
};

/**
 * Smooth scroll to element with iOS-like easing
 */
export const smoothScrollTo = (element: HTMLElement | string, offset: number = 0) => {
  const target = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
    
  if (!target) return;

  const targetPosition = (target as HTMLElement).getBoundingClientRect().top + window.scrollY - offset;
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  const duration = 800;
  let start: number | null = null;

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animation = (currentTime: number) => {
    if (start === null) start = currentTime;
    const timeElapsed = currentTime - start;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

export default initMobileEnhancers;