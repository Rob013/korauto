// Enhanced performance monitoring combining all metrics for 100% mobile performance

import { PerformanceAuditor, PerformanceMetrics } from './performanceAudit';
import { AccessibilityAuditor, AccessibilityIssue } from './accessibility';
import { measureImagePerformance } from './imageOptimization';

export interface ComprehensiveMetrics extends PerformanceMetrics {
  // Accessibility metrics
  accessibilityScore: number;
  accessibilityIssues: AccessibilityIssue[];
  wcagCompliance: {
    levelA: number;
    levelAA: number;
    levelAAA: number;
  };
  
  // Image performance metrics
  imageMetrics: {
    totalImages: number;
    loadedImages: number;
    errorImages: number;
    averageLoadTime: number;
    largestContentfulPaint: number;
  };
  
  // Core Web Vitals
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  
  // Mobile-specific metrics
  mobileMetrics: {
    touchTargetScore: number;
    viewportOptimization: number;
    networkEfficiency: number;
    batteryImpact: number;
  };
  
  // Overall scores
  mobileScore: number;
  desktopScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
}

export class ComprehensivePerformanceAuditor {
  private performanceAuditor: PerformanceAuditor;
  private accessibilityAuditor: AccessibilityAuditor;
  private coreWebVitalsObserver: PerformanceObserver | null = null;
  private metrics: Partial<ComprehensiveMetrics> = {};
  
  constructor() {
    this.performanceAuditor = new PerformanceAuditor();
    this.accessibilityAuditor = new AccessibilityAuditor();
    this.initializeCoreWebVitalsObserver();
  }
  
  private initializeCoreWebVitalsObserver() {
    if ('PerformanceObserver' in window) {
      this.coreWebVitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              this.metrics.coreWebVitals = {
                ...this.metrics.coreWebVitals,
                lcp: (entry as any).startTime
              };
              break;
            case 'first-input':
              this.metrics.coreWebVitals = {
                ...this.metrics.coreWebVitals,
                fid: (entry as any).processingStart - entry.startTime
              };
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                this.metrics.coreWebVitals = {
                  ...this.metrics.coreWebVitals,
                  cls: (this.metrics.coreWebVitals?.cls || 0) + (entry as any).value
                };
              }
              break;
          }
        }
      });
      
      try {
        this.coreWebVitalsObserver.observe({
          entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint', 'navigation']
        });
      } catch (e) {
        console.warn('Some performance observations not supported:', e);
      }
    }
  }
  
  /**
   * Run comprehensive audit covering all aspects
   */
  public async runComprehensiveAudit(): Promise<ComprehensiveMetrics> {
    console.log('🚀 Starting comprehensive performance audit...');
    
    // Run basic performance audit
    const performanceMetrics = await this.performanceAuditor.runFullAudit();
    
    // Run accessibility audit
    const accessibilityIssues = await this.accessibilityAuditor.runAccessibilityAudit();
    const accessibilityScore = this.calculateAccessibilityScore(accessibilityIssues);
    
    // Measure image performance
    const imageMetrics = measureImagePerformance();
    
    // Measure Core Web Vitals
    const coreWebVitals = await this.measureCoreWebVitals();
    
    // Measure mobile-specific metrics
    const mobileMetrics = this.measureMobileMetrics();
    
    // Calculate WCAG compliance
    const wcagCompliance = this.calculateWCAGCompliance(accessibilityIssues);
    
    // Calculate overall scores
    const scores = this.calculateOverallScores(
      performanceMetrics,
      accessibilityScore,
      imageMetrics,
      coreWebVitals,
      mobileMetrics
    );
    
    const comprehensiveMetrics: ComprehensiveMetrics = {
      ...performanceMetrics,
      accessibilityScore,
      accessibilityIssues,
      wcagCompliance,
      imageMetrics: {
        totalImages: imageMetrics.totalImages,
        loadedImages: imageMetrics.loadedImages,
        errorImages: imageMetrics.errorImages,
        averageLoadTime: imageMetrics.loadTimes.length > 0 
          ? imageMetrics.loadTimes.reduce((a, b) => a + b, 0) / imageMetrics.loadTimes.length 
          : 0,
        largestContentfulPaint: imageMetrics.largestContentfulPaint
      },
      coreWebVitals,
      mobileMetrics,
      ...scores
    };
    
    console.log('📊 Comprehensive audit completed:', comprehensiveMetrics);
    
    return comprehensiveMetrics;
  }
  
  private calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');
    
    return Math.max(0, 100 - (
      criticalIssues.length * 25 +
      highIssues.length * 15 +
      mediumIssues.length * 10 +
      lowIssues.length * 5
    ));
  }
  
  private calculateWCAGCompliance(issues: AccessibilityIssue[]) {
    const levelAIssues = issues.filter(i => i.wcagLevel === 'A').length;
    const levelAAIssues = issues.filter(i => i.wcagLevel === 'AA').length;
    const levelAAAIssues = issues.filter(i => i.wcagLevel === 'AAA').length;
    
    return {
      levelA: Math.max(0, 100 - (levelAIssues * 20)),
      levelAA: Math.max(0, 100 - (levelAAIssues * 15)),
      levelAAA: Math.max(0, 100 - (levelAAAIssues * 10))
    };
  }
  
  private async measureCoreWebVitals() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const ttfb = navigation ? navigation.responseStart - navigation.requestStart : 0;
    
    return {
      lcp: this.metrics.coreWebVitals?.lcp || 0,
      fid: this.metrics.coreWebVitals?.fid || 0,
      cls: this.metrics.coreWebVitals?.cls || 0,
      fcp,
      ttfb
    };
  }
  
  private measureMobileMetrics() {
    // Touch target compliance
    const touchTargetScore = this.calculateTouchTargetScore();
    
    // Viewport optimization
    const viewportOptimization = this.calculateViewportOptimization();
    
    // Network efficiency
    const networkEfficiency = this.calculateNetworkEfficiency();
    
    // Battery impact estimation
    const batteryImpact = this.calculateBatteryImpact();
    
    return {
      touchTargetScore,
      viewportOptimization,
      networkEfficiency,
      batteryImpact
    };
  }
  
  private calculateTouchTargetScore(): number {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [onclick]');
    let compliantElements = 0;
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        compliantElements++;
      }
    });
    
    return interactiveElements.length > 0 
      ? (compliantElements / interactiveElements.length) * 100 
      : 100;
  }
  
  private calculateViewportOptimization(): number {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return 0;
    
    const content = viewport.getAttribute('content') || '';
    let score = 60; // Base score for having viewport meta
    
    if (content.includes('width=device-width')) score += 20;
    if (content.includes('initial-scale=1')) score += 10;
    if (content.includes('viewport-fit=cover')) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateNetworkEfficiency(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return 50;
    
    const totalTime = navigation.loadEventEnd - navigation.navigationStart;
    const resourceTime = navigation.domContentLoadedEventEnd - navigation.navigationStart;
    
    // Lower times = higher scores
    let score = 100;
    if (totalTime > 3000) score -= 30;
    if (totalTime > 5000) score -= 40;
    if (resourceTime > 2000) score -= 20;
    
    return Math.max(0, score);
  }
  
  private calculateBatteryImpact(): number {
    // Estimate based on animation complexity, event listeners, and performance
    let score = 100;
    
    // Check for expensive animations
    const animatedElements = document.querySelectorAll('[class*="animate"], [style*="animation"]');
    score -= animatedElements.length * 2;
    
    // Check for scroll listeners (potential battery drain)
    score -= document.querySelectorAll('[onscroll]').length * 5;
    
    // Performance impact
    const performanceScore = this.metrics.overallScore || 100;
    score = (score + performanceScore) / 2;
    
    return Math.max(0, score);
  }
  
  private calculateOverallScores(
    performanceMetrics: PerformanceMetrics,
    accessibilityScore: number,
    imageMetrics: any,
    coreWebVitals: any,
    mobileMetrics: any
  ) {
    // Mobile score calculation (weighted for mobile performance)
    const mobileScore = (
      performanceMetrics.overallScore * 0.3 +
      accessibilityScore * 0.2 +
      mobileMetrics.touchTargetScore * 0.2 +
      mobileMetrics.viewportOptimization * 0.1 +
      mobileMetrics.networkEfficiency * 0.1 +
      mobileMetrics.batteryImpact * 0.1
    );
    
    // Desktop score calculation
    const desktopScore = (
      performanceMetrics.overallScore * 0.4 +
      accessibilityScore * 0.3 +
      (100 - (imageMetrics.errorImages / Math.max(imageMetrics.totalImages, 1)) * 100) * 0.2 +
      (coreWebVitals.cls < 0.1 ? 100 : Math.max(0, 100 - coreWebVitals.cls * 1000)) * 0.1
    );
    
    // SEO score (basic)
    const seoScore = this.calculateSEOScore();
    
    // Best practices score
    const bestPracticesScore = this.calculateBestPracticesScore();
    
    return {
      mobileScore: Math.round(mobileScore),
      desktopScore: Math.round(desktopScore),
      accessibilityScore: Math.round(accessibilityScore),
      seoScore: Math.round(seoScore),
      bestPracticesScore: Math.round(bestPracticesScore)
    };
  }
  
  private calculateSEOScore(): number {
    let score = 100;
    
    // Check for title
    if (!document.title) score -= 20;
    
    // Check for meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) score -= 15;
    
    // Check for heading structure
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) score -= 15;
    if (h1s.length > 1) score -= 10;
    
    // Check for alt text on images
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt).length;
    score -= (imagesWithoutAlt / Math.max(images.length, 1)) * 20;
    
    return Math.max(0, score);
  }
  
  private calculateBestPracticesScore(): number {
    let score = 100;
    
    // Check for HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      score -= 20;
    }
    
    // Check for service worker
    if (!('serviceWorker' in navigator)) {
      score -= 15;
    }
    
    // Check for console errors
    const originalError = console.error;
    let errorCount = 0;
    console.error = (...args) => {
      errorCount++;
      originalError.apply(console, args);
    };
    
    setTimeout(() => {
      console.error = originalError;
      score -= Math.min(errorCount * 5, 30);
    }, 1000);
    
    return Math.max(0, score);
  }
  
  /**
   * Generate comprehensive report
   */
  public generateComprehensiveReport(metrics: ComprehensiveMetrics): string {
    return `
🎯 KORAUTO Comprehensive Performance Report
==========================================

📱 MOBILE PERFORMANCE: ${metrics.mobileScore}/100
🖥️  DESKTOP PERFORMANCE: ${metrics.desktopScore}/100
♿ ACCESSIBILITY: ${metrics.accessibilityScore}/100
🔍 SEO: ${metrics.seoScore}/100
✅ BEST PRACTICES: ${metrics.bestPracticesScore}/100

📊 Core Web Vitals:
- LCP (Largest Contentful Paint): ${metrics.coreWebVitals.lcp.toFixed(1)}ms
- FID (First Input Delay): ${metrics.coreWebVitals.fid.toFixed(1)}ms
- CLS (Cumulative Layout Shift): ${metrics.coreWebVitals.cls.toFixed(3)}
- FCP (First Contentful Paint): ${metrics.coreWebVitals.fcp.toFixed(1)}ms
- TTFB (Time to First Byte): ${metrics.coreWebVitals.ttfb.toFixed(1)}ms

🖼️ Image Performance:
- Total Images: ${metrics.imageMetrics.totalImages}
- Loaded Successfully: ${metrics.imageMetrics.loadedImages}
- Failed to Load: ${metrics.imageMetrics.errorImages}
- Average Load Time: ${metrics.imageMetrics.averageLoadTime.toFixed(1)}ms

📱 Mobile Optimization:
- Touch Target Compliance: ${metrics.mobileMetrics.touchTargetScore.toFixed(1)}%
- Viewport Optimization: ${metrics.mobileMetrics.viewportOptimization}%
- Network Efficiency: ${metrics.mobileMetrics.networkEfficiency}%
- Battery Impact Score: ${metrics.mobileMetrics.batteryImpact}%

♿ WCAG Compliance:
- Level A: ${metrics.wcagCompliance.levelA}%
- Level AA: ${metrics.wcagCompliance.levelAA}%
- Level AAA: ${metrics.wcagCompliance.levelAAA}%

⚠️  Accessibility Issues: ${metrics.accessibilityIssues.length}
${metrics.accessibilityIssues.length > 0 ? 
  '\n' + metrics.accessibilityIssues.slice(0, 5).map((issue, i) => 
    `${i + 1}. ${issue.element}: ${issue.issue} (${issue.severity})`
  ).join('\n') + 
  (metrics.accessibilityIssues.length > 5 ? `\n... and ${metrics.accessibilityIssues.length - 5} more` : '')
  : '✅ No accessibility issues found!'}

🚀 Performance Recommendations:
${this.generateRecommendations(metrics)}
`;
  }
  
  private generateRecommendations(metrics: ComprehensiveMetrics): string {
    const recommendations: string[] = [];
    
    if (metrics.mobileScore < 90) {
      recommendations.push('• Optimize for mobile performance - focus on touch targets and viewport');
    }
    
    if (metrics.coreWebVitals.lcp > 2500) {
      recommendations.push('• Improve Largest Contentful Paint - optimize images and reduce render blocking');
    }
    
    if (metrics.coreWebVitals.cls > 0.1) {
      recommendations.push('• Reduce Cumulative Layout Shift - set image dimensions and avoid layout changes');
    }
    
    if (metrics.imageMetrics.errorImages > 0) {
      recommendations.push('• Fix broken images and implement better error handling');
    }
    
    if (metrics.accessibilityScore < 95) {
      recommendations.push('• Address accessibility issues for WCAG compliance');
    }
    
    if (metrics.mobileMetrics.touchTargetScore < 95) {
      recommendations.push('• Ensure all interactive elements meet 44px minimum touch target size');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 Excellent performance! All metrics are within optimal ranges.');
    }
    
    return recommendations.join('\n');
  }
  
  /**
   * Clean up observers
   */
  public destroy() {
    this.performanceAuditor.destroy();
    this.accessibilityAuditor.destroy();
    if (this.coreWebVitalsObserver) {
      this.coreWebVitalsObserver.disconnect();
    }
  }
}

// Export utility functions
export const createComprehensiveAuditor = () => new ComprehensivePerformanceAuditor();

export const runQuickComprehensiveAudit = async (): Promise<ComprehensiveMetrics> => {
  const auditor = createComprehensiveAuditor();
  
  // Wait a bit for initial measurements
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const metrics = await auditor.runComprehensiveAudit();
  auditor.destroy();
  
  return metrics;
};

export default ComprehensivePerformanceAuditor;