import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAPIDataSync } from "@/hooks/useAPIDataSync";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Car,
  Building2,
  Layers
} from "lucide-react";

interface SyncStatus {
  id: string;
  sync_type: string;
  last_sync_at: string;
  records_synced: number;
  total_records: number;
  status: string;
  error_message?: string;
  created_at: string;
}

const AdminDataSync = () => {
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const {
    syncStatus,
    syncProgress,
    error,
    performFullSync,
    syncManufacturers,
    syncModels,
    syncCars
  } = useAPIDataSync();

  useEffect(() => {
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('api_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSyncHistory(data || []);
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  const handleFullSync = async () => {
    setLoading(true);
    try {
      const result = await performFullSync();
      
      toast({
        title: "Sync Completed",
        description: `Synced ${result.manufacturers} manufacturers, ${result.models} models, and ${result.cars} cars`,
      });
      
      await loadSyncHistory();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualSync = async (type: 'manufacturers' | 'models' | 'cars') => {
    setLoading(true);
    try {
      let result;
      switch (type) {
        case 'manufacturers':
          result = await syncManufacturers();
          toast({
            title: "Manufacturers Synced",
            description: `Successfully synced ${result} manufacturers`,
          });
          break;
        case 'models':
          result = await syncModels();
          toast({
            title: "Models Synced",
            description: `Successfully synced ${result} car models`,
          });
          break;
        case 'cars':
          result = await syncCars();
          toast({
            title: "Cars Synced",
            description: `Successfully synced ${result} cars`,
          });
          break;
      }
      
      await loadSyncHistory();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Full Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleFullSync} 
              disabled={loading || syncStatus === 'syncing'}
              className="w-full"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Sync All Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Sync manufacturers, models, and cars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Manufacturers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleIndividualSync('manufacturers')} 
              disabled={loading || syncStatus === 'syncing'}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Sync Brands
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              ~397 car manufacturers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleIndividualSync('models')} 
              disabled={loading || syncStatus === 'syncing'}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Sync Models
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              All car models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Cars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleIndividualSync('cars')} 
              disabled={loading || syncStatus === 'syncing'}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Sync Cars
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              All available cars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Sync Status */}
      {syncStatus === 'syncing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Sync in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <Progress 
                  value={(syncProgress.current / Math.max(syncProgress.total, 1)) * 100} 
                  className="w-full"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600">
                  Error: {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sync history available</p>
                <p className="text-sm">Run your first sync to see results here</p>
              </div>
            ) : (
              syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{sync.sync_type}</span>
                        {getStatusBadge(sync.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sync.records_synced} / {sync.total_records} records
                        {sync.status === 'completed' && (
                          <span className="ml-2">✓ Completed</span>
                        )}
                      </div>
                      {sync.error_message && (
                        <div className="text-sm text-red-600 mt-1">
                          {sync.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{new Date(sync.last_sync_at).toLocaleDateString()}</div>
                    <div>{new Date(sync.last_sync_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDataSync;