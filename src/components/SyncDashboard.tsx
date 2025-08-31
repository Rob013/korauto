import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlayIcon, 
  PauseIcon, 
  RefreshCwIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DatabaseIcon
} from 'lucide-react';
import { syncManager, SyncProgress } from '@/utils/syncManager';
import { useToast } from '@/hooks/use-toast';

export const SyncDashboard: React.FC = () => {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any[]>([]);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [status, syncErrors] = await Promise.all([
          syncManager.getSyncStatus(),
          syncManager.getSyncErrors(10)
        ]);
        
        setProgress(status);
        setErrors(syncErrors);
      } catch (error) {
        console.error('❌ Failed to load sync data:', error);
        toast({
          title: "Failed to load sync status",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = syncManager.subscribe((newProgress) => {
      setProgress(newProgress);
    });

    return unsubscribe;
  }, [toast]);

  const handleStartSync = async () => {
    try {
      await syncManager.startSync();
      toast({
        title: "Sync Started",
        description: "Car synchronization has been initiated."
      });
    } catch (error) {
      toast({
        title: "Failed to start sync",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleResumeSync = async () => {
    try {
      await syncManager.resumeSync();
      toast({
        title: "Sync Resumed",
        description: "Car synchronization has been resumed from last checkpoint."
      });
    } catch (error) {
      toast({
        title: "Failed to resume sync",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleStopSync = async () => {
    try {
      await syncManager.stopSync();
      toast({
        title: "Sync Stopped",
        description: "Car synchronization has been stopped."
      });
    } catch (error) {
      toast({
        title: "Failed to stop sync",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: SyncProgress['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500"><ClockIcon className="h-3 w-3 mr-1" />Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircleIcon className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangleIcon className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
            Loading sync status...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sync Dashboard</h1>
        <div className="flex gap-2">
          {progress?.status === 'running' ? (
            <Button onClick={handleStopSync} variant="destructive" className="gap-2">
              <PauseIcon className="h-4 w-4" />
              Stop Sync
            </Button>
          ) : (
            <>
              <Button onClick={handleStartSync} className="gap-2">
                <PlayIcon className="h-4 w-4" />
                Start Fresh
              </Button>
              {progress?.status === 'failed' && (
                <Button onClick={handleResumeSync} variant="outline" className="gap-2">
                  <RefreshCwIcon className="h-4 w-4" />
                  Resume
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5" />
                Sync Status
              </CardTitle>
              <CardDescription>
                Complete car data synchronization with 100% resumability
              </CardDescription>
            </div>
            {progress && getStatusBadge(progress.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion</span>
                  <span>{progress.completionPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={progress.completionPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Page</span>
                  <div className="font-semibold">{progress.currentPage.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Records Processed</span>
                  <div className="font-semibold">{progress.totalProcessed.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Errors</span>
                  <div className="font-semibold text-destructive">{progress.errors}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Time Left</span>
                  <div className="font-semibold">{progress.estimatedTimeLeft || 'Calculating...'}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Started: {new Date(progress.startTime).toLocaleString()} • 
                Last Update: {new Date(progress.lastUpdate).toLocaleString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="h-5 w-5" />
              Recent Errors ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errors.map((error, index) => (
                <Alert key={error.id || index}>
                  <AlertDescription>
                    <div className="font-semibold">{error.error_type}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {error.error_message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(error.created_at).toLocaleString()}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">🔄 Complete Sync Pipeline</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Fetches ALL car data from external API with full field mapping</li>
              <li>Saves complete checkpoints every 10 pages for resumability</li>
              <li>Handles all images and metadata with 1:1 API mapping</li>
              <li>Automatic retry with exponential backoff for failures</li>
              <li>Continues until 100% completion (no more 116k limits)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">📊 Global Database Sorting</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>All sorting happens in the database BEFORE pagination</li>
              <li>Page 1 = truly cheapest cars, Last page = most expensive</li>
              <li>No client-side sorting - ensures consistency across all pages</li>
              <li>Proper numeric sorting for prices (not text-based)</li>
              <li>Filters preserve sort order globally</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};