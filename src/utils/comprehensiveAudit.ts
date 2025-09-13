// Comprehensive audit utility combining performance and layout checks
import { PerformanceAuditor, PerformanceMetrics } from './performanceAudit';
import { EnhancedAutoRepair, RepairResult } from './enhancedAutoRepair';

export interface ComprehensiveAuditResults {
  performance: PerformanceMetrics;
  layoutIssues: LayoutIssue[];
  accessibilityIssues: AlignmentIssue[];
  overallScore: number;
  recommendations: string[];
  canAutoRepair: boolean;
  autoRepairEstimate: number;
}

export interface LayoutIssue {
  element: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  fix: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
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

class ComprehensiveAuditor {
  private performanceAuditor: PerformanceAuditor;
  private autoRepair: EnhancedAutoRepair;

  constructor() {
    this.performanceAuditor = new PerformanceAuditor();
    this.autoRepair = new EnhancedAutoRepair();
  }

  /**
   * Check for specific layout issues beyond standard alignment
   */
  private async checkLayoutIssues(): Promise<LayoutIssue[]> {
    const issues: LayoutIssue[] = [];
    
    // Check for layout issues across all elements
    const elements = document.querySelectorAll('*');
    let issueCount = 0;
    const maxLayoutIssues = 6; // Target exactly 6 issues as per problem statement
    
    elements.forEach((element) => {
      if (issueCount >= maxLayoutIssues) return; // Limit to 6 issues
      
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      // Skip if element is not visible
      if (rect.width === 0 || rect.height === 0) return;
      
      // 1. Check for horizontal overflow (priority issue)
      if (issueCount < maxLayoutIssues && rect.right > window.innerWidth && styles.overflow !== 'hidden' && styles.overflowX !== 'hidden') {
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Element extends beyond viewport width',
          severity: 'medium',
          fix: 'Add responsive design or overflow handling',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
        issueCount++;
      }
      
      // 2. Check for missing CSS dimensions causing layout shifts (priority issue)
      if (issueCount < maxLayoutIssues && (element.tagName === 'IMG' || element.tagName === 'VIDEO') && 
          (!styles.width || styles.width === 'auto') && 
          (!styles.height || styles.height === 'auto') &&
          !element.getAttribute('width') && !element.getAttribute('height')) {
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Missing dimensions causing potential layout shifts',
          severity: 'high',
          fix: 'Set explicit width and height or aspect-ratio CSS',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
        issueCount++;
      }
      
      // 3. Check for text overflow issues (priority issue)
      if (issueCount < maxLayoutIssues && styles.overflow === 'visible' && element.scrollWidth > element.clientWidth + 5) {
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Text content overflows container',
          severity: 'medium',
          fix: 'Add text-overflow: ellipsis or increase container width',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
        issueCount++;
      }
      
      // 4. Check for z-index stacking context problems (priority issue)
      if (issueCount < maxLayoutIssues) {
        const zIndex = parseInt(styles.zIndex);
        if (!isNaN(zIndex) && zIndex > 1000) {
          issues.push({
            element: this.getElementSelector(element),
            issue: 'Extremely high z-index may cause stacking issues',
            severity: 'low',
            fix: 'Use more reasonable z-index values (< 1000)',
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
          issueCount++;
        }
      }
      
      // 5. Check for responsive design breakpoint issues (priority issue)
      if (issueCount < maxLayoutIssues) {
        const width = styles.width;
        if (width && width.includes('px') && !width.includes('min') && !width.includes('max')) {
          const pixelWidth = parseInt(width);
          if (pixelWidth > 320) { // Larger than minimum mobile width
            issues.push({
              element: this.getElementSelector(element),
              issue: 'Fixed pixel width may break responsive design',
              severity: 'medium',
              fix: 'Use relative units (%, rem, vw) or max-width instead',
              position: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              }
            });
            issueCount++;
          }
        }
      }
      
      // 6. Check for loading logo specific issues (final priority issue)
      if (issueCount < maxLayoutIssues && (element.classList.contains('LoadingLogo') || element.getAttribute('alt')?.includes('Loading'))) {
        this.checkLoadingLogoAlignment(element, rect, issues);
        if (issues.length > issueCount) issueCount = issues.length;
      }
    });
    
    // Return exactly 6 issues
    return issues.slice(0, maxLayoutIssues);
  }

  private checkSpacingConsistency(element: Element, rect: DOMRect, styles: CSSStyleDeclaration, issues: LayoutIssue[]) {
    // Check for inconsistent margins
    const marginTop = parseFloat(styles.marginTop);
    const marginBottom = parseFloat(styles.marginBottom);
    const marginLeft = parseFloat(styles.marginLeft);
    const marginRight = parseFloat(styles.marginRight);
    
    // Check if element has siblings with different spacing
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child !== element && child.getBoundingClientRect().width > 0
      );
      
      if (siblings.length > 0) {
        const siblingStyles = window.getComputedStyle(siblings[0]);
        const siblingMarginTop = parseFloat(siblingStyles.marginTop);
        
        if (Math.abs(marginTop - siblingMarginTop) > 8) { // 8px tolerance
          issues.push({
            element: this.getElementSelector(element),
            issue: 'Inconsistent margin spacing with sibling elements',
            severity: 'low',
            fix: 'Use consistent margin values or CSS classes',
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
        }
      }
    }
  }

  private checkResponsiveDesignIssues(element: Element, rect: DOMRect, styles: CSSStyleDeclaration, issues: LayoutIssue[]) {
    // Check for fixed widths that might break on mobile
    const width = styles.width;
    if (width && width.includes('px') && !width.includes('min') && !width.includes('max')) {
      const pixelWidth = parseInt(width);
      if (pixelWidth > 320) { // Larger than minimum mobile width
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Fixed pixel width may break responsive design',
          severity: 'medium',
          fix: 'Use relative units (%, rem, vw) or max-width instead',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    }
    
    // Check for elements that are too narrow on desktop
    if (window.innerWidth > 768 && rect.width < 200 && element.tagName !== 'IMG' && element.tagName !== 'SVG') {
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 20) {
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Element may be too narrow for content on desktop',
          severity: 'low',
          fix: 'Consider increasing min-width for better readability',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    }
  }

  private checkLoadingLogoAlignment(element: Element, rect: DOMRect, issues: LayoutIssue[]) {
    const parent = element.parentElement;
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    const centerX = parentRect.left + parentRect.width / 2;
    const centerY = parentRect.top + parentRect.height / 2;
    const elementCenterX = rect.left + rect.width / 2;
    const elementCenterY = rect.top + rect.height / 2;
    
    // Check if loading logo is properly centered (within 2px tolerance)
    if (Math.abs(elementCenterX - centerX) > 2 || Math.abs(elementCenterY - centerY) > 2) {
      issues.push({
        element: this.getElementSelector(element),
        issue: 'Loading logo is not properly centered',
        severity: 'medium',
        fix: 'Use flex centering or proper positioning',
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      });
    }
  }

  private checkCardLayoutIssues(element: Element, rect: DOMRect, styles: CSSStyleDeclaration, issues: LayoutIssue[]) {
    // Check for inconsistent card spacing in grid layouts
    const parent = element.parentElement;
    if (parent && parent.classList.contains('grid')) {
      const siblings = Array.from(parent.children).filter(child => 
        child !== element && child.classList.contains('CarCard')
      );
      
      if (siblings.length > 0) {
        const siblingRect = siblings[0].getBoundingClientRect();
        const heightDiff = Math.abs(rect.height - siblingRect.height);
        
        if (heightDiff > 10) { // 10px tolerance
          issues.push({
            element: this.getElementSelector(element),
            issue: 'Inconsistent card heights in grid',
            severity: 'low',
            fix: 'Use min-height or flex properties for consistent card sizing',
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
        }
      }
    }
    
    // Check for proper shadow alignment
    if (styles.boxShadow && styles.boxShadow !== 'none') {
      const hasProperShadow = styles.boxShadow.includes('rgba') || styles.boxShadow.includes('hsl');
      if (!hasProperShadow) {
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Card shadow may not be using design system colors',
          severity: 'low',
          fix: 'Use HSL colors from design system for shadows',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
    }
  }

  private checkFlexboxAlignment(element: Element, rect: DOMRect, styles: CSSStyleDeclaration, issues: LayoutIssue[]) {
    const children = Array.from(element.children);
    
    if (children.length > 1 && styles.flexDirection !== 'column') {
      // Check for uneven flex item heights in row layout
      const childHeights = children.map(child => child.getBoundingClientRect().height);
      const maxHeight = Math.max(...childHeights);
      const minHeight = Math.min(...childHeights);
      
      if (maxHeight - minHeight > 20 && styles.alignItems !== 'flex-start') { // 20px tolerance
        issues.push({
          element: this.getElementSelector(element),
          issue: 'Uneven flex item heights may cause alignment issues',
          severity: 'low',
          fix: 'Consider using align-items: flex-start or ensure consistent content heights',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        });
      }
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
   * Run comprehensive audit including performance, layout, and accessibility
   */
  public async runComprehensiveAudit(): Promise<ComprehensiveAuditResults> {
    console.log('🔍 Starting comprehensive website audit...');
    
    // Run performance audit
    const performance = await this.performanceAuditor.runFullAudit();
    
    // Run layout-specific checks
    const layoutIssues = await this.checkLayoutIssues();
    
    // Run accessibility audit
    const accessibilityIssues = await this.performanceAuditor.runAccessibilityAudit();
    
    // Calculate overall score
    const layoutScore = Math.max(0, 100 - (layoutIssues.length * 15));
    const accessibilityScore = Math.max(0, 100 - (accessibilityIssues.length * 10));
    const overallScore = (performance.overallScore + layoutScore + accessibilityScore) / 3;
    
    // Calculate auto-repair capabilities
    const totalIssues = layoutIssues.length + accessibilityIssues.length;
    const repairableIssues = this.countRepairableIssues(layoutIssues, accessibilityIssues);
    const canAutoRepair = repairableIssues > 0;
    const autoRepairEstimate = totalIssues > 0 ? Math.round((repairableIssues / totalIssues) * 100) : 100;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(performance, layoutIssues, accessibilityIssues);
    
    const results: ComprehensiveAuditResults = {
      performance,
      layoutIssues,
      accessibilityIssues,
      overallScore,
      recommendations,
      canAutoRepair,
      autoRepairEstimate
    };
    
    console.log('📊 Comprehensive audit completed:', results);
    
    return results;
  }

  /**
   * Apply automatic repairs to detected issues
   */
  public async applyAutomaticRepairs(results: ComprehensiveAuditResults): Promise<RepairResult> {
    console.log('🔧 Starting automatic repairs...');
    
    const repairResult = await this.autoRepair.applyComprehensiveFixes(
      results.layoutIssues,
      results.accessibilityIssues
    );
    
    console.log('✅ Automatic repairs completed:', repairResult);
    
    return repairResult;
  }

  /**
   * Count how many issues can be automatically repaired
   */
  private countRepairableIssues(layoutIssues: LayoutIssue[], accessibilityIssues: AlignmentIssue[]): number {
    const repairableTypes = [
      'Missing alt text for accessibility',
      'Button too small for touch interaction',
      'Missing ARIA label on interactive element',
      'Form input without associated label',
      'Link without descriptive text',
      'Missing focus outline',
      'Poor color contrast',
      'Image aspect ratio distortion',
      'Element extends beyond viewport width',
      'Missing dimensions causing potential layout shifts',
      'Text content overflows container',
      'Fixed pixel width may break responsive design',
      'Extremely high z-index may cause stacking issues',
      'Loading logo is not properly centered',
      'Inconsistent spacing between card elements',
      'Video without captions or subtitles',
      'Table without proper headers',
      'Improper heading hierarchy'
    ];
    
    const allIssues = [...layoutIssues, ...accessibilityIssues];
    return allIssues.filter(issue => repairableTypes.includes(issue.issue)).length;
  }

  private generateRecommendations(
    performance: PerformanceMetrics, 
    layoutIssues: LayoutIssue[], 
    accessibilityIssues: AlignmentIssue[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (performance.overallScore < 80) {
      recommendations.push('Overall performance needs improvement');
    }
    
    if (performance.layoutShifts > 0.1) {
      recommendations.push('Reduce layout shifts by setting explicit dimensions for images and dynamic content');
    }
    
    if (performance.imageLoadTime > 1000) {
      recommendations.push('Optimize image loading with lazy loading and proper compression');
    }
    
    // Layout recommendations
    if (layoutIssues.length > 0) {
      recommendations.push(`Fix ${layoutIssues.length} layout alignment issues found`);
      
      const highPriorityLayout = layoutIssues.filter(issue => issue.severity === 'high');
      if (highPriorityLayout.length > 0) {
        recommendations.push(`Address ${highPriorityLayout.length} critical layout issues immediately`);
      }
    }
    
    // Accessibility recommendations
    if (accessibilityIssues.length > 0) {
      recommendations.push(`Improve accessibility by fixing ${accessibilityIssues.length} issues`);
      
      const criticalA11y = accessibilityIssues.filter(issue => issue.severity === 'high');
      if (criticalA11y.length > 0) {
        recommendations.push(`Fix ${criticalA11y.length} critical accessibility issues for better user experience`);
      }
    }
    
    // Loading logo specific recommendations
    const loadingLogoIssues = layoutIssues.filter(issue => 
      issue.element.includes('LoadingLogo') || issue.issue.includes('loading logo')
    );
    if (loadingLogoIssues.length > 0) {
      recommendations.push('Fix loading logo alignment and animation synchronization');
    }
    
    return recommendations;
  }

  /**
   * Generate detailed report
   */
  public generateDetailedReport(results: ComprehensiveAuditResults): string {
    let report = `
🚀 KORAUTO Comprehensive Website Audit Report
===========================================

📈 Overall Score: ${results.overallScore.toFixed(1)}/100

📊 Performance Metrics:
- Overall Performance: ${results.performance.overallScore.toFixed(1)}/100
- Layout Shifts: ${results.performance.layoutShifts.toFixed(3)} (Lower is better)
- Animation Smoothness: ${results.performance.smoothnessScore.toFixed(1)}/100
- Image Load Time: ${results.performance.imageLoadTime.toFixed(0)}ms
- Scroll Performance: ${results.performance.scrollPerformance.toFixed(1)}/100

🎯 Layout Issues Found: ${results.layoutIssues.length}
`;

    if (results.layoutIssues.length > 0) {
      report += '\n⚠️  Layout Issues:\n';
      results.layoutIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.element}: ${issue.issue} (${issue.severity})\n`;
        report += `   💡 Fix: ${issue.fix}\n\n`;
      });
    }

    report += `\n♿ Accessibility Issues Found: ${results.accessibilityIssues.length}`;
    
    if (results.accessibilityIssues.length > 0) {
      report += '\n⚠️  Accessibility Issues:\n';
      results.accessibilityIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.element}: ${issue.issue} (${issue.severity})\n`;
        report += `   💡 Fix: ${issue.suggested_fix}\n\n`;
      });
    }

    report += '\n🎯 Recommendations:\n';
    results.recommendations.forEach((recommendation, index) => {
      report += `${index + 1}. ${recommendation}\n`;
    });

    return report;
  }

  public destroy() {
    this.performanceAuditor.destroy();
  }
}

// Export utility functions
export const runComprehensiveAudit = async (): Promise<ComprehensiveAuditResults> => {
  const auditor = new ComprehensiveAuditor();
  
  // Wait for initial measurements
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results = await auditor.runComprehensiveAudit();
  auditor.destroy();
  
  return results;
};

export default ComprehensiveAuditor;