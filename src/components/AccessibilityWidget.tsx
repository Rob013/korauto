import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccessibility } from "@/hooks/useAccessibility";
import { 
  Eye, 
  X, 
  Minimize2, 
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Shield
} from "lucide-react";

interface AccessibilityWidgetProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const AccessibilityWidget = ({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-left' 
}: AccessibilityWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isVisible, setIsVisible] = useState(enabled);
  const { issues, score, isLoading, runAudit, applyFixes, isEnabled } = useAccessibility({
    enabled,
    autoFix: false,
    announcements: true
  });

  // Auto-run audit on mount
  useEffect(() => {
    if (isEnabled) {
      const timer = setTimeout(runAudit, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEnabled, runAudit]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4', 
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (!isVisible || !isEnabled) return null;

  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-gray-500";
    if (score >= 95) return "bg-green-500";
    if (score >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm`}>
      <Card className="shadow-2xl border-2">
        <CardContent className="p-3">
          {isMinimized ? (
            // Minimized view
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">A11y</span>
                {score !== null && (
                  <Badge 
                    variant="secondary" 
                    className={`${getScoreColor(score)} text-white text-xs`}
                  >
                    {score.toFixed(0)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={runAudit}
                  disabled={isLoading}
                  className="h-6 w-6 p-0"
                  aria-label="Run accessibility audit"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(false)}
                  className="h-6 w-6 p-0"
                  aria-label="Expand accessibility widget"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0"
                  aria-label="Close accessibility widget"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            // Expanded view
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Accessibility</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 p-0"
                    aria-label="Minimize accessibility widget"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsVisible(false)}
                    className="h-6 w-6 p-0"
                    aria-label="Close accessibility widget"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm">Auditing...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accessibility Score</span>
                    <Badge 
                      variant="secondary" 
                      className={`${getScoreColor(score)} text-white`}
                    >
                      {score?.toFixed(1) || 'N/A'}/100
                    </Badge>
                  </div>

                  {/* WCAG Compliance */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <span className="text-muted-foreground block">Level A</span>
                      <div className={issues.filter(i => i.wcagLevel === 'A').length === 0 ? 'text-green-600' : 'text-red-600'}>
                        {issues.filter(i => i.wcagLevel === 'A').length === 0 ? '✓' : issues.filter(i => i.wcagLevel === 'A').length}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-muted-foreground block">Level AA</span>
                      <div className={issues.filter(i => i.wcagLevel === 'AA').length === 0 ? 'text-green-600' : 'text-red-600'}>
                        {issues.filter(i => i.wcagLevel === 'AA').length === 0 ? '✓' : issues.filter(i => i.wcagLevel === 'AA').length}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-muted-foreground block">Level AAA</span>
                      <div className={issues.filter(i => i.wcagLevel === 'AAA').length === 0 ? 'text-green-600' : 'text-red-600'}>
                        {issues.filter(i => i.wcagLevel === 'AAA').length === 0 ? '✓' : issues.filter(i => i.wcagLevel === 'AAA').length}
                      </div>
                    </div>
                  </div>

                  {/* Issue Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Critical</span>
                      <div className={criticalIssues.length === 0 ? 'text-green-600' : 'text-red-600'}>
                        {criticalIssues.length}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">High</span>
                      <div className={highIssues.length === 0 ? 'text-green-600' : 'text-red-600'}>
                        {highIssues.length}
                      </div>
                    </div>
                  </div>

                  {/* Issues summary */}
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Issues</span>
                    <div className="flex items-center gap-1">
                      {issues.length === 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span>{issues.length}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={runAudit}
                      disabled={isLoading}
                      className="flex-1 text-xs h-7"
                      aria-label="Re-run accessibility audit"
                    >
                      Re-scan
                    </Button>
                    {issues.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={applyFixes}
                        className="flex-1 text-xs h-7"
                        aria-label="Apply automatic accessibility fixes"
                      >
                        Auto-Fix
                      </Button>
                    )}
                  </div>

                  {/* Quick recommendations */}
                  {issues.length > 0 && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <div className="font-medium mb-1">Quick Fixes:</div>
                      <ul className="space-y-1">
                        {criticalIssues.slice(0, 2).map((issue, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-red-500">•</span>
                            <span className="line-clamp-2">{issue.suggestedFix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessibilityWidget;