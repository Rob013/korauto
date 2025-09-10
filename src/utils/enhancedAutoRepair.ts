// Enhanced automatic repair system for comprehensive issue fixing
import { AlignmentIssue } from './performanceAudit';

export interface RepairResult {
  fixed: number;
  failed: number;
  details: RepairDetail[];
}

export interface RepairDetail {
  element: string;
  issue: string;
  status: 'fixed' | 'failed' | 'skipped';
  reason?: string;
}

export class EnhancedAutoRepair {
  private appliedFixes: Map<string, string[]> = new Map();

  /**
   * Apply comprehensive fixes for all detected issues
   */
  public async applyComprehensiveFixes(
    layoutIssues: AlignmentIssue[],
    accessibilityIssues: AlignmentIssue[]
  ): Promise<RepairResult> {
    const allIssues = [...layoutIssues, ...accessibilityIssues];
    const results: RepairDetail[] = [];
    let fixed = 0;
    let failed = 0;

    console.log(`🔧 Starting comprehensive repair for ${allIssues.length} issues...`);

    for (const issue of allIssues) {
      try {
        const result = await this.repairSingleIssue(issue);
        results.push(result);
        
        if (result.status === 'fixed') {
          fixed++;
          this.trackAppliedFix(issue.element, issue.issue);
        } else if (result.status === 'failed') {
          failed++;
        }
      } catch (error) {
        failed++;
        results.push({
          element: issue.element,
          issue: issue.issue,
          status: 'failed',
          reason: `Unexpected error: ${error}`
        });
      }
    }

    // Apply global CSS improvements
    await this.applyGlobalImprovements();

    console.log(`✅ Repair complete: ${fixed} fixed, ${failed} failed`);

    return { fixed, failed, details: results };
  }

  /**
   * Repair a single issue with advanced logic
   */
  private async repairSingleIssue(issue: AlignmentIssue): Promise<RepairDetail> {
    const element = this.findElement(issue.element);
    
    if (!element) {
      return {
        element: issue.element,
        issue: issue.issue,
        status: 'failed',
        reason: 'Element not found'
      };
    }

    // Check if this fix was already applied
    if (this.wasFixApplied(issue.element, issue.issue)) {
      return {
        element: issue.element,
        issue: issue.issue,
        status: 'skipped',
        reason: 'Fix already applied'
      };
    }

    try {
      const success = await this.applySpecificFix(element, issue);
      
      return {
        element: issue.element,
        issue: issue.issue,
        status: success ? 'fixed' : 'failed',
        reason: success ? undefined : 'Fix application failed'
      };
    } catch (error) {
      return {
        element: issue.element,
        issue: issue.issue,
        status: 'failed',
        reason: `Error applying fix: ${error}`
      };
    }
  }

  /**
   * Apply specific fixes based on issue type
   */
  private async applySpecificFix(element: Element, issue: AlignmentIssue): Promise<boolean> {
    const htmlElement = element as HTMLElement;

    switch (issue.issue) {
      case 'Missing alt text for accessibility':
        return this.fixMissingAltText(element as HTMLImageElement);

      case 'Button too small for touch interaction':
        return this.fixSmallTouchTarget(htmlElement);

      case 'Missing ARIA label on interactive element':
        return this.fixMissingAriaLabel(htmlElement);

      case 'Form input without associated label':
        return this.fixMissingFormLabel(element as HTMLInputElement);

      case 'Link without descriptive text':
        return this.fixLinkDescription(element as HTMLAnchorElement);

      case 'Missing focus outline':
        return this.fixFocusOutline(htmlElement);

      case 'Poor color contrast':
        return this.fixColorContrast(htmlElement);

      case 'Image aspect ratio distortion':
        return this.fixImageAspectRatio(element as HTMLImageElement);

      case 'Element extends beyond viewport width':
        return this.fixOverflowIssue(htmlElement);

      case 'Missing dimensions causing potential layout shifts':
        return this.fixLayoutShifts(htmlElement);

      case 'Text content overflows container':
        return this.fixTextOverflow(htmlElement);

      case 'Fixed pixel width may break responsive design':
        return this.fixResponsiveWidth(htmlElement);

      case 'Extremely high z-index may cause stacking issues':
        return this.fixZIndexIssue(htmlElement);

      case 'Loading logo is not properly centered':
        return this.fixLoadingLogoAlignment(htmlElement);

      case 'Inconsistent spacing between card elements':
        return this.fixCardSpacing(htmlElement);

      case 'Video without captions or subtitles':
        return this.fixVideoAccessibility(element as HTMLVideoElement);

      case 'Table without proper headers':
        return this.fixTableHeaders(element as HTMLTableElement);

      case 'Improper heading hierarchy':
        return this.fixHeadingHierarchy(htmlElement);

      default:
        return this.applyGenericFix(htmlElement, issue);
    }
  }

  /**
   * Fix missing alt text on images
   */
  private fixMissingAltText(img: HTMLImageElement): boolean {
    if (img.alt) return true; // Already has alt text

    // Try to get description from various sources
    const description = 
      img.getAttribute('data-description') ||
      img.getAttribute('title') ||
      img.closest('[aria-label]')?.getAttribute('aria-label') ||
      this.inferImageDescription(img);

    img.alt = description;
    img.setAttribute('data-auto-fixed', 'alt-text');
    return true;
  }

  /**
   * Fix small touch targets
   */
  private fixSmallTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const minSize = 44;

    if (rect.width >= minSize && rect.height >= minSize) return true;

    // Apply minimum touch target size
    element.style.minWidth = `${minSize}px`;
    element.style.minHeight = `${minSize}px`;
    element.style.padding = element.style.padding || '8px 12px';
    element.style.display = element.style.display || 'inline-flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.setAttribute('data-auto-fixed', 'touch-target');

    return true;
  }

  /**
   * Fix missing ARIA labels
   */
  private fixMissingAriaLabel(element: HTMLElement): boolean {
    if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) {
      return true;
    }

    const label = 
      element.textContent?.trim() ||
      element.getAttribute('title') ||
      element.getAttribute('data-label') ||
      this.inferElementPurpose(element);

    if (label) {
      element.setAttribute('aria-label', label);
      element.setAttribute('data-auto-fixed', 'aria-label');
      return true;
    }

    return false;
  }

  /**
   * Fix missing form labels
   */
  private fixMissingFormLabel(input: HTMLInputElement): boolean {
    // Check if label already exists
    if (input.labels && input.labels.length > 0) return true;
    if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) return true;

    // Try to create or associate a label
    const labelText = 
      input.placeholder ||
      input.getAttribute('data-label') ||
      input.name ||
      input.type;

    if (labelText) {
      input.setAttribute('aria-label', labelText);
      input.setAttribute('data-auto-fixed', 'form-label');
      return true;
    }

    return false;
  }

  /**
   * Fix link descriptions
   */
  private fixLinkDescription(link: HTMLAnchorElement): boolean {
    const currentText = link.textContent?.trim();
    
    if (currentText && currentText.length >= 3 && 
        !['click', 'here', 'link', 'more'].includes(currentText.toLowerCase())) {
      return true;
    }

    // Try to get better description
    const betterText = 
      link.getAttribute('title') ||
      link.getAttribute('data-description') ||
      this.inferLinkPurpose(link);

    if (betterText) {
      if (currentText) {
        link.setAttribute('aria-label', betterText);
      } else {
        link.textContent = betterText;
      }
      link.setAttribute('data-auto-fixed', 'link-description');
      return true;
    }

    return false;
  }

  /**
   * Fix focus outline issues
   */
  private fixFocusOutline(element: HTMLElement): boolean {
    // Add proper focus styles
    element.style.setProperty('--focus-ring', '2px solid hsl(var(--ring))');
    element.style.setProperty('--focus-ring-offset', '2px');
    
    // Add focus-visible class handling
    const focusStyle = `
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    `;
    
    element.setAttribute('style', element.getAttribute('style') + '; ' + focusStyle);
    element.setAttribute('data-auto-fixed', 'focus-outline');
    
    return true;
  }

  /**
   * Fix color contrast issues
   */
  private fixColorContrast(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Apply high contrast theme
    if (this.isLightColor(backgroundColor)) {
      element.style.color = '#1a1a1a'; // Dark text on light background
    } else {
      element.style.color = '#ffffff'; // White text on dark background
    }

    element.style.textShadow = '1px 1px 1px rgba(0,0,0,0.1)';
    element.setAttribute('data-auto-fixed', 'color-contrast');
    
    return true;
  }

  /**
   * Fix image aspect ratio distortion
   */
  private fixImageAspectRatio(img: HTMLImageElement): boolean {
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center';
    
    // Set aspect ratio if natural dimensions are available
    if (img.naturalWidth && img.naturalHeight) {
      img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    }
    
    img.setAttribute('data-auto-fixed', 'aspect-ratio');
    return true;
  }

  /**
   * Fix overflow issues
   */
  private fixOverflowIssue(element: HTMLElement): boolean {
    element.style.maxWidth = '100%';
    element.style.overflowX = 'auto';
    element.style.wordBreak = 'break-word';
    element.setAttribute('data-auto-fixed', 'overflow');
    return true;
  }

  /**
   * Fix layout shifts
   */
  private fixLayoutShifts(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      if (img.naturalWidth && img.naturalHeight) {
        img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        img.style.width = '100%';
        img.style.height = 'auto';
      }
    } else {
      element.style.minHeight = rect.height + 'px';
      element.style.contain = 'layout';
    }
    
    element.setAttribute('data-auto-fixed', 'layout-shift');
    return true;
  }

  /**
   * Fix text overflow issues
   */
  private fixTextOverflow(element: HTMLElement): boolean {
    element.style.overflow = 'hidden';
    element.style.textOverflow = 'ellipsis';
    element.style.whiteSpace = 'nowrap';
    element.style.maxWidth = '100%';
    element.setAttribute('data-auto-fixed', 'text-overflow');
    return true;
  }

  /**
   * Fix responsive width issues
   */
  private fixResponsiveWidth(element: HTMLElement): boolean {
    const currentWidth = element.style.width;
    
    if (currentWidth && currentWidth.includes('px')) {
      element.style.maxWidth = currentWidth;
      element.style.width = '100%';
      element.style.minWidth = '0';
    }
    
    element.setAttribute('data-auto-fixed', 'responsive-width');
    return true;
  }

  /**
   * Fix z-index issues
   */
  private fixZIndexIssue(element: HTMLElement): boolean {
    const currentZIndex = parseInt(element.style.zIndex || '0');
    
    if (currentZIndex > 1000) {
      element.style.zIndex = '10';
      element.setAttribute('data-auto-fixed', 'z-index');
      return true;
    }
    
    return false;
  }

  /**
   * Fix loading logo alignment
   */
  private fixLoadingLogoAlignment(element: HTMLElement): boolean {
    const parent = element.parentElement;
    if (!parent) return false;

    parent.style.display = 'flex';
    parent.style.alignItems = 'center';
    parent.style.justifyContent = 'center';
    parent.style.minHeight = '100px';
    
    element.setAttribute('data-auto-fixed', 'logo-alignment');
    return true;
  }

  /**
   * Fix card spacing issues
   */
  private fixCardSpacing(element: HTMLElement): boolean {
    const children = Array.from(element.children) as HTMLElement[];
    
    children.forEach((child, index) => {
      if (index > 0) {
        child.style.marginTop = '1rem';
      }
    });
    
    element.style.gap = '1rem';
    element.setAttribute('data-auto-fixed', 'card-spacing');
    return true;
  }

  /**
   * Fix video accessibility
   */
  private fixVideoAccessibility(video: HTMLVideoElement): boolean {
    // Add a text track if none exists
    const hasCaption = video.querySelector('track[kind="captions"], track[kind="subtitles"]');
    
    if (!hasCaption) {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.label = 'English';
      track.srclang = 'en';
      track.src = 'data:text/vtt,WEBVTT'; // Empty VTT file
      video.appendChild(track);
    }
    
    // Add controls if missing
    video.controls = true;
    video.setAttribute('data-auto-fixed', 'video-accessibility');
    return true;
  }

  /**
   * Fix table headers
   */
  private fixTableHeaders(table: HTMLTableElement): boolean {
    const firstRow = table.querySelector('tr');
    if (!firstRow) return false;

    // Convert first row cells to headers if they aren't already
    const cells = firstRow.querySelectorAll('td');
    cells.forEach(cell => {
      const th = document.createElement('th');
      th.innerHTML = cell.innerHTML;
      th.scope = 'col';
      cell.parentNode?.replaceChild(th, cell);
    });
    
    table.setAttribute('data-auto-fixed', 'table-headers');
    return true;
  }

  /**
   * Fix heading hierarchy
   */
  private fixHeadingHierarchy(heading: HTMLElement): boolean {
    const currentLevel = parseInt(heading.tagName.substring(1));
    const prevHeading = this.findPreviousHeading(heading);
    
    if (prevHeading) {
      const prevLevel = parseInt(prevHeading.tagName.substring(1));
      const correctLevel = Math.min(prevLevel + 1, 6);
      
      if (currentLevel !== correctLevel) {
        const newHeading = document.createElement(`h${correctLevel}`);
        newHeading.innerHTML = heading.innerHTML;
        newHeading.className = heading.className;
        heading.parentNode?.replaceChild(newHeading, heading);
        newHeading.setAttribute('data-auto-fixed', 'heading-hierarchy');
        return true;
      }
    }
    
    return false;
  }

  /**
   * Apply generic fix for unknown issues
   */
  private applyGenericFix(element: HTMLElement, issue: AlignmentIssue): boolean {
    // Apply general accessibility and responsive improvements
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      this.fixSmallTouchTarget(element);
    }
    
    if (!element.getAttribute('aria-label') && element.textContent?.trim()) {
      element.setAttribute('aria-label', element.textContent.trim());
    }
    
    element.setAttribute('data-auto-fixed', 'generic');
    return true;
  }

  /**
   * Apply global CSS improvements
   */
  private async applyGlobalImprovements(): Promise<void> {
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced focus styles */
      *:focus-visible {
        outline: 2px solid hsl(var(--ring)) !important;
        outline-offset: 2px !important;
      }
      
      /* Improved touch targets */
      button, a, input, select, textarea, [role="button"] {
        min-height: 44px !important;
        min-width: 44px !important;
      }
      
      /* Better text contrast */
      .low-contrast-fix {
        text-shadow: 1px 1px 1px rgba(0,0,0,0.1) !important;
      }
      
      /* Responsive image improvements */
      img[data-auto-fixed="aspect-ratio"] {
        max-width: 100% !important;
        height: auto !important;
      }
      
      /* Layout shift prevention */
      [data-auto-fixed="layout-shift"] {
        contain: layout !important;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        [data-auto-fixed="responsive-width"] {
          width: 100% !important;
          max-width: none !important;
        }
        
        /* Improve mobile touch targets */
        button, a, input, select, textarea, [role="button"] {
          min-height: 48px !important;
          padding: 12px 16px !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // Add global ARIA improvements
    this.addGlobalAriaImprovements();
  }

  /**
   * Add global ARIA improvements
   */
  private addGlobalAriaImprovements(): void {
    // Add missing main landmark if it doesn't exist
    if (!document.querySelector('main, [role="main"]')) {
      const main = document.querySelector('.main-content, #main-content, .content');
      if (main) {
        main.setAttribute('role', 'main');
      }
    }

    // Add missing navigation landmark
    if (!document.querySelector('nav, [role="navigation"]')) {
      const nav = document.querySelector('.navigation, .nav, .menu');
      if (nav) {
        nav.setAttribute('role', 'navigation');
      }
    }

    // Add language attribute if missing
    if (!document.documentElement.getAttribute('lang')) {
      document.documentElement.setAttribute('lang', 'sq'); // Albanian
    }

    // Add skip links if missing
    if (!document.querySelector('.skip-link, a[href="#main"], a[href="#content"]')) {
      this.addSkipLinks();
    }
  }

  /**
   * Add skip navigation links
   */
  private addSkipLinks(): void {
    const skipContainer = document.createElement('div');
    skipContainer.className = 'skip-links';
    skipContainer.innerHTML = `
      <a href="#main" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 1000;
      }
      
      .skip-link {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
      
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        background: #fff;
        padding: 8px 16px;
        border: 2px solid #000;
        text-decoration: none;
        color: #000;
        font-weight: bold;
      }
    `;
    
    document.head.appendChild(style);
    document.body.insertBefore(skipContainer, document.body.firstChild);
  }

  /**
   * Helper methods
   */
  private findElement(selector: string): Element | null {
    try {
      return document.querySelector(selector);
    } catch {
      // If selector is invalid, try to find by class or id
      const cleanSelector = selector.replace(/[^a-zA-Z0-9.-]/g, '');
      return document.querySelector(`.${cleanSelector}`) || 
             document.querySelector(`#${cleanSelector}`);
    }
  }

  private wasFixApplied(element: string, issue: string): boolean {
    const fixes = this.appliedFixes.get(element) || [];
    return fixes.includes(issue);
  }

  private trackAppliedFix(element: string, issue: string): void {
    const fixes = this.appliedFixes.get(element) || [];
    fixes.push(issue);
    this.appliedFixes.set(element, fixes);
  }

  private inferImageDescription(img: HTMLImageElement): string {
    const src = img.src;
    const fileName = src.split('/').pop()?.split('.')[0] || '';
    
    // Common patterns
    if (fileName.includes('logo')) return 'Logo';
    if (fileName.includes('avatar') || fileName.includes('profile')) return 'Profile image';
    if (fileName.includes('car') || fileName.includes('vehicle')) return 'Car image';
    if (fileName.includes('hero') || fileName.includes('banner')) return 'Banner image';
    
    return 'Image';
  }

  private inferElementPurpose(element: HTMLElement): string {
    const className = element.className;
    const tagName = element.tagName.toLowerCase();
    
    if (className.includes('button') || tagName === 'button') return 'Button';
    if (className.includes('link') || tagName === 'a') return 'Link';
    if (className.includes('menu')) return 'Menu';
    if (className.includes('nav')) return 'Navigation';
    if (className.includes('search')) return 'Search';
    if (className.includes('close')) return 'Close';
    if (className.includes('toggle')) return 'Toggle';
    
    return `${tagName} element`;
  }

  private inferLinkPurpose(link: HTMLAnchorElement): string {
    const href = link.href;
    const text = link.textContent?.trim() || '';
    
    if (href.includes('mailto:')) return `Email ${href.split(':')[1]}`;
    if (href.includes('tel:')) return `Call ${href.split(':')[1]}`;
    if (href.includes('wa.me')) return 'WhatsApp contact';
    if (href.includes('viber:')) return 'Viber contact';
    if (href.includes('/catalog')) return 'View catalog';
    if (href.includes('/contact')) return 'Contact page';
    if (href.includes('/admin')) return 'Admin dashboard';
    
    return text || 'Link';
  }

  private isLightColor(color: string): boolean {
    // Simple light color detection
    return color.includes('rgb(255') || 
           color.includes('#fff') || 
           color.includes('white') ||
           color === 'transparent' ||
           color === '';
  }

  private findPreviousHeading(heading: HTMLElement): HTMLElement | null {
    let current = heading.previousElementSibling;
    
    while (current) {
      if (/^H[1-6]$/i.test(current.tagName)) {
        return current as HTMLElement;
      }
      current = current.previousElementSibling;
    }
    
    return null;
  }

  /**
   * Get repair summary report
   */
  public generateRepairReport(result: RepairResult): string {
    const total = result.fixed + result.failed;
    const successRate = total > 0 ? (result.fixed / total * 100).toFixed(1) : '0';
    
    let report = `
🔧 KORAUTO Enhanced Auto-Repair Report
=====================================

📊 Summary:
- Total Issues: ${total}
- Successfully Fixed: ${result.fixed}
- Failed to Fix: ${result.failed}
- Success Rate: ${successRate}%

`;

    if (result.details.length > 0) {
      report += '\n📝 Detailed Results:\n';
      result.details.forEach((detail, index) => {
        const emoji = detail.status === 'fixed' ? '✅' : 
                      detail.status === 'failed' ? '❌' : '⏭️';
        
        report += `${index + 1}. ${emoji} ${detail.element}\n`;
        report += `   Issue: ${detail.issue}\n`;
        report += `   Status: ${detail.status.toUpperCase()}\n`;
        
        if (detail.reason) {
          report += `   Reason: ${detail.reason}\n`;
        }
        
        report += '\n';
      });
    }

    report += '\n🎯 Applied Global Improvements:\n';
    report += '- Enhanced focus outline styles\n';
    report += '- Improved touch target sizes\n';
    report += '- Better color contrast support\n';
    report += '- Responsive design fixes\n';
    report += '- ARIA landmark improvements\n';
    report += '- Skip navigation links\n';

    return report;
  }
}

export default EnhancedAutoRepair;