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
      } else if (src.includes('car')) {
        element.setAttribute('alt', 'Fotografi e makinës');
      } else {
        element.setAttribute('alt', 'Imazh');
      }
    }

    // Handle links without aria-label
    if (element.tagName === 'A' && !element.getAttribute('aria-label')) {
      const text = element.textContent?.trim();
      if (text) {
        element.setAttribute('aria-label', text);
      }
    }

    // Recursively enhance child elements
    element.querySelectorAll('button, img, a, input').forEach((child) => {
      this.enhanceElement(child);
    });
  }

  /**
   * Add keyboard navigation enhancements
   */
  private addKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
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
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"]');
        if (searchInput) {
          (searchInput as HTMLElement).focus();
        }
      }
    });
  }

  /**
   * Improve focus management
   */
  private improveFocusManagement(): void {
    // Add focus trap for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]:not([hidden])');
        if (modal) {
          this.trapFocus(e, modal);
        }
      }
    });

    // Ensure visible focus indicators
    const style = document.createElement('style');
    style.textContent = `
      *:focus-visible {
        outline: 2px solid hsl(var(--ring)) !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }
      
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
    `;
    document.head.appendChild(style);
  }

  /**
   * Trap focus within a modal
   */
  private trapFocus(e: KeyboardEvent, modal: Element): void {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Add skip links for better navigation
   */
  public addSkipLinks(): void {
    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'sr-only';
    skipLinksContainer.innerHTML = `
      <a href="#main" class="skip-link">Kalo në përmbajtjen kryesore</a>
      <a href="#navigation" class="skip-link">Kalo në navigim</a>
    `;

    // Style skip links to be visible when focused
    const style = document.createElement('style');
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        padding: 8px;
        z-index: 1000;
        text-decoration: none;
        border-radius: 4px;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}