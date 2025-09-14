/**
 * Accessibility Enhancement Utility
 * Automatically applies accessibility improvements to the website
 */

export class AccessibilityEnhancer {
  private static instance: AccessibilityEnhancer;
  private observer: MutationObserver | null = null;

  public static getInstance(): AccessibilityEnhancer {
    if (!AccessibilityEnhancer.instance) {
      AccessibilityEnhancer.instance = new AccessibilityEnhancer();
    }
    return AccessibilityEnhancer.instance;
  }

  /**
   * Initialize accessibility enhancements
   */
  public init(): void {
    this.enhanceExistingElements();
    this.setupMutationObserver();
    this.addKeyboardNavigation();
    this.improveFocusManagement();
    this.improveColorContrast();
    this.setupReducedMotionSupport();
  }

  /**
   * Setup reduced motion support
   */
  private setupReducedMotionSupport(): void {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const applyReducedMotion = (matches: boolean) => {
      document.documentElement.setAttribute('data-reduced-motion', matches.toString());
    };
    
    applyReducedMotion(reducedMotionQuery.matches);
    reducedMotionQuery.addEventListener('change', (e) => applyReducedMotion(e.matches));
  }

  /**
   * Enhance a specific element
   */
  private enhanceElement(element: Element): void {
    // Handle buttons
    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label')) {
      const text = element.textContent?.trim();
      if (text) {
        element.setAttribute('aria-label', text);
      }
    }

    // Handle images
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      const src = element.getAttribute('src') || '';
      if (src.includes('logo')) {
        element.setAttribute('alt', 'KORAUTO Logo');
      } else if (src.includes('car') || src.includes('vehicle')) {
        element.setAttribute('alt', 'Fotografi e makinës');
      } else {
        element.setAttribute('alt', 'Imazh');
      }
    }

    // Handle links
    if (element.tagName === 'A' && !element.getAttribute('aria-label')) {
      const text = element.textContent?.trim();
      if (text && text.length < 3) {
        // Short link text, needs better description
        element.setAttribute('aria-label', `Link: ${text}`);
      }
    }

    // Handle form controls
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      const placeholder = element.getAttribute('placeholder');
      const label = element.getAttribute('aria-label');
      
      if (placeholder && !label) {
        element.setAttribute('aria-label', placeholder);
      }
    }
  }

  /**
   * Enhance existing elements on the page
   */
  private enhanceExistingElements(): void {
    // Add ARIA labels to buttons without them
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach((button) => {
      if (button.textContent?.trim()) {
        button.setAttribute('aria-label', button.textContent.trim());
      }
    });

    // Add alt text to images without it
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.includes('logo')) {
        img.setAttribute('alt', 'KORAUTO Logo');
      } else if (src.includes('car') || src.includes('vehicle')) {
        img.setAttribute('alt', 'Fotografi e makinës');
      } else {
        img.setAttribute('alt', 'Imazh');
      }
    });

    // Add role and aria-label to navigation elements
    const navElements = document.querySelectorAll('nav:not([role])');
    navElements.forEach((nav) => {
      nav.setAttribute('role', 'navigation');
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', 'Navigimi i faqes');
      }
    });

    // Ensure form inputs have labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach((input) => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', placeholder);
      }
    });
  }

  /**
   * Setup mutation observer to handle dynamically added content
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.enhanceElement(node as Element);
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Add skip navigation links for keyboard users
   */
  public addSkipLinks(): void {
    // Remove existing skip links to avoid duplicates
    const existingSkipLinks = document.querySelector('#skip-links');
    if (existingSkipLinks) {
      existingSkipLinks.remove();
    }

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.id = 'skip-links';
    skipLinksContainer.setAttribute('role', 'navigation');
    skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');
    skipLinksContainer.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      z-index: 1000;
      display: flex;
      gap: 8px;
    `;

    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#search', text: 'Skip to search' },
      { href: '#footer', text: 'Skip to footer' }
    ];

    skipLinks.forEach(({ href, text }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      link.className = 'skip-link';
      link.style.cssText = `
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        transition: transform 0.2s ease;
        transform: translateY(-100%);
        opacity: 0;
      `;

      // Show on focus
      link.addEventListener('focus', () => {
        link.style.transform = 'translateY(0)';
        link.style.opacity = '1';
        skipLinksContainer.style.top = '6px';
      });

      // Hide on blur
      link.addEventListener('blur', () => {
        link.style.transform = 'translateY(-100%)';
        link.style.opacity = '0';
        skipLinksContainer.style.top = '-40px';
      });

      skipLinksContainer.appendChild(link);
    });

    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Improve keyboard navigation throughout the site
   */
  private addKeyboardNavigation(): void {
    // Add escape key handler for modals and overlays
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        // Close any open modals, dropdowns, or overlays
        const modals = document.querySelectorAll('[role="dialog"]:not([hidden])');
        modals.forEach((modal) => {
          const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"], .close-button');
          if (closeButton && closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        });

        // Close dropdowns
        const dropdowns = document.querySelectorAll('[data-state="open"]');
        dropdowns.forEach((dropdown) => {
          if (dropdown instanceof HTMLElement) {
            dropdown.click();
          }
        });
      }
    });

    // Enhanced tab navigation
    let lastFocusedElement: Element | null = null;
    
    document.addEventListener('focusin', (event) => {
      lastFocusedElement = event.target as Element;
      
      // Add visible focus indicator
      if (event.target instanceof HTMLElement) {
        event.target.style.outline = '2px solid hsl(var(--ring))';
        event.target.style.outlineOffset = '2px';
      }
    });

    document.addEventListener('focusout', (event) => {
      // Remove custom focus indicator
      if (event.target instanceof HTMLElement) {
        event.target.style.outline = '';
        event.target.style.outlineOffset = '';
      }
    });

    // Arrow key navigation for lists and grids
    document.addEventListener('keydown', (event) => {
      const { key } = event;
      const target = event.target as HTMLElement;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        // Handle grid navigation
        if (target.closest('[role="grid"], .grid, .car-grid')) {
          event.preventDefault();
          this.handleGridNavigation(target, key);
        }
        
        // Handle list navigation
        if (target.closest('[role="listbox"], [role="menu"], ul')) {
          event.preventDefault();
          this.handleListNavigation(target, key);
        }
      }
    });
  }

  private handleGridNavigation(currentElement: HTMLElement, key: string): void {
    const grid = currentElement.closest('[role="grid"], .grid, .car-grid') as HTMLElement;
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('a, button, [tabindex="0"]')) as HTMLElement[];
    const currentIndex = items.indexOf(currentElement);
    
    if (currentIndex === -1) return;

    // Estimate grid columns based on layout
    const gridStyle = getComputedStyle(grid);
    const gridColumns = gridStyle.gridTemplateColumns.split(' ').length;
    
    let nextIndex = currentIndex;
    
    switch (key) {
      case 'ArrowLeft':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        nextIndex = Math.min(items.length - 1, currentIndex + 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(0, currentIndex - gridColumns);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(items.length - 1, currentIndex + gridColumns);
        break;
    }
    
    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
    }
  }

  private handleListNavigation(currentElement: HTMLElement, key: string): void {
    const list = currentElement.closest('[role="listbox"], [role="menu"], ul') as HTMLElement;
    if (!list) return;

    const items = Array.from(list.querySelectorAll('a, button, [role="option"], [role="menuitem"], li')) as HTMLElement[];
    const currentIndex = items.indexOf(currentElement);
    
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    
    switch (key) {
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
    }
    
    if (items[nextIndex]) {
      items[nextIndex].focus();
    }
  }

  /**
   * Improve focus management for better accessibility
   */
  private improveFocusManagement(): void {
    // Focus trap for modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]:not([hidden])') as HTMLElement;
        if (modal) {
          this.trapFocus(modal, event);
        }
      }
    });

    // Restore focus when modals close
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.hasAttribute('role') && node.getAttribute('role') === 'dialog') {
            // Modal was removed, restore focus
            const lastFocused = document.querySelector('[data-last-focused]') as HTMLElement;
            if (lastFocused) {
              lastFocused.focus();
              lastFocused.removeAttribute('data-last-focused');
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    ) as NodeListOf<HTMLElement>;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        event.preventDefault();
      }
    }
  }

  /**
   * Add screen reader announcements for dynamic content
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(announcer);
    
    // Small delay to ensure screen reader picks up the announcement
    setTimeout(() => {
      announcer.textContent = message;
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
    }, 100);
  }

  /**
   * Check and improve color contrast
   */
  private improveColorContrast(): void {
    // Add high contrast mode detection
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const applyHighContrast = (matches: boolean) => {
      document.documentElement.setAttribute('data-high-contrast', matches.toString());
      
      if (matches) {
        // Enhance contrast for high contrast mode
        const style = document.createElement('style');
        style.id = 'high-contrast-styles';
        style.textContent = `
          [data-high-contrast="true"] {
            --foreground: 0 0% 0%;
            --background: 0 0% 100%;
            --muted-foreground: 0 0% 20%;
            --border: 0 0% 30%;
          }
          
          [data-high-contrast="true"].dark {
            --foreground: 0 0% 100%;
            --background: 0 0% 0%;
            --muted-foreground: 0 0% 80%;
            --border: 0 0% 70%;
          }
        `;
        
        const existingStyle = document.head.querySelector('#high-contrast-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.head.appendChild(style);
      }
    };
    
    applyHighContrast(highContrastQuery.matches);
    highContrastQuery.addEventListener('change', (e) => applyHighContrast(e.matches));
  }

  /**
   * Enhance a specific element
   */
  private enhanceElement(element: Element): void {
    // Handle buttons
    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label')) {
      const text = element.textContent?.trim();
      if (text) {
        element.setAttribute('aria-label', text);
      }
    }

    // Handle images
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      const src = element.getAttribute('src') || '';
      if (src.includes('logo')) {
        element.setAttribute('alt', 'KORAUTO Logo');
      } else if (src.includes('car') || src.includes('vehicle')) {
        element.setAttribute('alt', 'Fotografi e makinës');
      } else {
        element.setAttribute('alt', 'Imazh');
      }
    }

    // Handle links
    if (element.tagName === 'A' && !element.getAttribute('aria-label')) {
      const text = element.textContent?.trim();
      if (text && text.length < 3) {
        // Short link text, needs better description
        element.setAttribute('aria-label', `Link: ${text}`);
      }
    }

    // Handle form controls
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      const placeholder = element.getAttribute('placeholder');
      const label = element.getAttribute('aria-label');
      
      if (placeholder && !label) {
        element.setAttribute('aria-label', placeholder);
      }
    }
  }

  /**
   * Destroy the accessibility enhancer
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
