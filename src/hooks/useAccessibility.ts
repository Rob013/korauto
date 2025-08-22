import { useState, useEffect, useCallback } from 'react';
import { AccessibilityAuditor, AccessibilityIssue, createAccessibilityAuditor } from '@/utils/accessibility';

interface UseAccessibilityOptions {
  enabled?: boolean;
  autoFix?: boolean;
  announcements?: boolean;
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const [auditor, setAuditor] = useState<AccessibilityAuditor | null>(null);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const {
    enabled = true,
    autoFix = false,
    announcements = true
  } = options;

  // Initialize auditor
  useEffect(() => {
    if (enabled) {
      const newAuditor = createAccessibilityAuditor({
        announcements,
        skipLinks: true,
        focusManagement: true,
        colorContrast: true,
        keyboardNavigation: true
      });
      setAuditor(newAuditor);

      return () => {
        newAuditor.destroy();
      };
    }
  }, [enabled, announcements]);

  // Run accessibility audit
  const runAudit = useCallback(async () => {
    if (!auditor) return;

    setIsLoading(true);
    try {
      const auditIssues = await auditor.runAccessibilityAudit();
      setIssues(auditIssues);

      // Calculate score
      const criticalIssues = auditIssues.filter(i => i.severity === 'critical');
      const highIssues = auditIssues.filter(i => i.severity === 'high');
      const mediumIssues = auditIssues.filter(i => i.severity === 'medium');
      const lowIssues = auditIssues.filter(i => i.severity === 'low');

      const calculatedScore = Math.max(0, 100 - (
        criticalIssues.length * 25 +
        highIssues.length * 15 +
        mediumIssues.length * 10 +
        lowIssues.length * 5
      ));
      
      setScore(calculatedScore);

      // Auto-fix if enabled
      if (autoFix && auditIssues.length > 0) {
        const fixed = await auditor.applyAutoFixes(auditIssues);
        if (fixed > 0) {
          auditor.announce(`Fixed ${fixed} accessibility issues automatically`);
          // Re-run audit after fixes
          setTimeout(() => runAudit(), 1000);
        }
      }

    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [auditor, autoFix]);

  // Announce message to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (auditor) {
      auditor.announce(message, priority);
    }
  }, [auditor]);

  // Apply fixes manually
  const applyFixes = useCallback(async () => {
    if (!auditor || issues.length === 0) return 0;

    const fixed = await auditor.applyAutoFixes(issues);
    if (fixed > 0) {
      announce(`Fixed ${fixed} accessibility issues`);
      // Re-run audit after fixes
      setTimeout(() => runAudit(), 1000);
    }
    return fixed;
  }, [auditor, issues, announce, runAudit]);

  // Generate report
  const generateReport = useCallback(() => {
    if (!auditor) return '';
    return auditor.generateReport(issues);
  }, [auditor, issues]);

  return {
    issues,
    score,
    isLoading,
    runAudit,
    announce,
    applyFixes,
    generateReport,
    isEnabled: enabled && !!auditor
  };
};

export default useAccessibility;