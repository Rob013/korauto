export interface AccessibilityIssue {
  element: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  wcagLevel: 'A' | 'AA' | 'AAA';
  suggested_fix: string;
  position?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface AccessibilityMetrics {
  overallScore: number;
  issues: AccessibilityIssue[];
  passedChecks: number;
  totalChecks: number;
}

export class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim() !== '');
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  private getElementPosition(element: Element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Check for missing alt text on images
   */
  private checkImageAltText(): void {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt || img.alt.trim() === '') {
        this.issues.push({
          element: this.getElementSelector(img),
          issue: 'Missing alt text for screen readers',
          severity: 'high',
          wcagLevel: 'A',
          suggested_fix: 'Add descriptive alt text that explains the content and purpose of the image',
          position: this.getElementPosition(img)
        });
      }
    });
  }

  /**
   * Check for proper heading hierarchy
   */
  private checkHeadingHierarchy(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (lastLevel > 0 && currentLevel > lastLevel + 1) {
        this.issues.push({
          element: this.getElementSelector(heading),
          issue: `Heading level skips from h${lastLevel} to h${currentLevel}`,
          severity: 'medium',
          wcagLevel: 'AA',
          suggested_fix: `Use proper heading hierarchy (h${lastLevel + 1} instead of h${currentLevel})`,
          position: this.getElementPosition(heading)
        });
      }
      
      lastLevel = currentLevel;
    });
  }

  /**
   * Check for proper link text (no "click here" or empty links)
   */
  private checkLinkText(): void {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      const text = link.textContent?.trim().toLowerCase() || '';
      const ariaLabel = link.getAttribute('aria-label') || '';
      
      if (!text && !ariaLabel) {
        this.issues.push({
          element: this.getElementSelector(link),
          issue: 'Link has no accessible text',
          severity: 'high',
          wcagLevel: 'A',
          suggested_fix: 'Add descriptive text or aria-label to explain where the link goes',
          position: this.getElementPosition(link)
        });
      } else if (['click here', 'read more', 'here', 'more'].includes(text)) {
        this.issues.push({
          element: this.getElementSelector(link),
          issue: 'Non-descriptive link text',
          severity: 'medium',
          wcagLevel: 'AA',
          suggested_fix: 'Use descriptive link text that explains the destination',
          position: this.getElementPosition(link)
        });
      }
    });
  }

  /**
   * Check for form labels
   */
  private checkFormLabels(): void {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.id;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const placeholder = input.getAttribute('placeholder');
      
      let hasLabel = false;
      
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) hasLabel = true;
      }
      
      if (ariaLabel || ariaLabelledBy) hasLabel = true;
      
      if (!hasLabel && input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
        this.issues.push({
          element: this.getElementSelector(input),
          issue: 'Form control missing accessible label',
          severity: 'high',
          wcagLevel: 'A',
          suggested_fix: 'Add a label element or aria-label attribute',
          position: this.getElementPosition(input)
        });
      }
      
      // Check if only using placeholder as label
      if (!hasLabel && placeholder && input.type !== 'hidden') {
        this.issues.push({
          element: this.getElementSelector(input),
          issue: 'Using placeholder as only label',
          severity: 'medium',
          wcagLevel: 'AA',
          suggested_fix: 'Add a proper label in addition to placeholder text',
          position: this.getElementPosition(input)
        });
      }
    });
  }

  /**
   * Check for proper button labels
   */
  private checkButtonLabels(): void {
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      const text = button.textContent?.trim() || '';
      const ariaLabel = button.getAttribute('aria-label') || '';
      const title = button.getAttribute('title') || '';
      
      if (!text && !ariaLabel && !title) {
        this.issues.push({
          element: this.getElementSelector(button),
          issue: 'Button has no accessible text',
          severity: 'high',
          wcagLevel: 'A',
          suggested_fix: 'Add descriptive text, aria-label, or title attribute',
          position: this.getElementPosition(button)
        });
      }
    });
  }

  /**
   * Check for sufficient color contrast
   */
  private checkColorContrast(): void {
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // This is a simplified check - in practice you'd want to use a proper contrast ratio calculation
      if (color === backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
        this.issues.push({
          element: this.getElementSelector(element),
          issue: 'Insufficient color contrast',
          severity: 'medium',
          wcagLevel: 'AA',
          suggested_fix: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)',
          position: this.getElementPosition(element)
        });
      }
    });
  }

  /**
   * Check for proper focus indicators
   */
  private checkFocusIndicators(): void {
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element, ':focus');
      const outline = computedStyle.outline;
      const boxShadow = computedStyle.boxShadow;
      
      if (outline === 'none' && (!boxShadow || boxShadow === 'none')) {
        this.issues.push({
          element: this.getElementSelector(element),
          issue: 'Missing focus indicator',
          severity: 'medium',
          wcagLevel: 'AA',
          suggested_fix: 'Add visible focus indicator (outline, box-shadow, or border change)',
          position: this.getElementPosition(element)
        });
      }
    });
  }

  /**
   * Check for proper touch targets (minimum 44px)
   */
  private checkTouchTargets(): void {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick]'
    );
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG recommended minimum
      
      if (rect.width < minSize || rect.height < minSize) {
        this.issues.push({
          element: this.getElementSelector(element),
          issue: `Touch target too small (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
          severity: 'medium',
          wcagLevel: 'AAA',
          suggested_fix: `Ensure touch targets are at least ${minSize}x${minSize}px`,
          position: this.getElementPosition(element)
        });
      }
    });
  }

  /**
   * Check for proper semantic landmarks
   */
  private checkSemanticLandmarks(): void {
    const hasMain = document.querySelector('main, [role="main"]');
    const hasNav = document.querySelector('nav, [role="navigation"]');
    const hasHeader = document.querySelector('header, [role="banner"]');
    const hasFooter = document.querySelector('footer, [role="contentinfo"]');
    
    if (!hasMain) {
      this.issues.push({
        element: 'document',
        issue: 'Missing main landmark',
        severity: 'medium',
        wcagLevel: 'AA',
        suggested_fix: 'Add <main> element or role="main" to identify main content area'
      });
    }
    
    if (!hasNav) {
      this.issues.push({
        element: 'document',
        issue: 'Missing navigation landmark',
        severity: 'low',
        wcagLevel: 'AAA',
        suggested_fix: 'Add <nav> element or role="navigation" to identify navigation areas'
      });
    }
  }

  /**
   * Check for proper language declaration
   */
  private checkLanguageDeclaration(): void {
    const html = document.documentElement;
    const lang = html.getAttribute('lang');
    
    if (!lang || lang.trim() === '') {
      this.issues.push({
        element: 'html',
        issue: 'Missing language declaration',
        severity: 'medium',
        wcagLevel: 'A',
        suggested_fix: 'Add lang attribute to <html> element (e.g., lang="en")'
      });
    }
  }

  /**
   * Run comprehensive accessibility audit
   */
  public async runAccessibilityAudit(): Promise<AccessibilityMetrics> {
    this.issues = []; // Reset issues
    
    console.log('🔍 Starting comprehensive accessibility audit...');
    
    // Run all accessibility checks
    this.checkImageAltText();
    this.checkHeadingHierarchy();
    this.checkLinkText();
    this.checkFormLabels();
    this.checkButtonLabels();
    this.checkColorContrast();
    this.checkFocusIndicators();
    this.checkTouchTargets();
    this.checkSemanticLandmarks();
    this.checkLanguageDeclaration();
    
    const totalChecks = 10; // Number of check categories
    const passedChecks = totalChecks - this.issues.length;
    
    // Calculate score based on severity
    let score = 100;
    this.issues.forEach(issue => {
      switch (issue.severity) {
        case 'high': score -= 15; break;
        case 'medium': score -= 8; break;
        case 'low': score -= 3; break;
      }
    });
    
    const overallScore = Math.max(0, score);
    
    console.log(`📊 Accessibility audit results: ${this.issues.length} issues found, score: ${overallScore}/100`);
    
    return {
      overallScore,
      issues: this.issues,
      passedChecks,
      totalChecks
    };
  }

  /**
   * Generate accessibility report
   */
  public generateAccessibilityReport(metrics: AccessibilityMetrics): string {
    let report = `
🔍 KORAUTO Accessibility Audit Report
====================================

📈 Overall Score: ${metrics.overallScore.toFixed(1)}/100
📊 Checks Passed: ${metrics.passedChecks}/${metrics.totalChecks}

🔍 Issues Found: ${metrics.issues.length}
`;

    if (metrics.issues.length > 0) {
      report += '\n⚠️ Issues to Fix:\n';
      metrics.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.element}: ${issue.issue} (${issue.severity} - WCAG ${issue.wcagLevel})\n`;
        report += `   💡 Fix: ${issue.suggested_fix}\n\n`;
      });
    }

    report += '\n📝 Accessibility Recommendations:\n';
    
    if (metrics.overallScore < 90) {
      report += '- Overall accessibility needs improvement\n';
    }
    
    const highIssues = metrics.issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) {
      report += '- Fix high severity issues first (critical for screen readers)\n';
    }
    
    const mediumIssues = metrics.issues.filter(i => i.severity === 'medium');
    if (mediumIssues.length > 0) {
      report += '- Address medium severity issues for better usability\n';
    }
    
    return report;
  }

  /**
   * Apply automatic fixes for common accessibility issues
   */
  public async applyAccessibilityFixes(issues: AccessibilityIssue[]): Promise<number> {
    let fixedCount = 0;
    
    for (const issue of issues) {
      try {
        const element = document.querySelector(issue.element);
        if (!element) continue;
        
        switch (issue.issue) {
          case 'Missing alt text for screen readers':
            if (element.tagName === 'IMG') {
              (element as HTMLImageElement).alt = 'Car image';
              fixedCount++;
            }
            break;
            
          case 'Button has no accessible text':
            if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label')) {
              element.setAttribute('aria-label', 'Button');
              fixedCount++;
            }
            break;
            
          case 'Missing language declaration':
            if (element.tagName === 'HTML') {
              element.setAttribute('lang', 'en');
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
}

// Quick accessibility audit function
export async function runQuickAccessibilityAudit(): Promise<AccessibilityMetrics> {
  const auditor = new AccessibilityAuditor();
  return await auditor.runAccessibilityAudit();
}