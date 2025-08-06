import { useState, useEffect, useCallback } from 'react';
import { PerformanceAuditor, PerformanceMetrics, runQuickAudit } from '@/utils/performanceAudit';

export interface UsePerformanceAuditOptions {
  autoStart?: boolean;
  interval?: number; // Auto-audit interval in ms
  autoFix?: boolean; // Auto-apply fixes
}

export interface UsePerformanceAuditReturn {
  metrics: PerformanceMetrics | null;
  isAuditing: boolean;
  runAudit: () => Promise<void>;
  generateReport: () => string;
  applyFixes: () => Promise<number>;
  error: string | null;
}

export const usePerformanceAudit = (
  options: UsePerformanceAuditOptions = {}
): UsePerformanceAuditReturn => {
  const { autoStart = false, interval, autoFix = false } = options;
  
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditor] = useState(() => new PerformanceAuditor());

  const runAudit = useCallback(async () => {
    setIsAuditing(true);
    setError(null);
    
    try {
      console.log('🔍 Running performance audit...');
      const result = await auditor.runFullAudit();
      setMetrics(result);
      
      // Auto-apply fixes if enabled
      if (autoFix && result.alignmentIssues.length > 0) {
        const fixedCount = await auditor.applyAutoFixes(result.alignmentIssues);
        console.log(`🔧 Auto-fixed ${fixedCount} issues`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Performance audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  }, [auditor, autoFix]);

  const generateReport = useCallback(() => {
    if (!metrics) return 'No metrics available. Run an audit first.';
    return auditor.generateReport(metrics);
  }, [metrics, auditor]);

  const applyFixes = useCallback(async () => {
    if (!metrics || metrics.alignmentIssues.length === 0) return 0;
    
    try {
      const fixedCount = await auditor.applyAutoFixes(metrics.alignmentIssues);
      console.log(`🔧 Applied ${fixedCount} automatic fixes`);
      
      // Re-run audit to get updated metrics
      await runAudit();
      
      return fixedCount;
    } catch (err) {
      console.error('Failed to apply fixes:', err);
      return 0;
    }
  }, [metrics, auditor, runAudit]);

  // Auto-start audit on mount
  useEffect(() => {
    if (autoStart) {
      // Wait for component to mount completely
      const timer = setTimeout(runAudit, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, runAudit]);

  // Set up interval auditing
  useEffect(() => {
    if (interval && interval > 0) {
      const intervalId = setInterval(runAudit, interval);
      return () => clearInterval(intervalId);
    }
  }, [interval, runAudit]);

  // Cleanup auditor on unmount
  useEffect(() => {
    return () => {
      auditor.destroy();
    };
  }, [auditor]);

  return {
    metrics,
    isAuditing,
    runAudit,
    generateReport,
    applyFixes,
    error
  };
};

// Quick audit hook for one-time use
export const useQuickAudit = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const runQuickCheck = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await runQuickAudit();
      setMetrics(result);
      return result;
    } catch (err) {
      console.error('Quick audit failed:', err);
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

export default usePerformanceAudit;