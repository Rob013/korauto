import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEncarAPI } from '@/hooks/useEncarAPI';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Pause,
  Database,
  TrendingUp,
  RefreshCw,
  Zap,
  AlertTriangle,
  StopCircle,
  Shield
} from 'lucide-react';

export function AdminSyncDashboard() {
  const { syncStatus, totalCount, triggerSync, getSyncStatus } = useEncarAPI();
  const { toast } = useToast();
  const [testInProgress, setTestInProgress] = useState(false);
  const [emergencyInProgress, setEmergencyInProgress] = useState(false);

  const handleFullSync = async () => {
    try {
      await triggerSync('full');
      toast({
        title: "🚀 UNLIMITED Full Sync Started!",
        description: "Targeting ALL 130,000+ listings - no page limits! Auto-continuing until complete.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive",
      });
    }
  };

  const handleTestSync = async () => {
    setTestInProgress(true);
    try {
      await triggerSync('incremental');
      toast({
        title: "Test Sync Started",
        description: "Started incremental synchronization.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive",
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
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sample data added",
          description: `Successfully added ${result.cars_added} sample cars to the database.`,
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
        variant: "destructive",
      });
    }
  };

  const handleEmergencyMassData = async () => {
    setEmergencyInProgress(true);
    try {
      const response = await fetch(`https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/encar-sync?emergency=true&count=50000`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "🚨 Emergency Data Generated",
          description: `Successfully generated ${result.cars_added} sample cars`,
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
        variant: "destructive",
      });
    } finally {
      setEmergencyInProgress(false);
    }
  };

  const handleForceStopSync = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
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
        description: "All running syncs have been stopped",
      });
      
      getSyncStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop running syncs",
        variant: "destructive",
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
    return Math.min((processed / syncStatus.total_records) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sync Dashboard</h2>
        <Button variant="outline" onClick={getSyncStatus}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total cars in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Sync</CardTitle>
            {getStatusIcon(syncStatus?.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.status ? (
                <Badge variant={syncStatus.status === 'running' ? 'default' : 
                              syncStatus.status === 'completed' ? 'default' : 
                              syncStatus.status === 'failed' ? 'destructive' : 'secondary'}>
                  {syncStatus.status}
                </Badge>
              ) : (
                <Badge variant="secondary">No active sync</Badge>
              )}
            </div>
            {syncStatus?.status === 'running' && (
              <div className="mt-2">
                <Progress value={getSyncProgress()} className="w-full" />
                <p className="text-xs text-muted-foreground mt-1">
                  {syncStatus.records_processed || 0} / {syncStatus.total_records || 0} cars processed
                </p>
              </div>
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
              {syncStatus?.last_activity_at ? (
                new Date(syncStatus.last_activity_at).toLocaleTimeString()
              ) : (
                'Never'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.last_activity_at ? (
                `${Math.round((Date.now() - new Date(syncStatus.last_activity_at).getTime()) / 60000)} min ago`
              ) : (
                'No recent activity'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Control Panel</CardTitle>
          <CardDescription>
            Manage data synchronization with the Encar API. Use test sync for incremental updates or full sync for complete refresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleTestSync}
              disabled={testInProgress || syncStatus?.status === 'running'}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              {testInProgress ? 'Starting...' : 'Test Sync (Incremental)'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleFullSync}
              disabled={syncStatus?.status === 'running'}
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              Full Sync
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-orange-500" />
              🚨 Emergency Controls
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Emergency tools for when APIs fail or syncs get stuck. Use these if normal sync isn't working.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="secondary"
                onClick={handleSeedData}
                disabled={syncStatus?.status === 'running' || emergencyInProgress}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Add 5 Sample Cars
              </Button>
              
              <Button 
                onClick={handleEmergencyMassData}
                disabled={syncStatus?.status === 'running' || emergencyInProgress}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {emergencyInProgress ? 'Generating...' : 'Generate 50K Cars'}
              </Button>
              
              <Button 
                onClick={handleForceStopSync}
                disabled={emergencyInProgress}
                className="flex-1 bg-red-600 hover:bg-red-700"
                variant="destructive"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Force Stop Syncs
              </Button>
            </div>
          </div>

          {syncStatus?.error_message && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                <strong>Error:</strong> {syncStatus.error_message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Improvements */}
      <Card>
        <CardHeader>
          <CardTitle>System Improvements</CardTitle>
          <CardDescription>
            Recent enhancements to the sync system for better reliability and performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Simplified Database Architecture</p>
                <p className="text-xs text-muted-foreground">
                  Rebuilt database from scratch with cleaner, more efficient structure
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">🚀 UNLIMITED Sync Capability</p>
                <p className="text-xs text-muted-foreground">
                  Removed all page limits - now fetches ALL 130,000+ listings with auto-continuation
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Enhanced Rate Limiting (3-5min waits)</p>
                <p className="text-xs text-muted-foreground">
                  Longer wait times and bigger batches (500 records) for reliable fetching
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Smart Auto-Recovery</p>
                <p className="text-xs text-muted-foreground">
                  Automatic retry mechanisms and background continuation for interrupted syncs
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Real-time Progress Tracking</p>
                <p className="text-xs text-muted-foreground">
                  Live updates and comprehensive logging for complete visibility
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}