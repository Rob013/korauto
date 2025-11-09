/**
 * Anti-flicker utilities for Apple-like smoothness
 * Prevents FOUC, layout shifts, and visual glitches
 */

let initialized = false;
let imageObserver: MutationObserver | null = null;
let pageHideCleanupRegistered = false;

/**
 * Initialize anti-flicker optimizations
 * Call this as early as possible in app initialization
 */
export function initAntiFlicker() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Prevent theme flash on load
  const theme = localStorage.getItem('korauto-ui-theme') || 
                localStorage.getItem('vite-ui-theme');
  
  if (theme && theme !== 'system') {
    document.documentElement.classList.add(theme);
  } else {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
    document.documentElement.classList.add(systemTheme);
  }

  // Mark page as loaded after initial render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add('loaded');
    });
  });

  // Optimize image loading to prevent layout shifts
  optimizeImageLoading();

  // Add smooth transitions after content is stable
  stabilizeContent();

  registerPageHideCleanup();
}

/**
 * Optimize image loading to prevent layout shifts
 */
function optimizeImageLoading() {
  if (typeof document === 'undefined') {
    return;
  }

  const { body } = document;

  if (!body) {
    return;
  }

  if (!imageObserver) {
    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      if (!img.decoding) {
        img.decoding = 'async';
      }
    });

    imageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            if (!node.loading) {
              node.loading = 'lazy';
            }
            if (!node.decoding) {
              node.decoding = 'async';
            }
          }
        });
      });
    });

    imageObserver.observe(body, {
      childList: true,
      subtree: true
    });
  }
}

/**
 * Stabilize content to prevent shifts
 */
function stabilizeContent() {
  // Use IntersectionObserver for smooth content reveal
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    // Observe elements that should fade in
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      revealObserver.observe(el);
    });
  }
}

function registerPageHideCleanup() {
  if (typeof window === 'undefined' || pageHideCleanupRegistered) {
    return;
  }

  window.addEventListener(
    'pagehide',
    () => {
      imageObserver?.disconnect();
      imageObserver = null;
      pageHideCleanupRegistered = false;
    },
    { once: true }
  );

  pageHideCleanupRegistered = true;
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload fonts
  const fonts = [
    // Add your font URLs here if needed
  ];

  fonts.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Prevent layout shift from images
 */
export function preventImageShift(img: HTMLImageElement) {
  if (!img.complete) {
    const aspectRatio = img.dataset.aspectRatio || '16/9';
    img.style.aspectRatio = aspectRatio;
    img.style.objectFit = 'cover';
  }
}

/**
 * Smooth transition helper
 */
export function smoothTransition(
  element: HTMLElement,
  callback: () => void,
  duration = 300
) {
  element.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  element.style.opacity = '0';

  requestAnimationFrame(() => {
    callback();
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  });

  setTimeout(() => {
    element.style.transition = '';
  }, duration);
}

export default initAntiFlicker;
