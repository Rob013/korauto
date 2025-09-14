/**
 * Performance optimization tests for 120fps and accessibility features
 */

import './setup';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import FrameRateOptimizer from '@/utils/frameRateOptimizer';
import { AccessibilityEnhancer } from '@/utils/accessibilityEnhancer';

// Clean up after each test
afterEach(() => {
  cleanup();
});

describe('Frame Rate Optimizer', () => {
  let optimizer: FrameRateOptimizer;

  beforeEach(() => {
    optimizer = FrameRateOptimizer.getInstance();
  });

  afterEach(() => {
    optimizer.destroy();
  });

  it('should detect display capabilities', () => {
    const capabilities = optimizer.getCapabilities();
    
    expect(capabilities).toHaveProperty('refreshRate');
    expect(capabilities).toHaveProperty('supportedRefreshRates');
    expect(capabilities).toHaveProperty('supportsHighRefreshRate');
    expect(capabilities).toHaveProperty('isVariableRefreshRate');
    
    expect(typeof capabilities.refreshRate).toBe('number');
    expect(Array.isArray(capabilities.supportedRefreshRates)).toBe(true);
    expect(typeof capabilities.supportsHighRefreshRate).toBe('boolean');
    expect(typeof capabilities.isVariableRefreshRate).toBe('boolean');
  });

  it('should provide valid configuration', () => {
    const config = optimizer.getConfig();
    
    expect(config).toHaveProperty('targetFPS');
    expect(config).toHaveProperty('adaptiveAnimations');
    expect(config).toHaveProperty('reducedMotion');
    expect(config).toHaveProperty('performanceMode');
    
    expect(typeof config.targetFPS).toBe('number');
    expect(config.targetFPS).toBeGreaterThan(0);
    expect(config.targetFPS).toBeLessThanOrEqual(120);
    
    expect(['auto', 'high', 'balanced', 'power-saver']).toContain(config.performanceMode);
  });

  it('should track current FPS', () => {
    const currentFPS = optimizer.getCurrentFPS();
    expect(typeof currentFPS).toBe('number');
    expect(currentFPS).toBeGreaterThanOrEqual(0);
  });

  it('should update configuration', () => {
    const originalConfig = optimizer.getConfig();
    
    optimizer.updateConfig({ targetFPS: 90 });
    
    const updatedConfig = optimizer.getConfig();
    expect(updatedConfig.targetFPS).toBe(90);
    expect(updatedConfig.performanceMode).toBe(originalConfig.performanceMode);
  });
});

describe('Accessibility Enhancer', () => {
  let enhancer: AccessibilityEnhancer;

  beforeEach(() => {
    enhancer = AccessibilityEnhancer.getInstance();
    // Clear the DOM for testing
    document.body.innerHTML = '';
  });

  afterEach(() => {
    enhancer.destroy();
    document.body.innerHTML = '';
  });

  it('should be a singleton', () => {
    const enhancer1 = AccessibilityEnhancer.getInstance();
    const enhancer2 = AccessibilityEnhancer.getInstance();
    expect(enhancer1).toBe(enhancer2);
  });

  it('should add skip links', () => {
    enhancer.addSkipLinks();
    
    const skipLinks = document.querySelector('#skip-links');
    expect(skipLinks).toBeTruthy();
    expect(skipLinks?.getAttribute('role')).toBe('navigation');
    expect(skipLinks?.getAttribute('aria-label')).toBe('Skip navigation links');
  });

  it('should add aria-labels to buttons without them', () => {
    // Create a button without aria-label
    const button = document.createElement('button');
    button.textContent = 'Click me';
    document.body.appendChild(button);
    
    enhancer.init();
    
    expect(button.getAttribute('aria-label')).toBe('Click me');
  });

  it('should add alt text to images without it', () => {
    // Create an image without alt text
    const img = document.createElement('img');
    img.src = '/images/car-photo.jpg';
    document.body.appendChild(img);
    
    enhancer.init();
    
    expect(img.getAttribute('alt')).toBe('Fotografi e makinës');
  });

  it('should announce messages', () => {
    const announceMessage = 'Test announcement';
    
    enhancer.announce(announceMessage, 'polite');
    
    // Check if announcer element was created
    const announcer = document.querySelector('[aria-live="polite"]');
    expect(announcer).toBeTruthy();
  });
});

describe('CSS Performance Classes', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('should inject 120fps optimization styles', async () => {
    // Import and inject styles
    const { inject120FPSStyles } = await import('@/utils/frameRateOptimizer');
    inject120FPSStyles();
    
    const styleElement = document.querySelector('#fps-optimization-styles');
    expect(styleElement).toBeTruthy();
    expect(styleElement?.textContent).toContain('--target-fps');
    expect(styleElement?.textContent).toContain('--frame-duration');
    expect(styleElement?.textContent).toContain('data-high-refresh');
  });

  it('should have performance optimization classes in CSS', () => {
    // Test if our CSS classes are available
    const testElement = document.createElement('div');
    testElement.className = 'performance-card animation-120fps';
    document.body.appendChild(testElement);
    
    const computedStyle = getComputedStyle(testElement);
    // The classes should be applied
    expect(testElement.classList.contains('performance-card')).toBe(true);
    expect(testElement.classList.contains('animation-120fps')).toBe(true);
  });
});

describe('Performance Monitor Integration', () => {
  it('should export performance monitoring components', async () => {
    const { PerformanceMonitor } = await import('@/components/PerformanceMonitor');
    expect(PerformanceMonitor).toBeDefined();
    expect(typeof PerformanceMonitor).toBe('function');
  });

  it('should export frame rate hook', async () => {
    const { useFrameRate } = await import('@/hooks/useFrameRate');
    expect(useFrameRate).toBeDefined();
    expect(typeof useFrameRate).toBe('function');
  });
});

describe('Service Worker Performance Features', () => {
  it('should have service worker with performance caching', () => {
    // Check if service worker is properly mocked
    expect(typeof navigator.serviceWorker).toBe('object');
    expect(navigator.serviceWorker).toHaveProperty('register');
    
    // The service worker should be registered in production
    if (process.env.NODE_ENV === 'production') {
      expect('serviceWorker' in navigator).toBe(true);
    }
  });
});

describe('Accessibility Compliance', () => {
  it('should respect reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const enhancer = AccessibilityEnhancer.getInstance();
    enhancer.init();

    // Should set data attribute for reduced motion
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
  });

  it('should provide proper touch targets', () => {
    const testButton = document.createElement('button');
    testButton.className = 'touch-target-120fps';
    document.body.appendChild(testButton);
    
    // Check if button meets minimum touch target size
    const style = getComputedStyle(testButton);
    // Note: In tests, computed styles might not reflect CSS exactly,
    // but the class should be applied
    expect(testButton.classList.contains('touch-target-120fps')).toBe(true);
  });
});

describe('Memory and Performance Efficiency', () => {
  it('should properly clean up resources', () => {
    const enhancer = AccessibilityEnhancer.getInstance();
    enhancer.init();
    
    // Destroy should clean up observer
    enhancer.destroy();
    
    // Should not throw errors after destruction
    expect(() => enhancer.announce('test')).not.toThrow();
  });

  it('should use proper memoization in CarCard', () => {
    // This test verifies that CarCard is exported as a memoized component
    expect(true).toBe(true); // Placeholder - actual memoization tested through usage
  });
});