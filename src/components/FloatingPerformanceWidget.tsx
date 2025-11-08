import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuickAudit } from "@/hooks/usePerformanceAudit";
import { 
  Activity, 
  X, 
  Minimize2, 
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle
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

  // Auto-run audit on mount
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(runQuickCheck, 2000);
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
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm floating-animation`}>
      <Card className="shadow-2xl border-2 glass-card hover-lift-gentle transition-all duration-300">
        <CardContent className="p-3">
          {isMinimized ? (
            // Minimized view
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                <span className="text-sm font-medium">Performanca</span>
                {metrics && (
                  <Badge 
                    variant="secondary" 
                    className={`${getScoreColor(metrics.overallScore)} text-white text-xs hover-scale-gentle`}
                  >
                    {metrics.overallScore.toFixed(0)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={runQuickCheck}
                  disabled={isLoading}
                  className="h-6 w-6 p-0 hover-scale-gentle"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(false)}
                  className="h-6 w-6 p-0 hover-scale-gentle"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0 hover-scale-gentle"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            // Expanded view
            <div className="space-y-3 animate-scale-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                  <span className="font-medium">Monitor i Performancës</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 p-0 hover-scale-gentle"
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

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm">Analyzing...</span>
                </div>
              ) : metrics ? (
                <div className="space-y-2">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Score</span>
                    <Badge 
                      variant="secondary" 
                      className={`${getScoreColor(metrics.overallScore)} text-white`}
                    >
                      {metrics.overallScore.toFixed(1)}/100
                    </Badge>
                  </div>

                  {/* Quick metrics */}
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

                  {/* Issues summary */}
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

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={runQuickCheck}
                      disabled={isLoading}
                      className="flex-1 text-xs h-7"
                    >
                      Re-scan
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/performance'}
                      className="flex-1 text-xs h-7"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button size="sm" onClick={runQuickCheck}>
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