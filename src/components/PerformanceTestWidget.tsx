import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Timer, Zap, Database, TrendingUp } from 'lucide-react';

export const PerformanceTestWidget: React.FC = () => {
  const {
    startTimer,
    endTimer,
    getMetrics,
    getCacheHitRate,
    logPerformanceReport,
    clearMetrics
  } = usePerformanceMonitor();

  const [metrics, setMetrics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const simulatePageLoad = async () => {
    setIsRunning(true);
    
    // Simulate various loading operations
    startTimer('page-load-test');
    startTimer('data-fetch-simulation');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    endTimer('data-fetch-simulation');
    
    startTimer('render-simulation');
    // Simulate rendering delay
    await new Promise(resolve => setTimeout(resolve, 50));
    endTimer('render-simulation');
    
    startTimer('scroll-restoration');
    // Simulate scroll restoration
    await new Promise(resolve => setTimeout(resolve, 10));
    endTimer('scroll-restoration');
    
    endTimer('page-load-test');
    setIsRunning(false);
    
    // Update metrics
    const currentMetrics = getMetrics();
    setMetrics(currentMetrics);
  };

  const simulateFilterChange = async () => {
    setIsRunning(true);
    
    startTimer('filter-change-test');
    
    // Simulate filter processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    endTimer('filter-change-test');
    setIsRunning(false);
    
    const currentMetrics = getMetrics();
    setMetrics(currentMetrics);
  };

  useEffect(() => {
    const currentMetrics = getMetrics();
    setMetrics(currentMetrics);
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Test and monitor loading performance improvements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={simulatePageLoad}
            disabled={isRunning}
            size="sm"
            className="text-xs"
          >
            <Timer className="h-3 w-3 mr-1" />
            Test Load
          </Button>
          
          <Button
            onClick={simulateFilterChange}
            disabled={isRunning}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Database className="h-3 w-3 mr-1" />
            Test Filters
          </Button>
        </div>

        {metrics && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Load Time:</span>
              <Badge variant="secondary" className="text-xs">
                {metrics.loadTime.toFixed(1)}ms
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Render Time:</span>
              <Badge variant="secondary" className="text-xs">
                {metrics.renderTime.toFixed(1)}ms
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">API Calls:</span>
              <Badge variant="secondary" className="text-xs">
                {metrics.apiCallTime.toFixed(1)}ms
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Cache Hit Rate:</span>
              <Badge 
                variant={getCacheHitRate() > 70 ? "default" : "destructive"} 
                className="text-xs"
              >
                {getCacheHitRate().toFixed(1)}%
              </Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={logPerformanceReport}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            View Report
          </Button>
          
          <Button
            onClick={() => {
              clearMetrics();
              setMetrics(getMetrics());
            }}
            size="sm"
            variant="ghost"
            className="text-xs"
          >
            Clear Data
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {isRunning ? (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Running test...
            </span>
          ) : (
            "Check console for detailed performance logs"
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceTestWidget;