import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEncarAPI } from '@/hooks/useEncarAPI';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, CheckCircle, AlertCircle, Clock, Database, TrendingUp, RefreshCw, Zap, AlertTriangle, StopCircle, Shield } from 'lucide-react';

export default function AdminSyncDashboard() {
  const {
    syncStatus,
    totalCount,
    triggerSync,
    getSyncStatus
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
        description: error instanceof Error ? error.message : "Failed to generate emergency data",
        variant: "destructive"
      });
    } finally {
      setEmergencyInProgress(false);
    }
  };
  
  const handleStopSync = async () => {
    try {
      // Call Supabase to stop running syncs
      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Manually stopped by admin'
        })
        .eq('status', 'running');
      
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
  
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
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

  // Calculate estimated time to completion
  const getEstimatedTimeToCompletion = () => {
    if (!syncStatus || syncStatus.status !== 'running' || !syncStatus.started_at) {
      return null;
    }

    const startTime = new Date(syncStatus.started_at).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    const processed = syncStatus.records_processed || 0;
    const total = syncStatus.total_records || 0;
    
    if (processed === 0 || elapsedMinutes === 0) return null;

    const processingRate = processed / elapsedMinutes; // records per minute
    const remaining = total - processed;
    const estimatedRemainingMinutes = remaining / processingRate;

    return estimatedRemainingMinutes;
  };

  // Calculate sync throughput
  const getSyncThroughput = () => {
    if (!syncStatus || syncStatus.status !== 'running' || !syncStatus.started_at) {
      return null;
    }

    const startTime = new Date(syncStatus.started_at).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    const processed = syncStatus.records_processed || 0;
    
    if (processed === 0 || elapsedMinutes === 0) return null;

    return Math.round(processed / elapsedMinutes); // records per minute
  };

  // Format ETA display
  const formatETA = (minutes: number | null) => {
    if (minutes === null || minutes <= 0) return 'Calculating...';
    
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
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
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            {getStatusIcon(syncStatus?.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.status ? syncStatus.status.charAt(0).toUpperCase() + syncStatus.status.slice(1) : 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.sync_type ? `${syncStatus.sync_type} sync` : 'No active sync'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getSyncProgress().toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {(syncStatus?.records_processed || 0).toLocaleString()} / {(syncStatus?.total_records || 0).toLocaleString()} records
            </p>
            {syncStatus?.status === 'running' && (
              <>
                <Progress value={getSyncProgress()} className="mt-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Rate: {getSyncThroughput()}/min</span>
                  <span>ETA: {formatETA(getEstimatedTimeToCompletion())}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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

      {/* Enhanced Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            High-Performance Sync Controls
          </CardTitle>
          <CardDescription>
            Optimized sync operations for fast data synchronization (30-40 min target)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              onClick={handleFullSync} 
              disabled={syncStatus?.status === 'running'}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Full Sync
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleTestSync} 
              disabled={testInProgress || syncStatus?.status === 'running'}
              className="w-full"
            >
              <Activity className="h-4 w-4 mr-2" />
              {testInProgress ? 'Syncing...' : 'Incremental Sync'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleSeedData}
              disabled={syncStatus?.status === 'running'}
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Sample Data
            </Button>
            
            {syncStatus?.status === 'running' && (
              <Button 
                variant="destructive"
                onClick={handleStopSync}
                className="w-full"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Sync
              </Button>
            )}
          </div>

          {/* Performance Indicators */}
          {syncStatus?.status === 'running' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="font-medium text-blue-900">High-Performance Sync Active</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Current Page:</span>
                  <span className="font-mono ml-2">{syncStatus.current_page || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700">Estimated Total:</span>
                  <span className="font-mono ml-2">{syncStatus.total_pages || 'Calculating...'}</span>
                </div>
                <div>
                  <span className="text-blue-700">Processing Rate:</span>
                  <span className="font-mono ml-2">{getSyncThroughput() || 0} records/min</span>
                </div>
                <div>
                  <span className="text-blue-700">Time Remaining:</span>
                  <span className="font-mono ml-2">{formatETA(getEstimatedTimeToCompletion())}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(totalCount || 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Cars Available</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {syncStatus?.records_processed ? Math.round((syncStatus.records_processed / (totalCount || 1)) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Database Coverage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {syncStatus?.last_activity_at 
                  ? Math.round((Date.now() - new Date(syncStatus.last_activity_at).getTime()) / 60000)
                  : 'N/A'
                }
              </div>
              <p className="text-sm text-muted-foreground">Minutes Since Last Update</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}