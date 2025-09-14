/**
 * Performance Monitor Component for 120fps tracking and optimization
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFrameRate } from '@/hooks/useFrameRate';
import { 
  Activity, 
  Zap, 
  Monitor, 
  Gauge, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  layoutShifts: number;
  energyEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
}

export const PerformanceMonitor: React.FC<{ 
  showDetails?: boolean;
  onClose?: () => void;
}> = ({ showDetails = false, onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    layoutShifts: 0,
    energyEfficiency: 'good'
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { currentFPS, targetFPS, supportsHighRefreshRate, capabilities } = useFrameRate();

  useEffect(() => {
    let animationId: number;
    let startTime = performance.now();
    let frameCount = 0;
    let lastTime = startTime;

    const measurePerformance = () => {
      if (!isMonitoring) return;

      frameCount++;
      const currentTime = performance.now();

      // Update FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Get memory usage if available
        const memory = (performance as any).memory;
        const memoryUsage = memory ? 
          Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : 0;

        // Calculate energy efficiency based on FPS vs target
        let energyEfficiency: PerformanceMetrics['energyEfficiency'] = 'good';
        const fpsRatio = fps / targetFPS;
        
        if (fpsRatio >= 0.95) energyEfficiency = 'excellent';
        else if (fpsRatio >= 0.85) energyEfficiency = 'good';
        else if (fpsRatio >= 0.7) energyEfficiency = 'fair';
        else energyEfficiency = 'poor';

        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage,
          loadTime: currentTime - startTime,
          energyEfficiency
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    if (isMonitoring) {
      animationId = requestAnimationFrame(measurePerformance);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isMonitoring, targetFPS]);

  // Monitor layout shifts
  useEffect(() => {
    if (!isMonitoring) return;

    let observer: PerformanceObserver;
    
    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver((list) => {
        let cumulativeShift = 0;
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            cumulativeShift += (entry as any).value;
          }
        }
        
        setMetrics(prev => ({
          ...prev,
          layoutShifts: prev.layoutShifts + cumulativeShift
        }));
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('Layout shift observation not supported');
      }
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isMonitoring]);

  const getPerformanceColor = (value: number, good: number, excellent: number) => {
    if (value >= excellent) return 'text-green-600';
    if (value >= good) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEnergyEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatNumber = (num: number, decimals = 0) => {
    return Number(num.toFixed(decimals)).toLocaleString();
  };

  if (!showDetails) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64 glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
                className="h-6 w-6 p-0"
              >
                {isMonitoring ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">FPS</span>
                <Badge 
                  variant={currentFPS >= targetFPS * 0.9 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {currentFPS}/{targetFPS}
                </Badge>
              </div>
              
              {supportsHighRefreshRate && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">High Refresh</span>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
              )}
              
              {isMonitoring && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Memory</span>
                  <span className={`text-xs ${getPerformanceColor(100 - metrics.memoryUsage, 70, 85)}`}>
                    {metrics.memoryUsage}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Performance Monitor
          {supportsHighRefreshRate && (
            <Badge variant="secondary" className="ml-2">120fps Ready</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Frame Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              <span className="text-sm font-medium">Frame Rate</span>
            </div>
            <div className="text-2xl font-bold">
              <span className={getPerformanceColor(currentFPS, targetFPS * 0.8, targetFPS * 0.95)}>
                {currentFPS}
              </span>
              <span className="text-sm text-muted-foreground ml-1">/ {targetFPS} fps</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {targetFPS}fps
              {supportsHighRefreshRate && ' (High Refresh)'}
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Memory Usage</span>
            </div>
            <div className="text-2xl font-bold">
              <span className={getPerformanceColor(100 - metrics.memoryUsage, 70, 85)}>
                {metrics.memoryUsage}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              JavaScript Heap
            </div>
          </div>

          {/* Load Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Session Time</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.loadTime / 1000, 1)}s
            </div>
            <div className="text-xs text-muted-foreground">
              Time active
            </div>
          </div>

          {/* Energy Efficiency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Efficiency</span>
            </div>
            <div className="text-lg font-bold capitalize">
              <span className={getEnergyEfficiencyColor(metrics.energyEfficiency)}>
                {metrics.energyEfficiency}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Performance rating
            </div>
          </div>
        </div>

        {/* Device Capabilities */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Device Capabilities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Refresh Rate:</span>
                <span className="font-medium">{capabilities.refreshRate}Hz</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pixel Ratio:</span>
                <span className="font-medium">{window.devicePixelRatio}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Variable Refresh:</span>
                <span className="font-medium">
                  {capabilities.isVariableRefreshRate ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Supported Rates:</span>
                <span className="font-medium">
                  {capabilities.supportedRefreshRates.join(', ')}Hz
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>High Refresh:</span>
                <span className="font-medium">
                  {supportsHighRefreshRate ? (
                    <CheckCircle className="h-4 w-4 text-green-600 inline" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 inline" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isMonitoring && metrics.layoutShifts > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Layout Stability</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Cumulative Layout Shift: <span className="font-medium">{metrics.layoutShifts.toFixed(3)}</span>
              {metrics.layoutShifts > 0.1 && (
                <span className="text-yellow-600 ml-2">(Needs improvement)</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;