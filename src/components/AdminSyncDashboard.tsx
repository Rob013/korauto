import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEncarAPI } from '@/hooks/useEncarAPI';
import { useToast } from '@/hooks/use-toast';
import { Activity, CheckCircle, AlertCircle, Clock, Pause, Database, TrendingUp, RefreshCw, Zap, AlertTriangle, StopCircle, Shield } from 'lucide-react';
export default function AdminSyncDashboard() {
  const {
    syncStatus,
    totalCount,
    triggerSync,
    getSyncStatus,
    cleanupSoldCars
  } = useEncarAPI();
  const {
    toast
  } = useToast();
  const [testInProgress, setTestInProgress] = useState(false);
  const [emergencyInProgress, setEmergencyInProgress] = useState(false);
  const handleFullSync = async () => {
    try {
      await triggerSync('full');
      toast({
        title: "🚀 Real API Full Sync Started!",
        description: "Fetching ALL real car data from live API - auto-syncing every minute!"
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive"
      });
    }
  };
  const handleTestSync = async () => {
    setTestInProgress(true);
    try {
      await triggerSync('incremental');
      toast({
        title: "🔄 Real API Incremental Sync Started",
        description: "Fetching recent real car updates from live API."
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive"
      });
    } finally {
      setTestInProgress(false);
    }
  };
  const handleSeedData = async () => {
    try {
      const response = await fetch(`https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?seed=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Sample data added",
          description: `Successfully added ${result.cars_added} sample cars to the database.`
        });
        // Refresh data
        getSyncStatus();
      } else {
        throw new Error(result.message || 'Failed to seed data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed sample data",
        variant: "destructive"
      });
    }
  };
  const handleEmergencyMassData = async () => {
    setEmergencyInProgress(true);
    try {
      const response = await fetch(`https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?emergency=true&count=50000`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "🚨 Emergency Data Generated",
          description: `Successfully generated ${result.cars_added} sample cars`
        });
        // Refresh data
        getSyncStatus();
      } else {
        throw new Error(result.message || 'Failed to generate emergency data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate emergency sample data",
        variant: "destructive"
      });
    } finally {
      setEmergencyInProgress(false);
    }
  };
  const handleForceStopSync = async () => {
    try {
      const {
        supabase
      } = await import('@/integrations/supabase/client');
      const {
        error
      } = await supabase.from('sync_status').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: 'Manually stopped by admin'
      }).eq('status', 'running');
      if (error) throw error;
      toast({
        title: "🛑 Sync Stopped",
        description: "All running syncs have been stopped"
      });
      getSyncStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop running syncs",
        variant: "destructive"
      });
    }
  };

  const handleCleanupSoldCars = async () => {
    try {
      const result = await cleanupSoldCars();
      toast({
        title: "🧹 Sold Cars Cleanup Complete",
        description: `Removed ${result.removed_cars_count} cars that were sold over 24 hours ago`
      });
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "Failed to cleanup sold cars",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  const getSyncProgress = () => {
    if (!syncStatus || !syncStatus.total_records || syncStatus.total_records === 0) {
      return 0;
    }
    const processed = syncStatus.records_processed || 0;
    return Math.min(processed / syncStatus.total_records * 100, 100);
  };
  return <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Sync Dashboard</h2>
        <Button variant="outline" size="sm" onClick={getSyncStatus}>
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* System Status Cards */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        

        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.last_activity_at ? new Date(syncStatus.last_activity_at).toLocaleTimeString() : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.last_activity_at ? `${Math.round((Date.now() - new Date(syncStatus.last_activity_at).getTime()) / 60000)} min ago` : 'No recent activity'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <CardDescription>Manage sync operations and data cleanup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={handleFullSync}
              className="gap-1 sm:gap-2"
              size="sm"
            >
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Full Sync</span>
            </Button>
            
            <Button
              onClick={handleTestSync}
              disabled={testInProgress}
              variant="outline"
              className="gap-1 sm:gap-2"
              size="sm"
            >
              {testInProgress ? (
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="text-xs sm:text-sm">
                {testInProgress ? 'Syncing...' : 'Incremental'}
              </span>
            </Button>

            <Button
              onClick={handleCleanupSoldCars}
              variant="outline"
              className="gap-1 sm:gap-2"
              size="sm"
            >
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Cleanup Sold</span>
            </Button>

            <Button
              onClick={handleForceStopSync}
              variant="destructive"
              className="gap-1 sm:gap-2"
              size="sm"
            >
              <StopCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Stop Sync</span>
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>;
}