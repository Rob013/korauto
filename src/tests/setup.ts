/**
 * Test setup for performance and accessibility tests
 * Mocks browser APIs that aren't available in jsdom
 */

import { beforeAll, vi } from 'vitest';

// Mock browser APIs
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
  });

  // Mock cancelAnimationFrame
  global.cancelAnimationFrame = vi.fn();

  // Mock performance.now
  Object.defineProperty(performance, 'now', {
    writable: true,
    value: vi.fn(() => Date.now()),
  });

  // Mock navigator.serviceWorker
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: {
      register: vi.fn(() => Promise.resolve()),
      ready: Promise.resolve(),
      controller: null,
    },
  });

  // Mock navigator.connection
  Object.defineProperty(navigator, 'connection', {
    writable: true,
    value: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    },
  });

  // Mock navigator.hardwareConcurrency
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    writable: true,
    value: 4,
  });

  // Mock screen properties
  Object.defineProperty(screen, 'orientation', {
    writable: true,
    value: {
      angle: 0,
      type: 'portrait-primary',
    },
  });

  // Mock devicePixelRatio
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    value: 2,
  });

  // Mock HTMLElement for mutation observer
  if (typeof HTMLElement === 'undefined') {
    global.HTMLElement = class HTMLElement {
      tagName = 'DIV';
      textContent = '';
      getAttribute = vi.fn();
      setAttribute = vi.fn();
      classList = {
        contains: vi.fn(() => false),
        add: vi.fn(),
        remove: vi.fn(),
      };
    } as any;
  }

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  } as any;

  // Mock PerformanceObserver
  global.PerformanceObserver = class PerformanceObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  } as any;

  // Mock MutationObserver
  global.MutationObserver = class MutationObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  } as any;

  // Mock requestIdleCallback
  global.requestIdleCallback = vi.fn((cb) => {
    setTimeout(cb, 0);
    return 1;
  });

  // Mock CSS properties and styles
  Object.defineProperty(document.documentElement, 'style', {
    writable: true,
    value: {
      setProperty: vi.fn(),
      getProperty: vi.fn(),
    },
  });

  // Mock getComputedStyle
  global.getComputedStyle = vi.fn(() => ({
    getPropertyValue: vi.fn(),
    gridTemplateColumns: 'repeat(3, 1fr)',
  } as any));

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  });

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  });
});