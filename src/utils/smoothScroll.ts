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
 * Momentum scrolling helper for iOS
 */
export const enableMomentumScrolling = (element: HTMLElement) => {
  (element.style as any).webkitOverflowScrolling = 'touch';
  element.style.overflowY = 'auto';
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
