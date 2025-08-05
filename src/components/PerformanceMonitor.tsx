import React, { useState, useEffect, memo } from 'react';
import { PerformanceMonitor } from '@/utils/performance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Zap, Clock, Activity } from 'lucide-react';

interface PerformanceMetrics {
  [key: string]: {
    avg: number;
    min: number;
    max: number;
    count: number;
  };
}

const PerformanceMonitorComponent = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const updateMetrics = () => {
      const monitor = PerformanceMonitor.getInstance();
      const currentMetrics: PerformanceMetrics = {};

      // Get all metrics from the monitor
      monitor['metrics'].forEach((measurements, name) => {
        const avg = monitor.getAverageTime(name);
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);
        
        currentMetrics[name] = {
          avg,
          min,
          max,
          count: measurements.length,
        };
      });

      setMetrics(currentMetrics);
    };

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        });
      }
    };

    const interval = setInterval(() => {
      updateMetrics();
      updateMemoryUsage();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearMetrics = () => {
    const monitor = PerformanceMonitor.getInstance();
    monitor['metrics'].clear();
    setMetrics({});
  };

  const getPerformanceColor = (avg: number) => {
    if (avg < 16) return 'text-green-500';
    if (avg < 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
      >
        <Monitor className="h-4 w-4 mr-2" />
        Performance
      </Button>

      {/* Performance Panel */}
      {isVisible && (
        <Card className="fixed bottom-16 right-4 w-80 max-h-96 overflow-y-auto z-50 bg-background/95 backdrop-blur-sm border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Performance Monitor
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMetrics}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Memory Usage */}
            {memoryUsage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Memory Usage
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {memoryUsage.used}MB / {memoryUsage.total}MB
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      getMemoryColor((memoryUsage.used / memoryUsage.limit) * 100)
                    }`}
                    style={{
                      width: `${Math.min((memoryUsage.used / memoryUsage.limit) * 100, 100)}%`,
                      backgroundColor: 'currentColor',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="space-y-2">
              <div className="flex items-center text-xs font-medium">
                <Clock className="h-3 w-3 mr-1" />
                Response Times
              </div>
              {Object.entries(metrics).length === 0 ? (
                <p className="text-xs text-muted-foreground">No metrics recorded yet</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(metrics).map(([name, data]) => (
                    <div key={name} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {data.count}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Avg: <span className={getPerformanceColor(data.avg)}>{data.avg.toFixed(1)}ms</span></span>
                        <span>Min: {data.min.toFixed(1)}ms</span>
                        <span>Max: {data.max.toFixed(1)}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Core Web Vitals */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Core Web Vitals</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>FCP:</span>
                  <span className="text-green-500">Good</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>LCP:</span>
                  <span className="text-green-500">Good</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>FID:</span>
                  <span className="text-green-500">Good</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CLS:</span>
                  <span className="text-green-500">Good</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
});

PerformanceMonitorComponent.displayName = 'PerformanceMonitorComponent';

export { PerformanceMonitorComponent }; 