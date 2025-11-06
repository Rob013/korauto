/**
 * Smooth scroll utilities for better mobile and desktop UX
 */

/**
 * Enhanced smooth scroll with easing
 */
export const smoothScrollTo = (targetY: number, duration: number = 600) => {
  const startY = window.scrollY;
  const diff = targetY - startY;
  const startTime = performance.now();

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 
      ? 4 * t * t * t 
      : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  const scroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startY + diff * ease);

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};

/**
 * Smooth scroll to element with offset
 */
export const smoothScrollToElement = (
  element: HTMLElement,
  offset: number = 0,
  duration: number = 600
) => {
  const targetY = element.getBoundingClientRect().top + window.scrollY - offset;
  smoothScrollTo(targetY, duration);
};

/**
 * Prevent scroll jank during transitions
 */
export const lockScroll = () => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
};

/**
 * Re-enable scrolling
 */
export const unlockScroll = () => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

/**
 * Momentum scrolling helper for iOS with GPU acceleration
 */
export const enableMomentumScrolling = (element: HTMLElement) => {
  (element.style as any).webkitOverflowScrolling = 'touch';
  element.style.overflowY = 'auto';
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.overscrollBehavior = 'contain';
};

/**
 * Enable GPU acceleration for smooth animations
 */
export const enableGPUAcceleration = (element: HTMLElement) => {
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
};

/**
 * Apply smooth scrolling to container
 */
export const applyMomentumScrolling = (element: HTMLElement) => {
  (element.style as any).webkitOverflowScrolling = 'touch';
  element.style.overscrollBehavior = 'contain';
  element.style.scrollBehavior = 'smooth';
};

/**
 * Restore scroll position with smooth animation
 */
export const restoreScrollPosition = (
  position: number,
  immediate: boolean = false
): void => {
  const behavior = immediate ? 'auto' : 'smooth';
  
  // Small delay to ensure content is rendered
  requestAnimationFrame(() => {
    window.scrollTo({
      top: position,
      left: 0,
      behavior,
    });
  });
};

/**
 * Debounced scroll handler for performance
 */
export const createScrollHandler = (
  callback: () => void,
  delay: number = 100
) => {
  let timeoutId: NodeJS.Timeout;
  let isScrolling = false;

  return () => {
    if (!isScrolling) {
      isScrolling = true;
      requestAnimationFrame(() => {
        callback();
        isScrolling = false;
      });
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback();
    }, delay);
  };
};
