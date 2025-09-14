import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useHighRefreshRateCapabilities, 
  useHighRefreshRateSettings, 
  useHighRefreshRatePerformance 
} from '@/hooks/useHighRefreshRate';
import { 
  Monitor, 
  Zap, 
  Battery, 
  Settings, 
  Activity, 
  Info,
  Gauge,
  Eye,
  Smartphone
} from 'lucide-react';

export const HighRefreshRateSettings: React.FC = () => {
  const { capabilities, isLoading } = useHighRefreshRateCapabilities();
  const { settings, updateSettings, getPerformanceStats } = useHighRefreshRateSettings();
  const performance = useHighRefreshRatePerformance();
  
  const performanceStats = getPerformanceStats();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Detecting display capabilities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getFrameRateColor = (frameRate: number) => {
    if (frameRate >= 100) return "text-green-600";
    if (frameRate >= 80) return "text-blue-600";
    if (frameRate >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getPerformanceBadge = () => {
    if (performance.isOptimal) {
      return <Badge variant="default" className="bg-green-500">Optimal</Badge>;
    } else if (performance.frameRate >= 60) {
      return <Badge variant="default" className="bg-yellow-500">Good</Badge>;
    } else {
      return <Badge variant="destructive">Poor</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Monitor className="h-6 w-6" />
        <h2 className="text-2xl font-bold">High Refresh Rate Settings</h2>
        {capabilities?.isHighRefreshSupported && (
          <Badge variant="default" className="bg-blue-500">120fps Supported</Badge>
        )}
      </div>
      
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Device Info
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                High Refresh Rate Configuration
              </CardTitle>
              <CardDescription>
                Configure 120fps settings for smoother animations and better performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable High Refresh Rate */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Enable High Refresh Rate</Label>
                  <p className="text-sm text-muted-foreground">
                    Enables 120fps animations for supported devices
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => updateSettings({ enabled })}
                  disabled={!capabilities?.isHighRefreshSupported}
                />
              </div>
              
              {!capabilities?.isHighRefreshSupported && (
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    Your device does not support high refresh rates above 60fps. 
                    Standard 60fps animations will be used.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Target Frame Rate */}
              {settings.enabled && capabilities?.isHighRefreshSupported && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Target Frame Rate</Label>
                  <Select
                    value={settings.targetFrameRate.toString()}
                    onValueChange={(value) => updateSettings({ targetFrameRate: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 fps (Standard)</SelectItem>
                      {capabilities?.supports90fps && (
                        <SelectItem value="90">90 fps (High)</SelectItem>
                      )}
                      {capabilities?.supports120fps && (
                        <SelectItem value="120">120 fps (Maximum)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Higher frame rates provide smoother animations but use more battery
                  </p>
                </div>
              )}
              
              {/* Performance Mode */}
              {settings.enabled && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Performance Mode</Label>
                  <Select
                    value={settings.performanceMode}
                    onValueChange={(value: 'auto' | 'performance' | 'battery') => 
                      updateSettings({ performanceMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Recommended)</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="battery">Battery Saver</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Auto mode balances performance and battery life based on device conditions
                  </p>
                </div>
              )}
              
              {/* Adaptive Frame Rate */}
              {settings.enabled && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Adaptive Frame Rate</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically adjusts frame rate based on performance
                    </p>
                  </div>
                  <Switch
                    checked={settings.adaptiveFrameRate}
                    onCheckedChange={(adaptiveFrameRate) => updateSettings({ adaptiveFrameRate })}
                  />
                </div>
              )}
              
              {/* Battery Saver */}
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  <div>
                    <Label className="text-base font-medium">Battery Saver Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduces frame rate when battery is low
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.batterySaver}
                  onCheckedChange={(batterySaver) => updateSettings({ batterySaver })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Real-time Performance Metrics
              </CardTitle>
              <CardDescription>
                Monitor current frame rate and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Performance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current Frame Rate</Label>
                  <div className={`text-2xl font-bold ${getFrameRateColor(performance.frameRate)}`}>
                    {performance.frameRate} fps
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(performance.frameRate / 120) * 100} className="flex-1" />
                    {getPerformanceBadge()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Frame Time</Label>
                  <div className="text-2xl font-bold">
                    {performance.frameTime.toFixed(1)}ms
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Target: {(1000 / (performanceStats?.targetFrameRate || 60)).toFixed(1)}ms
                  </p>
                </div>
              </div>
              
              {/* Performance Stats */}
              {performanceStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Frame Rate</Label>
                    <div className="text-xl font-semibold">
                      {performanceStats.targetFrameRate} fps
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Active Animations</Label>
                    <div className="text-xl font-semibold">
                      {performanceStats.activeCallbacks}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Dropped Frames Warning */}
              {performance.droppedFrames > 5 && (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    {performance.droppedFrames} dropped frames detected. Consider reducing target frame rate or enabling adaptive mode.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Recommendations */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Performance Recommendations</Label>
                <div className="space-y-1 text-sm">
                  {performance.frameRate < 50 && (
                    <p className="text-yellow-600">• Consider enabling battery saver mode</p>
                  )}
                  {performance.frameRate > 110 && settings.targetFrameRate < 120 && (
                    <p className="text-green-600">• Your device can handle higher frame rates</p>
                  )}
                  {performance.isOptimal && (
                    <p className="text-green-600">• Performance is optimal for current settings</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device Display Capabilities
              </CardTitle>
              <CardDescription>
                Information about your device's refresh rate support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {capabilities && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Maximum Refresh Rate</Label>
                      <div className="text-xl font-semibold">
                        {capabilities.maxRefreshRate} Hz
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Device Pixel Ratio</Label>
                      <div className="text-xl font-semibold">
                        {capabilities.devicePixelRatio}x
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Supported Frame Rates</Label>
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Recommended Settings</Label>
                    <div className="text-sm space-y-1">
                      <p>• Preferred Frame Rate: {capabilities.preferredFrameRate} fps</p>
                      <p>• High Refresh Support: {capabilities.isHighRefreshSupported ? "Yes" : "No"}</p>
                      {capabilities.isHighRefreshSupported && (
                        <p className="text-green-600">
                          • Your device supports high refresh rate animations!
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HighRefreshRateSettings;