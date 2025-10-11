/**
 * Minimal runtime to improve perceived smoothness without changing functionality.
 * - Sets data attributes during scroll and touch to allow CSS to soften effects.
 * - Uses passive listeners and requestAnimationFrame for throttling.
 */

let initialized = false;

export function initSmoothRuntime() {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  initialized = true;

  const root = document.documentElement;

  let scrollRaf = 0 as number | 0;
  let scrollTimeout = 0 as number | 0;

  const clearScrollState = () => {
    root.removeAttribute('data-scrolling');
  };

  const onScroll = () => {
    if (scrollRaf) cancelAnimationFrame(scrollRaf as number);
    root.setAttribute('data-scrolling', 'true');
    scrollRaf = requestAnimationFrame(() => {
      if (scrollTimeout) window.clearTimeout(scrollTimeout as number);
      // Keep the flag briefly after last frame to avoid rapid toggling
      scrollTimeout = window.setTimeout(clearScrollState, 120);
    });
  };

  // Touch state for iOS-like responsiveness
  let touchTimeout = 0 as number | 0;
  const clearTouchState = () => root.removeAttribute('data-touching');

  const onTouchStart = () => {
    root.setAttribute('data-touching', 'true');
    if (touchTimeout) window.clearTimeout(touchTimeout as number);
  };

  const onTouchEnd = () => {
    if (touchTimeout) window.clearTimeout(touchTimeout as number);
    touchTimeout = window.setTimeout(clearTouchState, 120);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
}

export default initSmoothRuntime;


