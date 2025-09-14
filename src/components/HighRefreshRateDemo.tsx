import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  HighRefreshRateContainer, 
  withHighRefreshRate, 
  useHighRefreshRateOptimization,
  HighRefreshRateAnimation 
} from '@/components/HighRefreshRateOptimizer';
import { 
  useHighRefreshRateCapabilities, 
  useHighRefreshRateSettings, 
  useHighRefreshRatePerformance,
  useHighRefreshRateAnimation 
} from '@/hooks/useHighRefreshRate';
import { Monitor, Zap, Activity, Play, Pause, RotateCcw } from 'lucide-react';

// Example of optimizing a component with HOC
const OptimizedCard = withHighRefreshRate(Card, {
  enableAutoOptimization: true,
  priority: 'high',
  animationTypes: ['hover', 'transition', 'transform']
});

const HighRefreshRateDemo: React.FC = () => {
  const [animationRunning, setAnimationRunning] = useState(false);
  const [animationCounter, setAnimationCounter] = useState(0);
  
  const { capabilities, isLoading } = useHighRefreshRateCapabilities();
  const { settings, updateSettings } = useHighRefreshRateSettings();
  const performance = useHighRefreshRatePerformance();
  
  const demoElementRef = useRef<HTMLDivElement>(null);
  
  // Use manual optimization
  const { isHighRefreshEnabled, targetFrameRate } = useHighRefreshRateOptimization(
    demoElementRef,
    { priority: 'high', animationTypes: ['hover', 'transition', 'transform'] }
  );
  
  // High refresh rate animation callback
  const animationStats = useHighRefreshRateAnimation(
    (currentTime, deltaTime) => {
      if (animationRunning) {
        setAnimationCounter(prev => prev + 1);
        
        // Animate the demo element
        if (demoElementRef.current) {
          const rotation = (currentTime / 10) % 360;
          demoElementRef.current.style.transform = `rotate(${rotation}deg) scale(${1 + Math.sin(currentTime / 1000) * 0.1})`;
        }
      }
    },
    [animationRunning],
    animationRunning
  );
  
  const getFrameRateColor = (frameRate: number) => {
    if (frameRate >= 100) return "text-green-600";
    if (frameRate >= 80) return "text-blue-600";
    if (frameRate >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  const resetAnimation = () => {
    setAnimationCounter(0);
    if (demoElementRef.current) {
      demoElementRef.current.style.transform = '';
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Detecting 120fps capabilities...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <HighRefreshRateContainer 
      priority="high" 
      animationTypes={['hover', 'transition', 'transform']}
      className="container mx-auto p-6 space-y-6"
    >
      <div className="flex items-center gap-2">
        <Monitor className="h-6 w-6" />
        <h1 className="text-3xl font-bold">120fps High Refresh Rate Demo</h1>
        {isHighRefreshEnabled && (
          <Badge variant="default" className="bg-green-500">
            {targetFrameRate}fps Active
          </Badge>
        )}
      </div>
      
      {/* Device Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Device Capabilities
          </CardTitle>
          <CardDescription>
            Your device's high refresh rate support status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {capabilities ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{capabilities.maxRefreshRate}Hz</div>
                  <div className="text-sm text-muted-foreground">Max Refresh Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{capabilities.devicePixelRatio}x</div>
                  <div className="text-sm text-muted-foreground">Pixel Ratio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{capabilities.preferredFrameRate}fps</div>
                  <div className="text-sm text-muted-foreground">Preferred Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {capabilities.isHighRefreshSupported ? "✓" : "✗"}
                  </div>
                  <div className="text-sm text-muted-foreground">High Refresh</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant={capabilities.supports60fps ? "default" : "secondary"}>
                  60fps {capabilities.supports60fps ? "✓" : "✗"}
                </Badge>
                <Badge variant={capabilities.supports90fps ? "default" : "secondary"}>
                  90fps {capabilities.supports90fps ? "✓" : "✗"}
                </Badge>
                <Badge variant={capabilities.supports120fps ? "default" : "secondary"}>
                  120fps {capabilities.supports120fps ? "✓" : "✗"}
                </Badge>
              </div>
              
              {!capabilities.isHighRefreshSupported && (
                <Alert>
                  <Monitor className="h-4 w-4" />
                  <AlertDescription>
                    Your device doesn't support high refresh rates above 60fps. The demo will run at standard 60fps.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-muted-foreground">Unable to detect capabilities</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Current Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time frame rate and performance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getFrameRateColor(performance.frameRate)}`}>
                {performance.frameRate}
              </div>
              <div className="text-sm text-muted-foreground">Current FPS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {performance.frameTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-muted-foreground">Frame Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {performance.droppedFrames}
              </div>
              <div className="text-sm text-muted-foreground">Dropped Frames</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {performance.isOptimal ? "✓" : "✗"}
              </div>
              <div className="text-sm text-muted-foreground">Optimal</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Frame Rate Performance</span>
              <span className="text-sm">{performance.frameRate}fps</span>
            </div>
            <Progress value={(performance.frameRate / 120) * 100} />
          </div>
        </CardContent>
      </Card>
      
      {/* Interactive Animation Demo */}
      <OptimizedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            High Refresh Rate Animation Demo
          </CardTitle>
          <CardDescription>
            Interactive demonstration of smooth 120fps animations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <div 
              ref={demoElementRef}
              className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg transition-all duration-100"
              style={{ 
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)'
              }}
            />
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setAnimationRunning(!animationRunning)}
              className="flex items-center gap-2"
            >
              {animationRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {animationRunning ? 'Pause' : 'Start'} Animation
            </Button>
            
            <Button variant="outline" onClick={resetAnimation}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Animation Frames: {animationCounter}
            </div>
            {animationStats && (
              <div className="text-xs text-muted-foreground">
                Target FPS: {animationStats.targetFrameRate} | 
                Actual FPS: {animationStats.actualFrameRate.toFixed(1)} | 
                Active Callbacks: {animationStats.activeCallbacks}
              </div>
            )}
          </div>
        </CardContent>
      </OptimizedCard>
      
      {/* Animation Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Animation Examples</CardTitle>
          <CardDescription>
            Various animation types optimized for high refresh rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HighRefreshRateAnimation animationType="fade" className="p-4 bg-muted rounded">
              <div className="text-center">Fade In</div>
            </HighRefreshRateAnimation>
            
            <HighRefreshRateAnimation animationType="scale" className="p-4 bg-muted rounded">
              <div className="text-center">Scale In</div>
            </HighRefreshRateAnimation>
            
            <HighRefreshRateAnimation animationType="slide" className="p-4 bg-muted rounded">
              <div className="text-center">Slide In</div>
            </HighRefreshRateAnimation>
            
            <HighRefreshRateAnimation animationType="bounce" className="p-4 bg-muted rounded">
              <div className="text-center">Bounce In</div>
            </HighRefreshRateAnimation>
          </div>
        </CardContent>
      </Card>
      
      {/* Settings Quick Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Settings</CardTitle>
          <CardDescription>
            Enable or adjust high refresh rate settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>High Refresh Rate Enabled</span>
            <Badge variant={settings.enabled ? "default" : "secondary"}>
              {settings.enabled ? "ON" : "OFF"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Target Frame Rate</span>
            <Badge variant="outline">
              {settings.targetFrameRate}fps
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Adaptive Frame Rate</span>
            <Badge variant={settings.adaptiveFrameRate ? "default" : "secondary"}>
              {settings.adaptiveFrameRate ? "ON" : "OFF"}
            </Badge>
          </div>
          
          <Button 
            onClick={() => window.open('/high-refresh-rate', '_blank')}
            className="w-full"
          >
            Open Full Settings
          </Button>
        </CardContent>
      </Card>
    </HighRefreshRateContainer>
  );
};

export default HighRefreshRateDemo;