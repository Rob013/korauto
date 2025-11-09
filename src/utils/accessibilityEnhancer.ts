/**
 * Accessibility Enhancement Utility
 * Provides lightweight, non-intrusive accessibility helpers that can be safely
 * enabled across the application.
 */

export class AccessibilityEnhancer {
  private static instance: AccessibilityEnhancer;
  private initialized = false;
  private reducedMotionQuery: MediaQueryList | null = null;
  private reducedMotionHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private reducedMotionLegacyListener: ((event: MediaQueryListEvent | MediaQueryList) => void) | null = null;
  private highContrastQuery: MediaQueryList | null = null;
  private highContrastHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private highContrastLegacyListener: ((event: MediaQueryListEvent | MediaQueryList) => void) | null = null;
  private highContrastStyle: HTMLStyleElement | null = null;
  private skipLinksContainer: HTMLElement | null = null;

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
    if (typeof document === 'undefined' || this.initialized) {
      return;
    }

    this.initialized = true;

    this.ensureDocumentLanguage();
    this.ensureLandmarkIds();
    this.enhanceExistingElements();
    this.setupReducedMotionSupport();
    this.improveColorContrast();
  }

  private ensureDocumentLanguage(): void {
    if (!document.documentElement.hasAttribute('lang')) {
      const language = typeof navigator !== 'undefined' && navigator.language
        ? navigator.language.split('-')[0]
        : 'en';
      document.documentElement.setAttribute('lang', language);
    }
  }

  private ensureLandmarkIds(): void {
    if (!document.querySelector('#main-content')) {
      const main = document.querySelector<HTMLElement>('main, [role="main"]');
      if (main && !main.id) {
        main.id = 'main-content';
      }
    }

    if (!document.querySelector('#navigation')) {
      const navigation = document.querySelector<HTMLElement>('nav, [role="navigation"]');
      if (navigation && !navigation.id) {
        navigation.id = 'navigation';
      }
    }

    if (!document.querySelector('#footer')) {
      const footer = document.querySelector<HTMLElement>('footer');
      if (footer && !footer.id) {
        footer.id = 'footer';
      }
    }
  }

  private enhanceExistingElements(): void {
    const navElements = document.querySelectorAll<HTMLElement>('nav');
    navElements.forEach((nav, index) => {
      if (!nav.hasAttribute('role')) {
        nav.setAttribute('role', 'navigation');
      }
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', index === 0 ? 'Main navigation' : 'Site navigation');
      }
    });

    const mainElement = document.querySelector<HTMLElement>('main');
    if (mainElement && !mainElement.hasAttribute('role')) {
      mainElement.setAttribute('role', 'main');
    }
  }

  private setupReducedMotionSupport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyReducedMotion = (matches: boolean) => {
      if (matches) {
        document.documentElement.setAttribute('data-reduced-motion', 'true');
      } else {
        document.documentElement.removeAttribute('data-reduced-motion');
      }
    };

    applyReducedMotion(this.reducedMotionQuery.matches);

    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      applyReducedMotion('matches' in event ? event.matches : this.reducedMotionQuery?.matches ?? false);
    };

    if (typeof this.reducedMotionQuery.addEventListener === 'function') {
      this.reducedMotionHandler = onChange as (event: MediaQueryListEvent) => void;
      this.reducedMotionQuery.addEventListener('change', this.reducedMotionHandler);
    } else if (typeof this.reducedMotionQuery.addListener === 'function') {
      this.reducedMotionLegacyListener = onChange;
      this.reducedMotionQuery.addListener(this.reducedMotionLegacyListener);
    }
  }

  private improveColorContrast(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const ensureStyle = () => {
      if (!this.highContrastStyle) {
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
        document.head.appendChild(style);
        this.highContrastStyle = style;
      }
    };

    const applyHighContrast = (matches: boolean) => {
      if (matches) {
        document.documentElement.setAttribute('data-high-contrast', 'true');
        ensureStyle();
      } else {
        document.documentElement.removeAttribute('data-high-contrast');
        if (this.highContrastStyle) {
          this.highContrastStyle.remove();
          this.highContrastStyle = null;
        }
      }
    };

    applyHighContrast(this.highContrastQuery.matches);

    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      applyHighContrast('matches' in event ? event.matches : this.highContrastQuery?.matches ?? false);
    };

    if (typeof this.highContrastQuery.addEventListener === 'function') {
      this.highContrastHandler = onChange as (event: MediaQueryListEvent) => void;
      this.highContrastQuery.addEventListener('change', this.highContrastHandler);
    } else if (typeof this.highContrastQuery.addListener === 'function') {
      this.highContrastLegacyListener = onChange;
      this.highContrastQuery.addListener(this.highContrastLegacyListener);
    }
  }

  /**
   * Add skip navigation links for keyboard users
   */
  public addSkipLinks(): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (this.skipLinksContainer) {
      this.skipLinksContainer.remove();
      this.skipLinksContainer = null;
    }

    this.ensureLandmarkIds();

    const container = document.createElement('div');
    container.id = 'skip-links';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', 'Skip navigation links');
    container.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      z-index: 1000;
      display: flex;
      gap: 8px;
    `;

    const links = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#footer', text: 'Skip to footer' }
    ];

    links.forEach(({ href, text }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      link.style.cssText = `
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        transition: transform 0.2s ease, opacity 0.2s ease;
        transform: translateY(-100%);
        opacity: 0;
      `;

      link.addEventListener('focus', () => {
        link.style.transform = 'translateY(0)';
        link.style.opacity = '1';
        container.style.top = '6px';
      });

      link.addEventListener('blur', () => {
        link.style.transform = 'translateY(-100%)';
        link.style.opacity = '0';
        container.style.top = '-40px';
      });

      container.appendChild(link);
    });

    document.body.insertBefore(container, document.body.firstChild);
    this.skipLinksContainer = container;
  }

  /**
   * Add screen reader announcements for dynamic content
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof document === 'undefined') {
      return;
    }

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
    
    window.setTimeout(() => {
      announcer.textContent = message;
      
      window.setTimeout(() => {
        announcer.remove();
      }, 1000);
    }, 100);
  }

  /**
   * Destroy the accessibility enhancer and clean up resources
   */
  public destroy(): void {
    if (!this.initialized) {
      return;
    }

    if (this.reducedMotionQuery && this.reducedMotionHandler) {
      this.reducedMotionQuery.removeEventListener('change', this.reducedMotionHandler);
    }
    if (this.reducedMotionQuery && this.reducedMotionLegacyListener) {
      this.reducedMotionQuery.removeListener(this.reducedMotionLegacyListener);
    }
    this.reducedMotionQuery = null;
    this.reducedMotionHandler = null;
    this.reducedMotionLegacyListener = null;
    document.documentElement.removeAttribute('data-reduced-motion');

    if (this.highContrastQuery && this.highContrastHandler) {
      this.highContrastQuery.removeEventListener('change', this.highContrastHandler);
    }
    if (this.highContrastQuery && this.highContrastLegacyListener) {
      this.highContrastQuery.removeListener(this.highContrastLegacyListener);
    }
    this.highContrastQuery = null;
    this.highContrastHandler = null;
    this.highContrastLegacyListener = null;
    if (this.highContrastStyle) {
      this.highContrastStyle.remove();
      this.highContrastStyle = null;
    }
    document.documentElement.removeAttribute('data-high-contrast');

    if (this.skipLinksContainer) {
      this.skipLinksContainer.remove();
      this.skipLinksContainer = null;
    }

    this.initialized = false;
  }
}
