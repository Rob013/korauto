import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface SyncResponse {
  success: boolean;
  message?: string;
  totalSynced?: number;
  error?: string;
}

const AdminCarSync = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    message: string;
    totalSynced: number;
  }>({
    status: 'idle',
    message: '',
    totalSynced: 0
  });

  const handleFullSync = async () => {
    setIsLoading(true);
    setSyncProgress({
      status: 'running',
      message: 'Starting full car sync from API...',
      totalSynced: 0
    });

    try {
      // Call the cars-sync edge function
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      const response: SyncResponse = data;

      if (response.success) {
        setSyncProgress({
          status: 'completed',
          message: response.message || 'Sync completed successfully',
          totalSynced: response.totalSynced || 0
        });

        toast({
          title: "Sync Completed",
          description: `Successfully synced ${response.totalSynced || 0} cars from API`,
        });
      } else {
        throw new Error(response.error || 'Sync failed');
      }

    } catch (error) {
      console.error('Sync error:', error);
      
      setSyncProgress({
        status: 'error',
        message: error instanceof Error ? error.message : 'Sync failed with unknown error',
        totalSynced: 0
      });

      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (syncProgress.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (syncProgress.status) {
      case 'running':
        return <Badge variant="secondary">Syncing...</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Car Database Sync
              </CardTitle>
              <CardDescription>
                Sync all cars from external API to populate the database for global sorting
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleFullSync}
              disabled={isLoading}
              size="lg"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isLoading ? 'Syncing...' : 'Start Full Sync'}
            </Button>
            
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                This will fetch ALL cars from the external API and update the database.
                The process may take several minutes.
              </p>
            </div>
          </div>

          {syncProgress.status !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{syncProgress.message}</span>
              </div>
              
              {syncProgress.status === 'running' && (
                <Progress value={undefined} className="w-full" />
              )}
              
              {syncProgress.totalSynced > 0 && (
                <div className="text-sm text-muted-foreground">
                  Cars synced: <span className="font-medium">{syncProgress.totalSynced.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">What this sync does:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Fetches ALL cars from the external API (up to 50,000+ cars)</li>
              <li>• Populates the cars_cache table with complete car data</li>
              <li>• Calculates price_cents and rank_score for global sorting</li>
              <li>• Updates existing cars and adds new ones</li>
              <li>• Enables the catalog to show properly sorted results across all pages</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">Important Notes</span>
            </div>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• This process can take 10-30 minutes depending on API response time</li>
              <li>• The catalog will show updated results immediately after sync</li>
              <li>• Only run this sync when you need to refresh all car data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCarSync;