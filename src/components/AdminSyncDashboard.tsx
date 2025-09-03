import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEncarAPI } from '@/hooks/useEncarAPI';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { verifySyncToDatabase, type SyncVerificationResult } from '@/utils/syncVerification';
import { Activity, CheckCircle, AlertCircle, Clock, Database, RefreshCw, Zap, StopCircle, Shield, TrendingUp } from 'lucide-react';

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
  const [verificationResult, setVerificationResult] = useState<SyncVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const handleFullSync = async () => {
    try {
      // Use the enhanced edge function for full sync via Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('cars-sync', {
        body: {
          syncType: 'full',
          smartSync: true,
          aiCoordinated: true,
          source: 'admin-dashboard'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to start full sync');
      }

      const result = response.data;
      
      if (result?.success) {
        toast({
          title: "🚀 Full Sync Started Successfully!",
          description: "Smart AI-coordinated full sync is now running. Check the status for progress updates."
        });
        // Refresh status after a short delay
        setTimeout(() => getSyncStatus(), 2000);
      } else {
        throw new Error(result?.message || 'Failed to start full sync');
      }
    } catch (error) {
      console.error('Full sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start full sync",
        variant: "destructive"
      });
    }
  };
  
  const handleTestSync = async () => {
    setTestInProgress(true);
    try {
      await triggerSync('incremental');
      toast({
        title: "🔄 Incremental Sync Started",
        description: "Fetching recent car updates from API."
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
  
  const handleVerifySync = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const result = await verifySyncToDatabase(undefined, {
        verifyRecordCount: true,
        verifySampleRecords: true,
        verifyDataIntegrity: true,
        verifyTimestamps: true,
        sampleSize: 20,
        syncTimeThresholdHours: 72,
        dataIntegrityThresholdPercent: 20
      });
      
      setVerificationResult(result);
      
      if (result.success) {
        toast({
          title: "✅ Verification Passed",
          description: result.message
        });
      } else {
        toast({
          title: "⚠️ Verification Issues Found",
          description: `${result.errors?.length || 0} issues detected`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify sync",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
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

  // Calculate estimated time to completion
  const getEstimatedTimeToCompletion = () => {
    const throughput = getSyncThroughput();
    if (!throughput || !syncStatus?.total_records) return null;
    
    const remaining = (syncStatus.total_records || 0) - (syncStatus.records_processed || 0);
    if (remaining <= 0) return null;
    
    return Math.round(remaining / throughput); // minutes
  };

  // Format ETA display
  const formatETA = (minutes: number | null) => {
    if (!minutes || minutes <= 0) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
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

      {/* Essential Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Sync Controls
          </CardTitle>
          <CardDescription>
            Start and manage data synchronization operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
            <Button 
              onClick={handleFullSync} 
              disabled={syncStatus?.status === 'running'}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Full Sync
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleTestSync} 
              disabled={testInProgress || syncStatus?.status === 'running'}
              className="w-full"
            >
              <Activity className="h-4 w-4 mr-2" />
              {testInProgress ? 'Running...' : 'Incremental Sync'}
            </Button>

            <Button 
              variant="outline"
              onClick={handleVerifySync}
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Database
                </>
              )}
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

          {/* Essential Progress Information */}
          {syncStatus?.status === 'running' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="font-medium text-blue-900">Sync in Progress</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Progress:</span>
                  <span className="font-mono ml-2">{getSyncProgress().toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-blue-700">Processing Rate:</span>
                  <span className="font-mono ml-2">{getSyncThroughput() || 0} records/min</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(syncStatus?.records_processed || 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Records Processed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {syncStatus?.records_processed && totalCount 
                  ? Math.round((syncStatus.records_processed / totalCount) * 100) 
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              verificationResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {verificationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Sync Verification {verificationResult.success ? 'Passed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {verificationResult.message}
            </p>
            
            {verificationResult.details && (
              <div className="grid gap-2 text-sm">
                {verificationResult.details.actualCount !== undefined && (
                  <div className="flex justify-between">
                    <span>Records in Database:</span>
                    <span className="font-mono">{verificationResult.details.actualCount.toLocaleString()}</span>
                  </div>
                )}
                {verificationResult.details.stagingTableCleared !== undefined && (
                  <div className="flex justify-between">
                    <span>Staging Table:</span>
                    <span className={verificationResult.details.stagingTableCleared ? 'text-green-600' : 'text-red-600'}>
                      {verificationResult.details.stagingTableCleared ? 'Cleared' : 'Not Cleared'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {verificationResult.errors && verificationResult.errors.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <h5 className="font-medium text-red-800 mb-1">Issues Found:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  {verificationResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}