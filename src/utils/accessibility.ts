// Comprehensive accessibility utilities and enhancements
export interface AccessibilityConfig {
  announcements?: boolean;
  skipLinks?: boolean;
  focusManagement?: boolean;
  colorContrast?: boolean;
  keyboardNavigation?: boolean;
}

export interface AccessibilityIssue {
  element: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  wcagLevel: 'A' | 'AA' | 'AAA';
  guideline: string;
  suggestedFix: string;
}

export class AccessibilityAuditor {
  private config: AccessibilityConfig;
  private announcer: HTMLElement | null = null;

  constructor(config: AccessibilityConfig = {}) {
    this.config = {
      announcements: true,
      skipLinks: true,
      focusManagement: true,
      colorContrast: true,
      keyboardNavigation: true,
      ...config
    };
    
    this.initialize();
  }

  private initialize() {
    if (this.config.announcements) {
      this.createScreenReaderAnnouncer();
    }
    
    if (this.config.skipLinks) {
      this.addSkipLinks();
    }
    
    if (this.config.focusManagement) {
      this.enhanceFocusManagement();
    }
    
    if (this.config.keyboardNavigation) {
      this.enhanceKeyboardNavigation();
    }
  }

  /**
   * Create screen reader announcer for dynamic content
   */
  private createScreenReaderAnnouncer() {
    if (this.announcer) return;
    
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('aria-label', 'Screen reader announcements');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce text to screen readers
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcer) {
      this.createScreenReaderAnnouncer();
    }
    
    if (this.announcer) {
      this.announcer.setAttribute('aria-live', priority);
      this.announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.announcer) {
          this.announcer.textContent = '';
        }
      }, 1000);
    }
  }

  /**
   * Add skip navigation links
   */
  private addSkipLinks() {
    const skipNav = document.createElement('nav');
    skipNav.className = 'skip-nav';
    skipNav.setAttribute('aria-label', 'Skip navigation');
    skipNav.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;
    
    // Insert at the beginning of body
    document.body.insertBefore(skipNav, document.body.firstChild);
  }

  /**
   * Enhance focus management
   */
  private enhanceFocusManagement() {
    // Add focus visible styles
    const style = document.createElement('style');
    style.textContent = `
      .focus-visible {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 8px;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.2s;
      }
      
      .skip-link:focus {
        top: 8px;
      }
      
      [tabindex="-1"]:focus {
        outline: none !important;
      }
      
      .focus-trap {
        position: relative;
      }
      
      .focus-trap:focus-within {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
    
    // Handle focus trapping for modals
    this.setupFocusTrapping();
  }

  /**
   * Setup focus trapping for modal dialogs
   */
  private setupFocusTrapping() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          this.trapFocus(e, modal as HTMLElement);
        }
      }
    });
  }

  /**
   * Trap focus within an element
   */
  private trapFocus(e: KeyboardEvent, container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  }

  /**
   * Enhance keyboard navigation
   */
  private enhanceKeyboardNavigation() {
    // Add keyboard handlers for custom components
    document.addEventListener('keydown', (e) => {
      // Arrow key navigation for grids and lists
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const target = e.target as HTMLElement;
        if (target?.getAttribute('role') === 'gridcell' || 
            target?.closest('[role="grid"]') ||
            target?.closest('.car-grid')) {
          this.handleArrowNavigation(e);
        }
      }
      
      // Enter/Space for buttons and clickable elements
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target?.getAttribute('role') === 'button' && 
            !target.matches('button, input, textarea, select')) {
          target.click();
          e.preventDefault();
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="close"], [data-close]') as HTMLElement;
          closeButton?.click();
        }
      }
    });
  }

  /**
   * Handle arrow key navigation in grids
   */
  private handleArrowNavigation(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const grid = target.closest('[role="grid"], .car-grid');
    if (!grid) return;
    
    const cells = Array.from(grid.querySelectorAll('[role="gridcell"], .car-card')) as HTMLElement[];
    const currentIndex = cells.indexOf(target);
    
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    const columns = this.getGridColumns(grid as HTMLElement);
    
    switch (e.key) {
      case 'ArrowRight':
        newIndex = Math.min(currentIndex + 1, cells.length - 1);
        break;
      case 'ArrowLeft':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + columns, cells.length - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - columns, 0);
        break;
    }
    
    if (newIndex !== currentIndex) {
      cells[newIndex]?.focus();
      e.preventDefault();
    }
  }

  /**
   * Get number of columns in a grid
   */
  private getGridColumns(grid: HTMLElement): number {
    const style = window.getComputedStyle(grid);
    const columns = style.gridTemplateColumns;
    
    if (columns && columns !== 'none') {
      return columns.split(' ').length;
    }
    
    // Fallback: calculate from first row
    const firstRow = grid.children[0];
    if (firstRow) {
      const rect = firstRow.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      return Math.round(gridRect.width / rect.width);
    }
    
    return 1;
  }

  /**
   * Run comprehensive accessibility audit
   */
  public async runAccessibilityAudit(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing alt text
    this.checkImages(issues);
    
    // Check for proper heading hierarchy
    this.checkHeadingHierarchy(issues);
    
    // Check for ARIA labels
    this.checkAriaLabels(issues);
    
    // Check for keyboard accessibility
    this.checkKeyboardAccessibility(issues);
    
    // Check for color contrast (basic check)
    this.checkColorContrast(issues);
    
    // Check for form labels
    this.checkFormLabels(issues);
    
    // Check for landmarks
    this.checkLandmarks(issues);
    
    return issues;
  }

  private checkImages(issues: AccessibilityIssue[]) {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-hidden')) {
        issues.push({
          element: this.getElementSelector(img),
          issue: 'Image missing alt text',
          severity: 'high',
          wcagLevel: 'A',
          guideline: '1.1.1 Non-text Content',
          suggestedFix: 'Add descriptive alt text or aria-label, or aria-hidden if decorative'
        });
      }
    });
  }

  private checkHeadingHierarchy(issues: AccessibilityIssue[]) {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1]);
      
      if (level > lastLevel + 1) {
        issues.push({
          element: this.getElementSelector(heading),
          issue: `Heading level ${level} skips from ${lastLevel}`,
          severity: 'medium',
          wcagLevel: 'AA',
          guideline: '1.3.1 Info and Relationships',
          suggestedFix: 'Use proper heading hierarchy without skipping levels'
        });
      }
      
      lastLevel = level;
    });
  }

  private checkAriaLabels(issues: AccessibilityIssue[]) {
    // Check buttons without accessible names
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      const hasText = button.textContent?.trim();
      const hasLabel = button.getAttribute('aria-label');
      const hasLabelledBy = button.getAttribute('aria-labelledby');
      
      if (!hasText && !hasLabel && !hasLabelledBy) {
        issues.push({
          element: this.getElementSelector(button),
          issue: 'Button has no accessible name',
          severity: 'critical',
          wcagLevel: 'A',
          guideline: '4.1.2 Name, Role, Value',
          suggestedFix: 'Add text content, aria-label, or aria-labelledby'
        });
      }
    });

    // Check links without accessible names
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      const hasText = link.textContent?.trim();
      const hasLabel = link.getAttribute('aria-label');
      
      if (!hasText && !hasLabel) {
        issues.push({
          element: this.getElementSelector(link),
          issue: 'Link has no accessible name',
          severity: 'critical',
          wcagLevel: 'A',
          guideline: '2.4.4 Link Purpose',
          suggestedFix: 'Add descriptive text or aria-label'
        });
      }
    });
  }

  private checkKeyboardAccessibility(issues: AccessibilityIssue[]) {
    const interactiveElements = document.querySelectorAll('[onclick], [role="button"]:not(button)');
    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      
      if (tabIndex !== '0' && !element.matches('button, input, select, textarea, a[href]')) {
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Interactive element not keyboard accessible',
          severity: 'high',
          wcagLevel: 'A',
          guideline: '2.1.1 Keyboard',
          suggestedFix: 'Add tabindex="0" and keyboard event handlers'
        });
      }
    });
  }

  private checkColorContrast(issues: AccessibilityIssue[]) {
    // Basic contrast check - would need more sophisticated analysis for full compliance
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
    
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // Simple check for gray text which often has contrast issues
      if (color.includes('rgb(107') || color.includes('rgb(156') || color.includes('#6b')) {
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Potentially insufficient color contrast',
          severity: 'medium',
          wcagLevel: 'AA',
          guideline: '1.4.3 Contrast (Minimum)',
          suggestedFix: 'Verify color contrast ratio meets 4.5:1 minimum'
        });
      }
    });
  }

  private checkFormLabels(issues: AccessibilityIssue[]) {
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push({
          element: this.getElementSelector(input),
          issue: 'Form control has no associated label',
          severity: 'high',
          wcagLevel: 'A',
          guideline: '3.3.2 Labels or Instructions',
          suggestedFix: 'Add a label element or aria-label'
        });
      }
    });
  }

  private checkLandmarks(issues: AccessibilityIssue[]) {
    const hasMain = document.querySelector('main, [role="main"]');
    const hasNav = document.querySelector('nav, [role="navigation"]');
    
    if (!hasMain) {
      issues.push({
        element: 'document',
        issue: 'No main landmark found',
        severity: 'medium',
        wcagLevel: 'AA',
        guideline: '1.3.1 Info and Relationships',
        suggestedFix: 'Add <main> element or role="main"'
      });
    }
    
    if (!hasNav) {
      issues.push({
        element: 'document',
        issue: 'No navigation landmark found',
        severity: 'low',
        wcagLevel: 'AA',
        guideline: '1.3.1 Info and Relationships',
        suggestedFix: 'Add <nav> element or role="navigation"'
      });
    }
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim() !== '');
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  /**
   * Apply automatic fixes for accessibility issues
   */
  public async applyAutoFixes(issues: AccessibilityIssue[]): Promise<number> {
    let fixedCount = 0;
    
    for (const issue of issues) {
      try {
        const element = document.querySelector(issue.element);
        if (!element) continue;
        
        switch (issue.issue) {
          case 'Image missing alt text':
            if (element.tagName === 'IMG') {
              (element as HTMLImageElement).alt = 'Car image';
              fixedCount++;
            }
            break;
            
          case 'Interactive element not keyboard accessible':
            element.setAttribute('tabindex', '0');
            element.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                (element as HTMLElement).click();
                e.preventDefault();
              }
            });
            fixedCount++;
            break;
            
          case 'Button has no accessible name':
            if (!element.getAttribute('aria-label')) {
              element.setAttribute('aria-label', 'Button');
              fixedCount++;
            }
            break;
        }
      } catch (e) {
        console.warn(`Failed to auto-fix accessibility issue for ${issue.element}:`, e);
      }
    }
    
    return fixedCount;
  }

  /**
   * Generate accessibility report
   */
  public generateReport(issues: AccessibilityIssue[]): string {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');
    
    const totalScore = Math.max(0, 100 - (
      criticalIssues.length * 25 +
      highIssues.length * 15 +
      mediumIssues.length * 10 +
      lowIssues.length * 5
    ));

    return `
♿ KORAUTO Accessibility Audit Report
====================================

🎯 Accessibility Score: ${totalScore}/100

📊 Issues by Severity:
- Critical: ${criticalIssues.length}
- High: ${highIssues.length}  
- Medium: ${mediumIssues.length}
- Low: ${lowIssues.length}

📋 WCAG Compliance:
- Level A: ${issues.filter(i => i.wcagLevel === 'A').length} issues
- Level AA: ${issues.filter(i => i.wcagLevel === 'AA').length} issues
- Level AAA: ${issues.filter(i => i.wcagLevel === 'AAA').length} issues

${issues.length > 0 ? '⚠️ Issues Found:\n' + issues.map((issue, index) => 
  `${index + 1}. ${issue.element}: ${issue.issue} (${issue.severity})\n   WCAG ${issue.wcagLevel}: ${issue.guideline}\n   💡 Fix: ${issue.suggestedFix}\n`
).join('\n') : '✅ No accessibility issues found!'}
`;
  }

  /**
   * Clean up
   */
  public destroy() {
    if (this.announcer) {
      this.announcer.remove();
    }
  }
}

// Export utility functions
export const createAccessibilityAuditor = (config?: AccessibilityConfig) => 
  new AccessibilityAuditor(config);

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const auditor = new AccessibilityAuditor();
  auditor.announce(message, priority);
};

export default AccessibilityAuditor;