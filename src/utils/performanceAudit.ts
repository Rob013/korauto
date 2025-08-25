// @ts-nocheck
// Comprehensive performance audit utility for automated alignment and smoothness checking
import { debounce, throttle } from './performance';

export interface PerformanceMetrics {
  layoutShifts: number;
  animationFrameRate: number;
  imageLoadTime: number;
  scrollPerformance: number;
  alignmentIssues: AlignmentIssue[];
  smoothnessScore: number;
  overallScore: number;
}

export interface AlignmentIssue {
  element: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggested_fix: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export class PerformanceAuditor {
  private observer: IntersectionObserver | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: Partial<PerformanceMetrics> = {};
  private layoutShiftScore = 0;
  private animationFrameTimes: number[] = [];
  private scrollData: { timestamp: number; position: number }[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Layout Shift Observer
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.layoutShiftScore += (entry as any).value;
          }
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('Layout shift observation not supported');
      }
    }

    // Animation Frame Rate Monitor
    this.monitorAnimationFrameRate();

    // Scroll Performance Monitor
    this.monitorScrollPerformance();
  }

  private monitorAnimationFrameRate() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 1000) { // Every second
        const fps = Math.round((frameCount * 1000) / deltaTime);
        this.animationFrameTimes.push(fps);
        
        // Keep only last 10 measurements
        if (this.animationFrameTimes.length > 10) {
          this.animationFrameTimes.shift();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      frameCount++;
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  private monitorScrollPerformance() {
    const scrollHandler = throttle((e: Event) => {
      const timestamp = performance.now();
      const position = window.scrollY;
      
      this.scrollData.push({ timestamp, position });
      
      // Keep only last 50 scroll events
      if (this.scrollData.length > 50) {
        this.scrollData.shift();
      }
    }, 16); // ~60fps throttling

    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  /**
   * Check for layout alignment issues across the page
   */
  public async checkAlignmentIssues(): Promise<AlignmentIssue[]> {
    const issues: AlignmentIssue[] = [];
    
    // Check for common alignment problems
    const elements = document.querySelectorAll('*');
    
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      // Skip if element is not visible
      if (rect.width === 0 || rect.height === 0) return;
      
      // Check for misaligned text
      if (this.isTextElement(element)) {
        const textAlign = styles.textAlign;
        const paddingLeft = parseFloat(styles.paddingLeft);
        const paddingRight = parseFloat(styles.paddingRight);
        
        if (textAlign === 'center' && Math.abs(paddingLeft - paddingRight) > 2) {
          issues.push({
            element: this.getElementSelector(element),
            issue: 'Uneven padding on centered text',
            severity: 'medium',
            suggested_fix: 'Ensure equal left and right padding for centered text',
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
        }
      }
      
      // Check for layout shifting elements
      if (element.classList.contains('card') || element.classList.contains('CarCard')) {
        this.checkCardAlignment(element, rect, issues);
      }
      
      // Check for improperly sized images
      if (element.tagName === 'IMG') {
        this.checkImageAlignment(element as HTMLImageElement, rect, issues);
      }
      
      // Check for button alignment
      if (element.tagName === 'BUTTON' || element.classList.contains('btn')) {
        this.checkButtonAlignment(element, rect, styles, issues);
      }
    });
    
    return issues;
  }

  private isTextElement(element: Element): boolean {
    const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV'];
    return textTags.includes(element.tagName) && element.textContent?.trim() !== '';
  }

  private checkCardAlignment(element: Element, rect: DOMRect, issues: AlignmentIssue[]) {
    const children = Array.from(element.children);
    
    // Check if card children have consistent spacing
    for (let i = 1; i < children.length; i++) {
      const prevRect = children[i - 1].getBoundingClientRect();
      const currRect = children[i].getBoundingClientRect();
      const gap = currRect.top - (prevRect.top + prevRect.height);
      
      if (i > 1) {
        const prevPrevRect = children[i - 2].getBoundingClientRect();
        const prevGap = prevRect.top - (prevPrevRect.top + prevPrevRect.height);
        
        if (Math.abs(gap - prevGap) > 4) { // 4px tolerance
          issues.push({
            element: this.getElementSelector(element),
            issue: 'Inconsistent spacing between card elements',
            severity: 'low',
            suggested_fix: 'Use consistent margin/padding for card children',
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
          break;
        }
      }
    }
  }

  private checkImageAlignment(img: HTMLImageElement, rect: DOMRect, issues: AlignmentIssue[]) {
    // Check for aspect ratio distortion
    if (img.naturalWidth && img.naturalHeight) {
      const naturalAspectRatio = img.naturalWidth / img.naturalHeight;
      const displayAspectRatio = rect.width / rect.height;
      
      if (Math.abs(naturalAspectRatio - displayAspectRatio) > 0.1) {
        issues.push({
          element: this.getElementSelector(img),
          issue: 'Image aspect ratio distortion',
          severity: 'medium',
          suggested_fix: 'Use object-fit: cover or maintain proper aspect ratio',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    }
    
    // Check for missing alt text (accessibility alignment)
    if (!img.alt || img.alt.trim() === '') {
      issues.push({
        element: this.getElementSelector(img),
        issue: 'Missing alt text for accessibility',
        severity: 'high',
        suggested_fix: 'Add descriptive alt text for screen readers',
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      });
    }
  }

  private checkButtonAlignment(element: Element, rect: DOMRect, styles: CSSStyleDeclaration, issues: AlignmentIssue[]) {
    const minTouchTarget = 44; // Recommended minimum touch target size
    
    if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
      issues.push({
        element: this.getElementSelector(element),
        issue: 'Button too small for touch interaction',
        severity: 'high',
        suggested_fix: `Ensure minimum ${minTouchTarget}px touch target size`,
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
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
   * Measure image loading performance
   */
  public async measureImageLoadTime(): Promise<number> {
    const images = document.querySelectorAll('img');
    const loadTimes: number[] = [];
    
    for (const img of images) {
      if (img.complete) continue; // Skip already loaded images
      
      const startTime = performance.now();
      
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Image load timeout')), 5000);
        });
        
        const endTime = performance.now();
        loadTimes.push(endTime - startTime);
      } catch (e) {
        // Image failed to load or timed out
        loadTimes.push(5000); // Penalty score
      }
    }
    
    return loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b) / loadTimes.length : 0;
  }

  /**
   * Calculate scroll performance score
   */
  public calculateScrollPerformance(): number {
    if (this.scrollData.length < 2) return 100;
    
    let smoothnessScore = 100;
    
    for (let i = 1; i < this.scrollData.length; i++) {
      const timeDelta = this.scrollData[i].timestamp - this.scrollData[i - 1].timestamp;
      const positionDelta = Math.abs(this.scrollData[i].position - this.scrollData[i - 1].position);
      
      if (timeDelta > 0) {
        const velocity = positionDelta / timeDelta;
        
        // Penalize jerky scrolling (high velocity changes)
        if (velocity > 2) {
          smoothnessScore -= 5;
        }
      }
    }
    
    return Math.max(0, smoothnessScore);
  }

  /**
   * Calculate animation smoothness score
   */
  public calculateAnimationSmoothness(): number {
    if (this.animationFrameTimes.length === 0) return 100;
    
    const avgFps = this.animationFrameTimes.reduce((a, b) => a + b) / this.animationFrameTimes.length;
    const targetFps = 60;
    
    // Calculate smoothness based on how close to 60fps we are
    const smoothness = (avgFps / targetFps) * 100;
    
    // Penalize for inconsistent frame rates
    const variance = this.calculateVariance(this.animationFrameTimes);
    const consistencyPenalty = Math.min(variance, 20);
    
    return Math.max(0, Math.min(100, smoothness - consistencyPenalty));
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b) / squaredDiffs.length;
  }

  /**
   * Run comprehensive performance audit
   */
  public async runFullAudit(): Promise<PerformanceMetrics> {
    console.log('🔍 Starting comprehensive performance audit...');
    
    const alignmentIssues = await this.checkAlignmentIssues();
    const imageLoadTime = await this.measureImageLoadTime();
    const scrollPerformance = this.calculateScrollPerformance();
    const animationFrameRate = this.calculateAnimationSmoothness();
    
    // Calculate overall smoothness score
    const smoothnessScore = (scrollPerformance + animationFrameRate) / 2;
    
    // Calculate overall score
    const alignmentScore = Math.max(0, 100 - (alignmentIssues.length * 10));
    const imageScore = Math.max(0, 100 - (imageLoadTime / 100));
    const layoutShiftScore = Math.max(0, 100 - (this.layoutShiftScore * 100));
    
    const overallScore = (alignmentScore + imageScore + layoutShiftScore + smoothnessScore) / 4;
    
    const metrics: PerformanceMetrics = {
      layoutShifts: this.layoutShiftScore,
      animationFrameRate,
      imageLoadTime,
      scrollPerformance,
      alignmentIssues,
      smoothnessScore,
      overallScore
    };
    
    console.log('📊 Performance audit results:', metrics);
    
    return metrics;
  }

  /**
   * Generate performance report
   */
  public generateReport(metrics: PerformanceMetrics): string {
    let report = `
🚀 KORAUTO Performance Audit Report
====================================

📈 Overall Score: ${metrics.overallScore.toFixed(1)}/100

📊 Detailed Metrics:
- Layout Shifts: ${metrics.layoutShifts.toFixed(3)} (Lower is better)
- Animation Frame Rate: ${metrics.animationFrameRate.toFixed(1)}% smooth
- Image Load Time: ${metrics.imageLoadTime.toFixed(0)}ms average
- Scroll Performance: ${metrics.scrollPerformance.toFixed(1)}/100
- Smoothness Score: ${metrics.smoothnessScore.toFixed(1)}/100

🔍 Alignment Issues Found: ${metrics.alignmentIssues.length}
`;

    if (metrics.alignmentIssues.length > 0) {
      report += '\n⚠️  Issues to Fix:\n';
      metrics.alignmentIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.element}: ${issue.issue} (${issue.severity})\n`;
        report += `   💡 Fix: ${issue.suggested_fix}\n\n`;
      });
    }

    report += '\n📝 Recommendations:\n';
    
    if (metrics.overallScore < 80) {
      report += '- Overall performance needs improvement\n';
    }
    
    if (metrics.layoutShifts > 0.1) {
      report += '- Reduce layout shifts by setting explicit dimensions\n';
    }
    
    if (metrics.animationFrameRate < 90) {
      report += '- Optimize animations for better frame rate\n';
    }
    
    if (metrics.imageLoadTime > 1000) {
      report += '- Optimize image loading and compression\n';
    }
    
    if (metrics.scrollPerformance < 90) {
      report += '- Improve scroll performance with better debouncing\n';
    }

    return report;
  }

  /**
   * Apply automatic fixes for common issues
   */
  public async applyAutoFixes(issues: AlignmentIssue[]): Promise<number> {
    let fixedCount = 0;
    
    for (const issue of issues) {
      try {
        const element = document.querySelector(issue.element);
        if (!element) continue;
        
        switch (issue.issue) {
          case 'Button too small for touch interaction':
            (element as HTMLElement).style.minHeight = '44px';
            (element as HTMLElement).style.minWidth = '44px';
            (element as HTMLElement).style.padding = '8px 16px';
            fixedCount++;
            break;
            
          case 'Image aspect ratio distortion':
            (element as HTMLElement).style.objectFit = 'cover';
            (element as HTMLElement).style.objectPosition = 'center';
            fixedCount++;
            break;
            
          case 'Missing alt text for accessibility':
            if (element.tagName === 'IMG') {
              (element as HTMLImageElement).alt = element.getAttribute('data-description') || 'Car image';
              fixedCount++;
            }
            break;
            
          case 'Poor color contrast':
            (element as HTMLElement).style.filter = 'contrast(1.2)';
            fixedCount++;
            break;
            
          case 'Missing focus outline':
            (element as HTMLElement).style.outline = '2px solid hsl(var(--ring))';
            (element as HTMLElement).style.outlineOffset = '2px';
            fixedCount++;
            break;
            
          case 'Layout shift causing':
            (element as HTMLElement).style.minHeight = element.offsetHeight + 'px';
            (element as HTMLElement).style.minWidth = element.offsetWidth + 'px';
            fixedCount++;
            break;
        }
      } catch (e) {
        console.warn(`Failed to auto-fix issue for ${issue.element}:`, e);
      }
    }
    
    return fixedCount;
  }

  /**
   * Comprehensive accessibility audit
   */
  public async runAccessibilityAudit(): Promise<AlignmentIssue[]> {
    const accessibilityIssues: AlignmentIssue[] = [];
    
    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.alt || img.alt.trim() === '') {
        const rect = img.getBoundingClientRect();
        accessibilityIssues.push({
          element: this.getElementSelector(img),
          issue: 'Missing alt text for accessibility',
          severity: 'high',
          suggested_fix: 'Add descriptive alt text for screen readers',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.substring(1));
      if (level > lastLevel + 1) {
        const rect = heading.getBoundingClientRect();
        accessibilityIssues.push({
          element: this.getElementSelector(heading),
          issue: 'Improper heading hierarchy',
          severity: 'medium',
          suggested_fix: 'Use proper heading order (h1, h2, h3, etc.)',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
      lastLevel = level;
    });

    // Check for interactive elements without focus states
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      if (styles.outline === 'none' && !styles.boxShadow.includes('ring')) {
        const rect = element.getBoundingClientRect();
        accessibilityIssues.push({
          element: this.getElementSelector(element),
          issue: 'Missing focus outline',
          severity: 'medium',
          suggested_fix: 'Add focus outline for keyboard navigation',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    });

    // Check for color contrast issues
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simple contrast check (simplified)
      if (this.hasLowContrast(color, backgroundColor)) {
        const rect = element.getBoundingClientRect();
        accessibilityIssues.push({
          element: this.getElementSelector(element),
          issue: 'Poor color contrast',
          severity: 'high',
          suggested_fix: 'Improve color contrast ratio to meet WCAG standards',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    });

    return accessibilityIssues;
  }

  /**
   * Improved contrast ratio check using actual luminance calculation
   */
  private hasLowContrast(color: string, backgroundColor: string): boolean {
    // Skip transparent backgrounds - they inherit from parent
    if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent' || backgroundColor === '') {
      return false;
    }
    
    try {
      // Parse colors and calculate luminance-based contrast ratio
      const textLuminance = this.getLuminance(color);
      const bgLuminance = this.getLuminance(backgroundColor);
      
      if (textLuminance === null || bgLuminance === null) {
        return false; // Can't calculate, assume OK
      }
      
      // Calculate contrast ratio
      const contrast = (Math.max(textLuminance, bgLuminance) + 0.05) / (Math.min(textLuminance, bgLuminance) + 0.05);
      
      // WCAG AA standard is 4.5:1 for normal text, 3:1 for large text
      return contrast < 4.5;
    } catch (e) {
      return false; // Error in calculation, assume OK
    }
  }

  /**
   * Calculate relative luminance of a color
   */
  private getLuminance(color: string): number | null {
    try {
      // Create a temporary element to get computed RGB values
      const temp = document.createElement('div');
      temp.style.color = color;
      document.body.appendChild(temp);
      const computedColor = window.getComputedStyle(temp).color;
      document.body.removeChild(temp);
      
      // Parse RGB values
      const rgb = computedColor.match(/\d+/g);
      if (!rgb || rgb.length < 3) return null;
      
      const [r, g, b] = rgb.map(val => {
        const normalized = parseInt(val) / 255;
        return normalized <= 0.03928 
          ? normalized / 12.92 
          : Math.pow((normalized + 0.055) / 1.055, 2.4);
      });
      
      // Calculate luminance using the standard formula
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clean up observers
   */
  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Export utility functions
export const createPerformanceAuditor = () => new PerformanceAuditor();

export const runQuickAudit = async (): Promise<PerformanceMetrics> => {
  const auditor = createPerformanceAuditor();
  
  // Wait a bit for initial measurements
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const metrics = await auditor.runFullAudit();
  auditor.destroy();
  
  return metrics;
};

export default PerformanceAuditor;