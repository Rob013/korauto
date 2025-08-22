import { useState, useCallback } from 'react';
import { AccessibilityAuditor, AccessibilityMetrics, runQuickAccessibilityAudit } from '@/utils/accessibilityAudit';

export interface UseAccessibilityAuditOptions {
  autoStart?: boolean;
  autoFix?: boolean; // Auto-apply fixes
}

export interface UseAccessibilityAuditReturn {
  metrics: AccessibilityMetrics | null;
  isAuditing: boolean;
  runAudit: () => Promise<void>;
  generateReport: () => string;
  applyFixes: () => Promise<number>;
  error: string | null;
}

export const useAccessibilityAudit = (
  options: UseAccessibilityAuditOptions = {}
): UseAccessibilityAuditReturn => {
  const { autoStart = false, autoFix = false } = options;
  
  const [metrics, setMetrics] = useState<AccessibilityMetrics | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditor] = useState(() => new AccessibilityAuditor());

  const runAudit = useCallback(async () => {
    setIsAuditing(true);
    setError(null);
    
    try {
      console.log('🔍 Running accessibility audit...');
      const result = await auditor.runAccessibilityAudit();
      setMetrics(result);
      
      // Auto-apply fixes if enabled
      if (autoFix && result.issues.length > 0) {
        const fixedCount = await auditor.applyAccessibilityFixes(result.issues);
        console.log(`🔧 Auto-fixed ${fixedCount} accessibility issues`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Accessibility audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  }, [auditor, autoFix]);

  const generateReport = useCallback(() => {
    if (!metrics) return 'No metrics available. Run an audit first.';
    return auditor.generateAccessibilityReport(metrics);
  }, [metrics, auditor]);

  const applyFixes = useCallback(async () => {
    if (!metrics || metrics.issues.length === 0) return 0;
    
    try {
      const fixedCount = await auditor.applyAccessibilityFixes(metrics.issues);
      console.log(`🔧 Applied ${fixedCount} automatic accessibility fixes`);
      
      // Re-run audit to get updated metrics
      await runAudit();
      
      return fixedCount;
    } catch (err) {
      console.error('Failed to apply accessibility fixes:', err);
      return 0;
    }
  }, [metrics, auditor, runAudit]);

  return {
    metrics,
    isAuditing,
    runAudit,
    generateReport,
    applyFixes,
    error
  };
};

// Quick accessibility audit hook for one-time use
export const useQuickAccessibilityAudit = () => {
  const [metrics, setMetrics] = useState<AccessibilityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const runQuickCheck = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await runQuickAccessibilityAudit();
      setMetrics(result);
      return result;
    } catch (err) {
      console.error('Quick accessibility audit failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    metrics,
    isLoading,
    runQuickCheck
  };
};

export default useAccessibilityAudit;