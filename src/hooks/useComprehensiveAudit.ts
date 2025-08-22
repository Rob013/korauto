import { useState, useCallback } from 'react';
import { ComprehensivePerformanceAuditor, ComprehensiveMetrics, createComprehensiveAuditor } from '@/utils/comprehensiveAudit';

interface UseComprehensiveAuditOptions {
  enabled?: boolean;
  autoRun?: boolean;
}

export const useComprehensiveAudit = (options: UseComprehensiveAuditOptions = {}) => {
  const [auditor] = useState(() => options.enabled ? createComprehensiveAuditor() : null);
  const [metrics, setMetrics] = useState<ComprehensiveMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    enabled = true,
    autoRun = false
  } = options;

  // Run comprehensive audit
  const runAudit = useCallback(async () => {
    if (!auditor || !enabled) return null;

    setIsLoading(true);
    setError(null);
    
    try {
      const auditMetrics = await auditor.runComprehensiveAudit();
      setMetrics(auditMetrics);
      return auditMetrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Audit failed';
      setError(errorMessage);
      console.error('Comprehensive audit failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [auditor, enabled]);

  // Generate report
  const generateReport = useCallback(() => {
    if (!auditor || !metrics) return '';
    return auditor.generateComprehensiveReport(metrics);
  }, [auditor, metrics]);

  // Get specific score
  const getScore = useCallback((type: 'mobile' | 'desktop' | 'accessibility' | 'seo' | 'bestPractices') => {
    if (!metrics) return null;
    
    switch (type) {
      case 'mobile':
        return metrics.mobileScore;
      case 'desktop':
        return metrics.desktopScore;
      case 'accessibility':
        return metrics.accessibilityScore;
      case 'seo':
        return metrics.seoScore;
      case 'bestPractices':
        return metrics.bestPracticesScore;
      default:
        return null;
    }
  }, [metrics]);

  // Check if passing thresholds
  const isPassingThresholds = useCallback(() => {
    if (!metrics) return null;
    
    return {
      mobile: metrics.mobileScore >= 90,
      desktop: metrics.desktopScore >= 90,
      accessibility: metrics.accessibilityScore >= 95,
      seo: metrics.seoScore >= 90,
      bestPractices: metrics.bestPracticesScore >= 90,
      overall: metrics.mobileScore >= 90 && 
               metrics.desktopScore >= 90 && 
               metrics.accessibilityScore >= 95
    };
  }, [metrics]);

  // Get recommendations
  const getRecommendations = useCallback(() => {
    if (!metrics) return [];
    
    const recommendations: string[] = [];
    
    if (metrics.mobileScore < 90) {
      recommendations.push('Improve mobile performance');
    }
    
    if (metrics.desktopScore < 90) {
      recommendations.push('Optimize desktop performance');
    }
    
    if (metrics.accessibilityScore < 95) {
      recommendations.push('Fix accessibility issues');
    }
    
    if (metrics.coreWebVitals.lcp > 2500) {
      recommendations.push('Reduce Largest Contentful Paint');
    }
    
    if (metrics.coreWebVitals.cls > 0.1) {
      recommendations.push('Minimize Cumulative Layout Shift');
    }
    
    if (metrics.mobileMetrics.touchTargetScore < 95) {
      recommendations.push('Ensure proper touch target sizes');
    }
    
    return recommendations;
  }, [metrics]);

  return {
    metrics,
    isLoading,
    error,
    runAudit,
    generateReport,
    getScore,
    isPassingThresholds,
    getRecommendations,
    isEnabled: enabled && !!auditor
  };
};

export default useComprehensiveAudit;