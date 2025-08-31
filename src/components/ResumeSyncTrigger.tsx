import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlayCircle, RotateCcw, AlertCircle } from 'lucide-react';

interface SyncStatus {
  id?: string;
  status: string;
  current_page: number;
  records_processed: number;
  total_pages?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
  sync_type: string;
}

export const ResumeSyncTrigger = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch current sync status
  const fetchSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching sync status:', error);
        return;
      }

      setSyncStatus(data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  // Resume sync from current position
  const resumeSync = async () => {
    if (!syncStatus) return;

    setIsLoading(true);
    try {
      console.log('🔄 Resuming sync from page:', syncStatus.current_page);
      
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: {
          resume: true,
          fromPage: syncStatus.current_page,
          reconcileProgress: true,
          source: 'resume-trigger',
          resumeFromFailure: syncStatus.status === 'failed'
        }
      });

      if (error) {
        console.error('Resume sync error:', error);
        toast({
          title: "Resume Failed",
          description: `Failed to resume sync: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "🔄 Sync Resumed",
        description: `Resuming from page ${syncStatus.current_page} with ${syncStatus.records_processed} records processed`,
      });

      // Refresh status after a short delay
      setTimeout(fetchSyncStatus, 2000);

    } catch (error) {
      console.error('Resume sync error:', error);
      toast({
        title: "Resume Failed",
        description: "Failed to resume sync. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start fresh sync
  const startFreshSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: {
          fresh: true,
          source: 'resume-trigger'
        }
      });

      if (error) {
        console.error('Fresh sync error:', error);
        toast({
          title: "Start Failed",
          description: `Failed to start sync: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "🚀 Fresh Sync Started",
        description: "Starting new synchronization from the beginning",
      });

      setTimeout(fetchSyncStatus, 2000);

    } catch (error) {
      console.error('Fresh sync error:', error);
      toast({
        title: "Start Failed",
        description: "Failed to start sync. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    
    // Set up real-time subscription to sync status changes
    const subscription = supabase
      .channel('sync-status-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sync_status',
        filter: 'id=eq.cars-sync-main'
      }, () => {
        fetchSyncStatus();
      })
      .subscribe();

    // Refresh status every 10 seconds
    const interval = setInterval(fetchSyncStatus, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Running';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'paused': return 'Paused';
      default: return 'Unknown';
    }
  };

  const canResume = syncStatus && (syncStatus.status === 'failed' || syncStatus.status === 'paused');
  const isRunning = syncStatus?.status === 'running';
  const isCompleted = syncStatus?.status === 'completed';

  const progress = syncStatus?.total_pages 
    ? (syncStatus.current_page / syncStatus.total_pages) * 100 
    : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Resume Sync Control
        </CardTitle>
        <CardDescription>
          Resume or restart the car synchronization process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus ? (
          <>
            {/* Status Overview */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(syncStatus.status)}>
                  {getStatusText(syncStatus.status)}
                </Badge>
                <div className="text-sm">
                  <div>Page: {syncStatus.current_page.toLocaleString()}</div>
                  <div>Records: {syncStatus.records_processed.toLocaleString()}</div>
                </div>
              </div>
              {syncStatus.total_pages && (
                <div className="text-right text-sm text-muted-foreground">
                  {progress.toFixed(1)}% complete
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {syncStatus.total_pages && (
              <Progress value={progress} className="w-full" />
            )}

            {/* Error Message */}
            {syncStatus.error_message && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <div className="font-medium">Error occurred:</div>
                  <div className="mt-1">{syncStatus.error_message}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {canResume && (
                <Button 
                  onClick={resumeSync}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resume from Page {syncStatus.current_page.toLocaleString()}
                </Button>
              )}
              
              {!isRunning && (
                <Button 
                  onClick={startFreshSync}
                  disabled={isLoading}
                  variant={canResume ? "outline" : "default"}
                  className={canResume ? "" : "flex-1"}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Fresh Sync
                </Button>
              )}

              {isRunning && (
                <Button disabled className="flex-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sync Running...
                </Button>
              )}

              {isCompleted && (
                <Button disabled className="flex-1">
                  ✅ Sync Completed
                </Button>
              )}
            </div>

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1">
              {syncStatus.started_at && (
                <div>Started: {new Date(syncStatus.started_at).toLocaleString()}</div>
              )}
              {syncStatus.last_activity_at && (
                <div>Last Activity: {new Date(syncStatus.last_activity_at).toLocaleString()}</div>
              )}
              {syncStatus.completed_at && (
                <div>Completed: {new Date(syncStatus.completed_at).toLocaleString()}</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading sync status...
          </div>
        )}
      </CardContent>
    </Card>
  );
};