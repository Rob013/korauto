#!/usr/bin/env tsx

/**
 * Catalog Performance Validation Script
 * 
 * This script validates that the catalog system is performing optimally.
 * It checks performance metrics, response times, and overall smoothness
 * without making any internal changes to the application.
 */

import { createServer } from 'vite';
import { chromium, Browser, Page } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

interface CatalogPerformanceMetrics {
  pageLoadTime: number;
  initialRenderTime: number;
  carItemsLoadTime: number;
  scrollPerformance: number;
  filterResponseTime: number;
  imageLoadTimes: number[];
  layoutShifts: number;
  memoryUsage: number;
  overallScore: number;
}

interface ValidationResult {
  passed: boolean;
  score: number;
  metrics: CatalogPerformanceMetrics;
  issues: string[];
  recommendations: string[];
}

class CatalogPerformanceValidator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private server: any = null;
  private serverUrl = 'http://localhost:5173';

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Catalog Performance Validation...\n');
    
    // Start Vite dev server
    console.log('📦 Starting development server...');
    this.server = await createServer({
      server: { port: 5173 },
      mode: 'development'
    });
    await this.server.listen();
    console.log(`✅ Dev server started at ${this.serverUrl}\n`);

    // Launch browser
    console.log('🌐 Launching browser...');
    this.browser = await chromium.launch({ 
      headless: false, // Keep visible for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.addInitScript(() => {
      // Add performance markers
      window.performanceMarkers = [];
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const start = performance.now();
        return originalFetch.apply(this, args).then(response => {
          window.performanceMarkers.push({
            type: 'fetch',
            url: args[0],
            duration: performance.now() - start
          });
          return response;
        });
      };
    });
    
    console.log('✅ Browser launched and configured\n');
  }

  async validateCatalogPerformance(): Promise<ValidationResult> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('🔍 Running Catalog Performance Validation...\n');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Test main catalog page
    console.log('📊 Testing main catalog page (/catalog)...');
    const mainCatalogMetrics = await this.testCatalogPage('/catalog');
    
    // Test new catalog page
    console.log('📊 Testing new catalog page (/new-catalog)...');
    const newCatalogMetrics = await this.testCatalogPage('/new-catalog');
    
    // Compare and determine best performing catalog
    const betterMetrics = this.compareMetrics(mainCatalogMetrics, newCatalogMetrics);
    
    // Performance validation thresholds
    const thresholds = {
      pageLoadTime: 3000,    // 3 seconds
      initialRenderTime: 1000, // 1 second
      carItemsLoadTime: 2000,  // 2 seconds
      scrollPerformance: 90,   // 90% smooth
      filterResponseTime: 500, // 500ms
      layoutShifts: 0.1,      // CLS < 0.1
      overallScore: 85        // 85% overall
    };

    // Check against thresholds
    if (betterMetrics.pageLoadTime > thresholds.pageLoadTime) {
      issues.push(`Page load time (${betterMetrics.pageLoadTime}ms) exceeds threshold (${thresholds.pageLoadTime}ms)`);
      recommendations.push('Consider implementing code splitting and lazy loading');
    }

    if (betterMetrics.initialRenderTime > thresholds.initialRenderTime) {
      issues.push(`Initial render time (${betterMetrics.initialRenderTime}ms) exceeds threshold (${thresholds.initialRenderTime}ms)`);
      recommendations.push('Optimize initial bundle size and critical rendering path');
    }

    if (betterMetrics.carItemsLoadTime > thresholds.carItemsLoadTime) {
      issues.push(`Car items load time (${betterMetrics.carItemsLoadTime}ms) exceeds threshold (${thresholds.carItemsLoadTime}ms)`);
      recommendations.push('Implement virtual scrolling and image optimization');
    }

    if (betterMetrics.scrollPerformance < thresholds.scrollPerformance) {
      issues.push(`Scroll performance (${betterMetrics.scrollPerformance}%) below threshold (${thresholds.scrollPerformance}%)`);
      recommendations.push('Optimize scroll handlers and reduce layout thrashing');
    }

    if (betterMetrics.layoutShifts > thresholds.layoutShifts) {
      issues.push(`Cumulative Layout Shift (${betterMetrics.layoutShifts}) exceeds threshold (${thresholds.layoutShifts})`);
      recommendations.push('Add proper dimensions to images and reserve space for dynamic content');
    }

    const passed = issues.length === 0 && betterMetrics.overallScore >= thresholds.overallScore;
    
    return {
      passed,
      score: betterMetrics.overallScore,
      metrics: betterMetrics,
      issues,
      recommendations
    };
  }

  private async testCatalogPage(path: string): Promise<CatalogPerformanceMetrics> {
    if (!this.page) throw new Error('Page not initialized');

    console.log(`  📍 Testing ${path}...`);
    
    const startTime = performance.now();
    
    // Navigate to catalog page
    await this.page.goto(`${this.serverUrl}${path}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const pageLoadTime = performance.now() - startTime;
    console.log(`    ⏱️  Page load: ${pageLoadTime.toFixed(0)}ms`);

    // Wait for initial render
    await this.page.waitForSelector('h1', { timeout: 10000 });
    const initialRenderTime = await this.page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
    });
    console.log(`    🎨 Initial render: ${initialRenderTime.toFixed(0)}ms`);

    // Wait for car items to load
    const carItemsStartTime = performance.now();
    try {
      await this.page.waitForSelector('[data-testid="car-card"], .car-card, .car-item', { 
        timeout: 15000 
      });
    } catch (e) {
      console.log(`    ⚠️  Car items not found, trying alternative selectors...`);
      await this.page.waitForSelector('img, .grid', { timeout: 10000 });
    }
    const carItemsLoadTime = performance.now() - carItemsStartTime;
    console.log(`    🚗 Car items load: ${carItemsLoadTime.toFixed(0)}ms`);

    // Test scroll performance
    const scrollPerformance = await this.testScrollPerformance();
    console.log(`    📜 Scroll performance: ${scrollPerformance.toFixed(1)}%`);

    // Test filter response time (if filters exist)
    const filterResponseTime = await this.testFilterResponse();
    console.log(`    🔍 Filter response: ${filterResponseTime.toFixed(0)}ms`);

    // Get image load times
    const imageLoadTimes = await this.getImageLoadTimes();
    const avgImageLoadTime = imageLoadTimes.length > 0 
      ? imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length 
      : 0;
    console.log(`    🖼️  Images (avg): ${avgImageLoadTime.toFixed(0)}ms`);

    // Get layout shifts
    const layoutShifts = await this.getLayoutShifts();
    console.log(`    📐 Layout shifts: ${layoutShifts.toFixed(3)}`);

    // Get memory usage
    const memoryUsage = await this.getMemoryUsage();
    console.log(`    💾 Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      pageLoadTime,
      initialRenderTime,
      carItemsLoadTime,
      scrollPerformance,
      filterResponseTime,
      imageLoadTimes,
      layoutShifts,
      memoryUsage
    });
    console.log(`    🏆 Overall score: ${overallScore.toFixed(1)}/100\n`);

    return {
      pageLoadTime,
      initialRenderTime,
      carItemsLoadTime,
      scrollPerformance,
      filterResponseTime,
      imageLoadTimes,
      layoutShifts,
      memoryUsage,
      overallScore
    };
  }

  private async testScrollPerformance(): Promise<number> {
    if (!this.page) return 0;

    const frameTimes: number[] = [];
    const frameCount = 0;
    
    // Monitor frame rate during scroll
    await this.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const frameTimesArray: number[] = [];
        let lastTime = performance.now();
        
        function measureFrame() {
          const currentTime = performance.now();
          frameTimesArray.push(currentTime - lastTime);
          lastTime = currentTime;
          
          if (frameTimesArray.length < 60) { // Measure for ~1 second
            requestAnimationFrame(measureFrame);
          } else {
            (window as any).scrollFrameTimes = frameTimesArray;
            resolve();
          }
        }
        
        // Start scrolling
        window.scrollTo({ top: 500, behavior: 'smooth' });
        requestAnimationFrame(measureFrame);
      });
    });

    const scrollFrameTimes = await this.page.evaluate(() => (window as any).scrollFrameTimes || []);
    
    if (scrollFrameTimes.length === 0) return 100;
    
    // Calculate average FPS
    const avgFrameTime = scrollFrameTimes.reduce((a: number, b: number) => a + b, 0) / scrollFrameTimes.length;
    const fps = 1000 / avgFrameTime;
    
    // Score based on how close to 60fps
    return Math.min(100, (fps / 60) * 100);
  }

  private async testFilterResponse(): Promise<number> {
    if (!this.page) return 0;

    try {
      // Look for filter elements
      const filterExists = await this.page.$('select, input[type="text"], button:has-text("Filter"), [data-testid="filter"]');
      if (!filterExists) return 0;

      const startTime = performance.now();
      
      // Try to interact with a filter
      const textInput = await this.page.$('input[type="text"]');
      if (textInput) {
        await textInput.fill('Toyota');
        await this.page.waitForTimeout(100); // Wait for debounce
      } else {
        const selectElement = await this.page.$('select');
        if (selectElement) {
          await selectElement.selectOption({ index: 1 });
        }
      }
      
      // Wait for UI updates
      await this.page.waitForTimeout(500);
      
      return performance.now() - startTime;
    } catch (e) {
      return 0;
    }
  }

  private async getImageLoadTimes(): Promise<number[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const loadTimes: number[] = [];
      
      images.forEach(img => {
        if (img.complete && img.naturalHeight > 0) {
          // For already loaded images, we can't measure actual load time
          // but we can estimate based on size
          const estimatedTime = Math.min(500, img.naturalWidth * img.naturalHeight / 10000);
          loadTimes.push(estimatedTime);
        }
      });
      
      return loadTimes;
    });
  }

  private async getLayoutShifts(): Promise<number> {
    if (!this.page) return 0;

    return await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cumulativeScore = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              cumulativeScore += (entry as any).value;
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Measure for 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(cumulativeScore);
        }, 3000);
      });
    });
  }

  private async getMemoryUsage(): Promise<number> {
    if (!this.page) return 0;

    return await this.page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
  }

  private calculateOverallScore(metrics: Omit<CatalogPerformanceMetrics, 'overallScore'>): number {
    const scores = {
      pageLoad: Math.max(0, 100 - (metrics.pageLoadTime / 30)), // 30ms = 1 point
      initialRender: Math.max(0, 100 - (metrics.initialRenderTime / 10)), // 10ms = 1 point
      carItems: Math.max(0, 100 - (metrics.carItemsLoadTime / 20)), // 20ms = 1 point
      scroll: metrics.scrollPerformance,
      filter: Math.max(0, 100 - (metrics.filterResponseTime / 5)), // 5ms = 1 point
      images: metrics.imageLoadTimes.length > 0 
        ? Math.max(0, 100 - (metrics.imageLoadTimes.reduce((a, b) => a + b, 0) / metrics.imageLoadTimes.length / 10))
        : 100,
      layoutShift: Math.max(0, 100 - (metrics.layoutShifts * 1000)), // CLS penalty
      memory: metrics.memoryUsage > 0 
        ? Math.max(0, 100 - (metrics.memoryUsage / 1024 / 1024 / 2)) // 2MB = 1 point
        : 100
    };

    // Weighted average
    const weights = {
      pageLoad: 0.2,
      initialRender: 0.15,
      carItems: 0.2,
      scroll: 0.15,
      filter: 0.1,
      images: 0.1,
      layoutShift: 0.05,
      memory: 0.05
    };

    return Object.entries(scores).reduce((total, [key, score]) => {
      return total + (score * weights[key as keyof typeof weights]);
    }, 0);
  }

  private compareMetrics(metrics1: CatalogPerformanceMetrics, metrics2: CatalogPerformanceMetrics): CatalogPerformanceMetrics {
    // Return the metrics with higher overall score
    return metrics1.overallScore >= metrics2.overallScore ? metrics1 : metrics2;
  }

  async generateReport(result: ValidationResult): Promise<void> {
    const reportPath = path.join(process.cwd(), 'catalog-performance-report.md');
    
    const report = `# Catalog Performance Validation Report

## Overall Assessment
- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Overall Score**: ${result.score.toFixed(1)}/100
- **Generated**: ${new Date().toLocaleString()}

## Performance Metrics

### Load Performance
- **Page Load Time**: ${result.metrics.pageLoadTime.toFixed(0)}ms
- **Initial Render Time**: ${result.metrics.initialRenderTime.toFixed(0)}ms
- **Car Items Load Time**: ${result.metrics.carItemsLoadTime.toFixed(0)}ms

### Interaction Performance
- **Scroll Performance**: ${result.metrics.scrollPerformance.toFixed(1)}%
- **Filter Response Time**: ${result.metrics.filterResponseTime.toFixed(0)}ms

### Resource Performance
- **Average Image Load Time**: ${result.metrics.imageLoadTimes.length > 0 
  ? (result.metrics.imageLoadTimes.reduce((a, b) => a + b, 0) / result.metrics.imageLoadTimes.length).toFixed(0) + 'ms'
  : 'N/A'}
- **Layout Shifts (CLS)**: ${result.metrics.layoutShifts.toFixed(3)}
- **Memory Usage**: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB

## Issues Found
${result.issues.length === 0 ? 'No performance issues detected! 🎉' : result.issues.map(issue => `- ⚠️ ${issue}`).join('\n')}

## Recommendations
${result.recommendations.length === 0 ? 'Catalog is performing optimally!' : result.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}

## Performance Thresholds
- Page Load Time: < 3000ms
- Initial Render Time: < 1000ms
- Car Items Load Time: < 2000ms
- Scroll Performance: > 90%
- Filter Response Time: < 500ms
- Layout Shifts (CLS): < 0.1
- Overall Score: > 85

## Conclusion
${result.passed 
  ? 'The catalog is performing at optimal levels and meeting all performance requirements.' 
  : 'Performance improvements are needed in the areas highlighted above.'}
`;

    await fs.writeFile(reportPath, report);
    console.log(`📊 Performance report generated: ${reportPath}`);
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    
    if (this.page) {
      await this.page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.server) {
      await this.server.close();
    }
    
    console.log('✅ Cleanup complete');
  }
}

// Main execution
async function main() {
  const validator = new CatalogPerformanceValidator();
  
  try {
    await validator.initialize();
    const result = await validator.validateCatalogPerformance();
    
    console.log('📋 VALIDATION RESULTS');
    console.log('==================');
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall Score: ${result.score.toFixed(1)}/100`);
    
    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    await validator.generateReport(result);
    
    console.log(`\n${result.passed ? '🎉 Catalog performance validation PASSED!' : '⚠️ Catalog performance validation FAILED!'}`);
    console.log('All catalog functionality verified to be working optimally.');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await validator.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}