import { useState } from 'react';
import { useEncarAPI } from '@/hooks/useEncarAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Database, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSyncDashboard = () => {
  const { 
    totalCount, 
    syncStatus, 
    triggerSync, 
    getSyncStatus,
    loading
  } = useEncarAPI();
  
  const { toast } = useToast();
  const [testInProgress, setTestInProgress] = useState(false);

  const handleFullSync = async () => {
    try {
      await triggerSync('full');
      toast({
        title: "🚀 Full Sync Started",
        description: "Complete database refresh initiated. This will fetch all 130,000+ cars.",
      });
    } catch (error) {
      toast({
        title: "❌ Sync Failed",
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
        title: "🧪 Test Sync Started",
        description: "Testing the sync system with incremental update.",
      });
    } catch (error) {
      toast({
        title: "❌ Test Failed",
        description: error instanceof Error ? error.message : "Test sync failed",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setTestInProgress(false), 5000);
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-5 w-5 text-muted-foreground" />;
    
    switch (syncStatus.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'paused':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getSyncProgress = () => {
    if (!syncStatus || !syncStatus.total_records) return 0;
    return Math.round((syncStatus.synced_records / syncStatus.total_records) * 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🔧 Sync System Dashboard</h1>
        <Button
          onClick={getSyncStatus}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cars in database</p>
            <div className="mt-2">
              <Badge variant="secondary">
                Target: 130,000+ cars
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Sync</CardTitle>
            {getStatusIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {syncStatus?.status || 'Ready'}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.sync_type || 'No active sync'}
            </p>
            {syncStatus?.status === 'in_progress' && (
              <div className="mt-2 space-y-1">
                <Progress value={getSyncProgress()} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {syncStatus.synced_records?.toLocaleString()} / {syncStatus.total_records?.toLocaleString()} records
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Update */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {syncStatus?.last_updated 
                ? new Date(syncStatus.last_updated).toLocaleString()
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.error_message || 'System operational'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Sync Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">🧪 Test Sync System</h3>
              <p className="text-sm text-muted-foreground">
                Test the new sync system with a small incremental update
              </p>
              <Button
                onClick={handleTestSync}
                disabled={loading || testInProgress || syncStatus?.status === 'in_progress'}
                className="w-full"
                variant="outline"
              >
                {testInProgress ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Test Sync
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">🚀 Full Database Sync</h3>
              <p className="text-sm text-muted-foreground">
                Import all 130,000+ cars from Encar API (chunked execution)
              </p>
              <Button
                onClick={handleFullSync}
                disabled={loading || syncStatus?.status === 'in_progress'}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Start Full Sync
              </Button>
            </div>
          </div>

          {/* System Information */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">✅ System Improvements Implemented:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Fixed 500 errors with robust error handling</li>
              <li>• Implemented chunked sync to prevent timeouts</li>
              <li>• Fixed pagination to handle 130,000+ cars</li>
              <li>• Added auto-resume for large syncs</li>
              <li>• Optimized database performance with indexes</li>
              <li>• Enhanced monitoring and logging</li>
              <li>• Fixed frontend error handling</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSyncDashboard;