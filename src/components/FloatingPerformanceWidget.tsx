import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuickAudit } from "@/hooks/usePerformanceAudit";
import { useQuickAccessibilityAudit } from "@/hooks/useAccessibilityAudit";
import { 
  Activity, 
  X, 
  Minimize2, 
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye
} from "lucide-react";

interface FloatingPerformanceWidgetProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const FloatingPerformanceWidget = ({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right' 
}: FloatingPerformanceWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isVisible, setIsVisible] = useState(enabled);
  const { metrics, isLoading, runQuickCheck } = useQuickAudit();
  const { metrics: accessibilityMetrics, isLoading: isLoadingA11y, runQuickCheck: runA11yCheck } = useQuickAccessibilityAudit();

  // Auto-run audits on mount
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => {
        runQuickCheck();
        runA11yCheck();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [enabled, runQuickCheck]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4', 
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm`}>
      <Card className="shadow-2xl border-2">
        <CardContent className="p-3">
          {isMinimized ? (
            // Minimized view
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Performance</span>
                {metrics && (
                  <Badge 
                    variant="secondary" 
                    className={`${getScoreColor(metrics.overallScore)} text-white text-xs`}
                  >
                    {metrics.overallScore.toFixed(0)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">A11y</span>
                {accessibilityMetrics && (
                  <Badge 
                    variant="secondary" 
                    className={`${getScoreColor(accessibilityMetrics.overallScore)} text-white text-xs`}
                  >
                    {accessibilityMetrics.overallScore.toFixed(0)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    runQuickCheck();
                    runA11yCheck();
                  }}
                  disabled={isLoading || isLoadingA11y}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${(isLoading || isLoadingA11y) ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(false)}
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0"
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
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Performance Monitor</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsVisible(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {(isLoading || isLoadingA11y) ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm">Analyzing...</span>
                </div>
              ) : metrics || accessibilityMetrics ? (
                <div className="space-y-3">
                  {/* Performance Section */}
                  {metrics && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span>Performance</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Score</span>
                        <Badge 
                          variant="secondary" 
                          className={`${getScoreColor(metrics.overallScore)} text-white`}
                        >
                          {metrics.overallScore.toFixed(1)}/100
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Layout Shifts</span>
                          <div className={metrics.layoutShifts < 0.1 ? 'text-green-600' : 'text-red-600'}>
                            {metrics.layoutShifts.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Animation</span>
                          <div className={metrics.animationFrameRate >= 90 ? 'text-green-600' : 'text-red-600'}>
                            {metrics.animationFrameRate.toFixed(0)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Images</span>
                          <div className={metrics.imageLoadTime < 1000 ? 'text-green-600' : 'text-red-600'}>
                            {metrics.imageLoadTime.toFixed(0)}ms
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Scroll</span>
                          <div className={metrics.scrollPerformance >= 90 ? 'text-green-600' : 'text-red-600'}>
                            {metrics.scrollPerformance.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>Issues Found</span>
                        <div className="flex items-center gap-1">
                          {metrics.alignmentIssues.length === 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              <span>{metrics.alignmentIssues.length}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Accessibility Section */}
                  {accessibilityMetrics && (
                    <div className="space-y-2 border-t pt-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Eye className="h-4 w-4 text-purple-500" />
                        <span>Accessibility</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Score</span>
                        <Badge 
                          variant="secondary" 
                          className={`${getScoreColor(accessibilityMetrics.overallScore)} text-white`}
                        >
                          {accessibilityMetrics.overallScore.toFixed(1)}/100
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Checks Passed</span>
                          <div className="text-green-600">
                            {accessibilityMetrics.passedChecks}/{accessibilityMetrics.totalChecks}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Issues</span>
                          <div className={accessibilityMetrics.issues.length === 0 ? 'text-green-600' : 'text-red-600'}>
                            {accessibilityMetrics.issues.length}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>WCAG Level</span>
                        <div className="text-sm">
                          {accessibilityMetrics.overallScore >= 95 ? 'AAA' : 
                           accessibilityMetrics.overallScore >= 85 ? 'AA' : 'A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        runQuickCheck();
                        runA11yCheck();
                      }}
                      disabled={isLoading || isLoadingA11y}
                      className="flex-1 text-xs h-7"
                    >
                      Re-scan
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('/performance', '_blank')}
                      className="flex-1 text-xs h-7"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button size="sm" onClick={() => {
                    runQuickCheck();
                    runA11yCheck();
                  }}>
                    Run Quick Audit
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FloatingPerformanceWidget;