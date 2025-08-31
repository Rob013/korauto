import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Play,
  RefreshCw,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

export const FullSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const triggerFullSync = async () => {
    setIsLoading(true);
    try {
      console.log("🚀 Triggering full car sync with complete data capture...");
      
      const response = await supabase.functions.invoke('cars-sync', {
        body: {
          sync_type: 'full',
          capture_all_data: true,
          auto_sync: false
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setLastResult(response.data);
      toast({
        title: "Full Sync Started",
        description: "Complete car data sync is now running. This may take several minutes.",
      });
      
      // Start monitoring sync status
      const interval = setInterval(async () => {
        const { data: status } = await supabase
          .from('sync_status')
          .select('*')
          .eq('id', 'cars-sync-main')
          .single();
        
        setSyncStatus(status);
        
        if (status?.status === 'completed' || status?.status === 'failed') {
          clearInterval(interval);
          setIsLoading(false);
        }
      }, 3000);

    } catch (error) {
      console.error("❌ Sync trigger error:", error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const checkSyncStatus = async () => {
    try {
      const { data: status } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single();
      
      setSyncStatus(status);
      
      // Also get car counts
      const { count: totalCars } = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact', head: true });
      
      const { count: carsWithImages } = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact', head: true })
        .not('images', 'eq', '[]')
        .not('images', 'is', null);

      setSyncStatus((prev: any) => ({
        ...prev,
        total_cars: totalCars,
        cars_with_images: carsWithImages
      }));

    } catch (error) {
      console.error("Error checking sync status:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Full Car Data Sync Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={triggerFullSync}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Full Sync
          </Button>
          
          <Button
            onClick={checkSyncStatus}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Info className="h-4 w-4" />
            Check Status
          </Button>
        </div>

        {/* Sync Status Display */}
        {syncStatus && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Sync Status:</span>
              <Badge 
                variant={
                  syncStatus.status === 'completed' ? 'default' : 
                  syncStatus.status === 'running' ? 'secondary' : 
                  syncStatus.status === 'failed' ? 'destructive' : 'outline'
                }
                className="flex items-center gap-1"
              >
                {syncStatus.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                {syncStatus.status === 'running' && <RefreshCw className="h-3 w-3 animate-spin" />}
                {syncStatus.status === 'failed' && <AlertTriangle className="h-3 w-3" />}
                {syncStatus.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Records Processed:</span>
                <span className="ml-2 font-medium">{syncStatus.records_processed || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Page:</span>
                <span className="ml-2 font-medium">{syncStatus.current_page || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Cars:</span>
                <span className="ml-2 font-medium">{syncStatus.total_cars || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cars with Images:</span>
                <span className="ml-2 font-medium">{syncStatus.cars_with_images || 0}</span>
              </div>
            </div>
            
            {syncStatus.started_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Started:</span>
                <span className="ml-2 font-medium">{formatDate(syncStatus.started_at)}</span>
              </div>
            )}
            
            {syncStatus.completed_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2 font-medium">{formatDate(syncStatus.completed_at)}</span>
              </div>
            )}
            
            {syncStatus.error_message && (
              <div className="text-sm">
                <span className="text-muted-foreground text-red-500">Error:</span>
                <span className="ml-2 font-medium text-red-500">{syncStatus.error_message}</span>
              </div>
            )}
          </div>
        )}

        {/* Auto-Sync Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Automatic Sync Schedule</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-200">
            Cars are automatically synced every 6 hours (at 0, 6, 12, 18 o'clock) to update sold cars and add new listings.
          </p>
        </div>

        {/* Last Sync Result */}
        {lastResult && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Last Sync Result:</h4>
            <pre className="text-xs text-green-700 dark:text-green-200 overflow-x-auto">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};