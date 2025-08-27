import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useThrottledUrlUpdate } from '@/hooks/useThrottledUrlUpdate';

/**
 * Demo component to test and demonstrate the throttled URL update mechanism
 * This helps verify that the SecurityError: excessive history.replaceState() calls is resolved
 */
export const ThrottledUrlUpdateDemo: React.FC = () => {
  const { updateUrl, searchParams } = useThrottledUrlUpdate();
  const [updateCount, setUpdateCount] = useState(0);
  const [rapidUpdateCount, setRapidUpdateCount] = useState(0);

  // Simulate normal URL updates
  const handleNormalUpdate = () => {
    const newCount = updateCount + 1;
    setUpdateCount(newCount);
    updateUrl({
      normal_update: newCount.toString(),
      timestamp: Date.now().toString()
    });
  };

  // Simulate rapid URL updates that would previously cause SecurityError
  const handleRapidUpdates = () => {
    // This simulates the scenario that was causing the SecurityError
    // Previously this would cause: "Attempt to use history.replaceState() more than 100 times per 10 seconds"
    for (let i = 0; i < 150; i++) {
      updateUrl({
        rapid_update: i.toString(),
        batch_test: 'true',
        iteration: i.toString()
      });
    }
    setRapidUpdateCount(prev => prev + 150);
  };

  // Test immediate updates (bypass throttling)
  const handleImmediateUpdate = () => {
    updateUrl({
      immediate_update: Date.now().toString(),
      critical: 'true'
    }, { immediate: true });
  };

  // Clear URL parameters
  const handleClearUrl = () => {
    updateUrl({});
    setUpdateCount(0);
    setRapidUpdateCount(0);
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Throttled URL Update Demo</CardTitle>
          <p className="text-sm text-muted-foreground">
            This demo tests the fix for SecurityError: excessive history.replaceState() calls
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleNormalUpdate} variant="outline">
              Normal Update ({updateCount})
            </Button>
            
            <Button onClick={handleRapidUpdates} variant="destructive">
              Rapid Updates (150 calls) ({rapidUpdateCount})
            </Button>
            
            <Button onClick={handleImmediateUpdate} variant="secondary">
              Immediate Update
            </Button>
            
            <Button onClick={handleClearUrl} variant="ghost">
              Clear URL
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Current URL Parameters:</h4>
            <div className="flex flex-wrap gap-1">
              {Array.from(searchParams.entries()).map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {key}: {value}
                </Badge>
              ))}
              {searchParams.size === 0 && (
                <Badge variant="outline">No parameters</Badge>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>How the fix works:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>URL updates are throttled to maximum 1 call per second</li>
              <li>Multiple rapid calls are batched together</li>
              <li>Immediate updates bypass throttling for critical operations</li>
              <li>This prevents the browser's SecurityError for excessive history manipulation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};