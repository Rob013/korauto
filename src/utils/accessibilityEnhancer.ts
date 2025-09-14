/**
 * Enhanced Accessibility Enhancement Utility
 * Automatically applies accessibility improvements with performance optimizations
 */

import { debounce, throttle } from './performance';

export class AccessibilityEnhancer {
  private static instance: AccessibilityEnhancer;
  private observer: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private enhancedElements = new WeakSet<Element>();
  private isEnhancing = false;

  public static getInstance(): AccessibilityEnhancer {
    if (!AccessibilityEnhancer.instance) {
      AccessibilityEnhancer.instance = new AccessibilityEnhancer();
    }
    return AccessibilityEnhancer.instance;
  }

  /**
   * Initialize accessibility enhancements with performance optimizations
   */
  public init(): void {
    // Defer non-critical enhancements
    requestIdleCallback(() => {
      this.enhanceExistingElements();
      this.setupMutationObserver();
      this.addKeyboardNavigation();
      this.improveFocusManagement();
      this.addScreenReaderEnhancements();
      this.setupLiveRegions();
      this.enhanceFormAccessibility();
    }, { timeout: 5000 });
  }

  /**
   * Enhanced existing elements with batch processing for better performance
   */
  private enhanceExistingElements(): void {
    if (this.isEnhancing) return;
    this.isEnhancing = true;

    const elements = document.querySelectorAll('button, img, a, input, select, textarea, [role], [aria-label]');
    
    // Process in chunks to avoid blocking the main thread
    const chunkSize = 20;
    let index = 0;

    const processChunk = () => {
      const endIndex = Math.min(index + chunkSize, elements.length);
      
      for (let i = index; i < endIndex; i++) {
        if (!this.enhancedElements.has(elements[i])) {
          this.enhanceElement(elements[i]);
          this.enhancedElements.add(elements[i]);
        }
      }
      
      index = endIndex;
      
      if (index < elements.length) {
        // Use requestIdleCallback for non-blocking processing
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processChunk, { timeout: 2000 });
        } else {
          setTimeout(processChunk, 5);
        }
      } else {
        this.isEnhancing = false;
      }
    };

    processChunk();
  }

  /**
   * Setup optimized mutation observer for dynamic content
   */
  private setupMutationObserver(): void {
    if (this.observer) return;

    // Debounce mutations to avoid excessive processing
    const debouncedEnhance = debounce(() => {
      this.enhanceExistingElements();
    }, 300);

    this.observer = new MutationObserver((mutations) => {
      let shouldEnhance = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldEnhance = true;
              break;
            }
          }
        }
        if (shouldEnhance) break;
      }
      
      if (shouldEnhance) {
        debouncedEnhance();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // Don't watch attributes for performance
      characterData: false
    });
  }

  /**
   * Enhanced element enhancement with better performance and more comprehensive features
   */
  private enhanceElement(element: Element): void {
    if (this.enhancedElements.has(element)) return;

    const tagName = element.tagName.toLowerCase();
    
    // Handle buttons
    if (tagName === 'button' && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      const text = element.textContent?.trim() || element.getAttribute('title');
      if (text) {
        element.setAttribute('aria-label', text);
      }
      
      // Add role if missing
      if (!element.getAttribute('role')) {
        element.setAttribute('role', 'button');
      }
    }

    // Handle images with enhanced alt text generation
    if (tagName === 'img' && !element.getAttribute('alt')) {
      const src = element.getAttribute('src') || '';
      const className = element.className || '';
      
      let altText = '';
      if (src.includes('logo') || className.includes('logo')) {
        altText = 'KORAUTO Logo';
      } else if (src.includes('car') || className.includes('car')) {
        altText = 'Fotografi e makinës';
      } else if (src.includes('icon') || className.includes('icon')) {
        altText = 'Ikonë';
      } else if (src.includes('avatar') || className.includes('avatar')) {
        altText = 'Avatar i përdoruesit';
      } else {
        altText = 'Imazh';
      }
      
      element.setAttribute('alt', altText);
      
      // Add loading attribute for performance
      if (!element.getAttribute('loading')) {
        element.setAttribute('loading', 'lazy');
      }
    }

    // Handle links
    if (tagName === 'a' && !element.getAttribute('aria-label')) {
      const text = element.textContent?.trim();
      const href = element.getAttribute('href');
      
      if (text) {
        element.setAttribute('aria-label', text);
      } else if (href) {
        element.setAttribute('aria-label', `Link: ${href}`);
      }
      
      // Add external link indicators
      if (href && (href.startsWith('http') && !href.includes(window.location.hostname))) {
        element.setAttribute('aria-label', `${element.getAttribute('aria-label')} (hapet në dritare të re)`);
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noopener noreferrer');
      }
    }

    // Handle form inputs
    if (['input', 'select', 'textarea'].includes(tagName)) {
      this.enhanceFormElement(element as HTMLFormElement);
    }

    // Add focus enhancement class
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
      element.classList.add('focus-enhanced');
    }

    this.enhancedElements.add(element);
  }

  /**
   * Enhanced form accessibility
   */
  private enhanceFormElement(element: HTMLFormElement): void {
    // Associate labels with inputs
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      const label = document.querySelector(`label[for="${element.id}"]`) as HTMLLabelElement;
      if (label) {
        element.setAttribute('aria-labelledby', element.id + '-label');
        label.id = element.id + '-label';
      } else {
        const placeholder = element.getAttribute('placeholder');
        if (placeholder) {
          element.setAttribute('aria-label', placeholder);
        }
      }
    }

    // Add aria-required for required fields
    if (element.hasAttribute('required') && !element.getAttribute('aria-required')) {
      element.setAttribute('aria-required', 'true');
    }

    // Add aria-invalid for validation
    if (element.classList.contains('error') || element.classList.contains('invalid')) {
      element.setAttribute('aria-invalid', 'true');
    }
  }

  /**
   * Enhanced keyboard navigation with more shortcuts
   */
  private addKeyboardNavigation(): void {
    const keyboardHandler = throttle((e: KeyboardEvent) => {
      // Skip to main content with Alt+M
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main) {
          (main as HTMLElement).focus();
          main.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // Focus search with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
        if (searchInput) {
          (searchInput as HTMLElement).focus();
        }
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]:not([hidden])');
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="close" i], [data-dismiss], .close');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        }
      }

      // Arrow key navigation for lists and grids
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    }, 100);

    document.addEventListener('keydown', keyboardHandler);
  }

  /**
   * Handle arrow key navigation for better accessibility
   */
  private handleArrowNavigation(e: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    const parent = activeElement.closest('[role="grid"], [role="listbox"], [role="menu"], [role="tablist"]');
    if (!parent) return;

    e.preventDefault();
    
    const focusableElements = Array.from(
      parent.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
    }

    if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
    }
  }

  /**
   * Enhanced focus management with performance optimizations
   */
  private improveFocusManagement(): void {
    // Add focus trap for modals
    const focusTrapHandler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]:not([hidden])');
        if (modal) {
          this.trapFocus(e, modal);
        }
      }
    };

    document.addEventListener('keydown', focusTrapHandler);

    // Enhanced focus styles
    if (!document.getElementById('accessibility-styles')) {
      const style = document.createElement('style');
      style.id = 'accessibility-styles';
      style.textContent = `
        /* Enhanced focus management */
        .focus-enhanced:focus-visible {
          outline: 3px solid hsl(var(--ring)) !important;
          outline-offset: 2px !important;
          border-radius: 4px !important;
          box-shadow: 0 0 0 6px hsl(var(--ring) / 0.2) !important;
          transition: box-shadow 0.15s ease-in-out !important;
        }
        
        /* Screen reader only content */
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        
        .sr-only-focusable:focus {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: 0.5rem !important;
          margin: 0 !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: normal !important;
          background: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border: 2px solid hsl(var(--ring)) !important;
          border-radius: 0.375rem !important;
          z-index: 9999 !important;
        }

        /* High contrast support */
        @media (prefers-contrast: high) {
          .focus-enhanced:focus-visible {
            outline: 3px solid currentColor !important;
            background: hsl(var(--background)) !important;
            color: hsl(var(--foreground)) !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .focus-enhanced:focus-visible {
            transition: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Add screen reader enhancements
   */
  private addScreenReaderEnhancements(): void {
    // Add landmark roles where missing
    if (!document.querySelector('main, [role="main"]')) {
      const mainContent = document.querySelector('#main, .main-content, .content-main');
      if (mainContent) {
        mainContent.setAttribute('role', 'main');
      }
    }

    // Add navigation role to nav elements
    document.querySelectorAll('nav:not([role])').forEach(nav => {
      nav.setAttribute('role', 'navigation');
    });

    // Add banner role to header
    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }

    // Add contentinfo role to footer
    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }
  }

  /**
   * Setup live regions for dynamic content announcements
   */
  private setupLiveRegions(): void {
    // Create polite live region if it doesn't exist
    if (!document.getElementById('live-region-polite')) {
      const politeRegion = document.createElement('div');
      politeRegion.id = 'live-region-polite';
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
    }

    // Create assertive live region for important announcements
    if (!document.getElementById('live-region-assertive')) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.id = 'live-region-assertive';
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
    }
  }

  /**
   * Enhanced form accessibility
   */
  private enhanceFormAccessibility(): void {
    // Add form validation enhancements
    document.querySelectorAll('form').forEach(form => {
      if (!form.getAttribute('novalidate')) {
        form.addEventListener('submit', (e) => {
          const invalidFields = form.querySelectorAll(':invalid');
          if (invalidFields.length > 0) {
            e.preventDefault();
            (invalidFields[0] as HTMLElement).focus();
            this.announceMessage('Ju lutem ndreqni gabimet në formular përpara se të vazhdoni.', 'assertive');
          }
        });
      }
    });

    // Enhanced error handling
    document.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('invalid', () => {
        const fieldName = field.getAttribute('aria-label') || field.getAttribute('name') || 'field';
        this.announceMessage(`Gabim në ${fieldName}`, 'assertive');
      });
    });
  }

  /**
   * Announce message to screen readers
   */
  public announceMessage(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const regionId = priority === 'polite' ? 'live-region-polite' : 'live-region-assertive';
    const region = document.getElementById(regionId);
    
    if (region) {
      region.textContent = message;
      
      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Enhanced focus trapping for modals
   */
  private trapFocus(e: KeyboardEvent, modal: Element): void {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Add skip links for better navigation
   */
  public addSkipLinks(): void {
    if (document.getElementById('skip-links')) return;

    const skipLinks = document.createElement('div');
    skipLinks.id = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main" class="sr-only-focusable">Kalo te përmbajtja kryesore</a>
      <a href="#navigation" class="sr-only-focusable">Kalo te navigimi</a>
      <a href="#search" class="sr-only-focusable">Kalo te kërkimi</a>
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Cleanup with performance considerations
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear enhanced elements set
    this.enhancedElements = new WeakSet();
    this.isEnhancing = false;
  }
}

// Auto-initialize when script loads with performance optimization
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for non-blocking initialization
  const initializeAccessibility = () => {
    const enhancer = AccessibilityEnhancer.getInstance();
    enhancer.init();
    enhancer.addSkipLinks();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initializeAccessibility, { timeout: 3000 });
      } else {
        setTimeout(initializeAccessibility, 100);
      }
    });
  } else {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initializeAccessibility, { timeout: 3000 });
    } else {
      setTimeout(initializeAccessibility, 100);
    }
  }
}