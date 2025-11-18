import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApiCacheSync } from '@/hooks/useApiCacheSync';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, RefreshCw, Download } from 'lucide-react';

export const AdminCacheSyncDashboard = () => {
  const { toast } = useToast();
  const { syncing, progress, error, syncApiData, syncBatch, fullSync } = useApiCacheSync();
  const [startPage, setStartPage] = useState(1);
  const [maxPages, setMaxPages] = useState(50);
  const [cacheStats, setCacheStats] = useState<{ total: number; lastSync: string | null }>({
    total: 0,
    lastSync: null
  });

  const loadCacheStats = async () => {
    try {
      const { count, error: countError } = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      const { data: latestSync } = await supabase
        .from('cars_cache')
        .select('last_api_sync')
        .order('last_api_sync', { ascending: false })
        .limit(1)
        .single();

      setCacheStats({
        total: count || 0,
        lastSync: latestSync?.last_api_sync || null
      });
    } catch (err) {
      console.error('Failed to load cache stats:', err);
    }
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  const handleBatchSync = async () => {
    toast({
      title: 'Starting Batch Sync',
      description: `Syncing pages ${startPage} to ${startPage + maxPages - 1}...`
    });

    const result = await syncBatch(startPage, maxPages);

    if (result.success) {
      toast({
        title: 'Batch Sync Complete',
        description: `Successfully synced ${result.totalSynced} cars`
      });
      loadCacheStats();
    } else {
      toast({
        title: 'Sync Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const handleFullSync = async () => {
    toast({
      title: 'Starting Full Sync',
      description: 'This will sync all available data from the API. This may take a while...'
    });

    const result = await fullSync();

    if (result.success) {
      toast({
        title: 'Full Sync Complete',
        description: `Successfully synced ${result.totalSynced} cars`
      });
      loadCacheStats();
    } else {
      toast({
        title: 'Sync Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          API Cache Sync Dashboard
        </CardTitle>
        <CardDescription>
          Manage the synchronization of car data from external API to local cache
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cache Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Total Cached Cars</div>
            <div className="text-2xl font-bold">{cacheStats.total.toLocaleString()}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Last Sync</div>
            <div className="text-sm font-medium">
              {cacheStats.lastSync 
                ? new Date(cacheStats.lastSync).toLocaleString() 
                : 'Never'}
            </div>
          </div>
        </div>

        {/* Batch Sync Controls */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Batch Sync
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startPage">Start Page</Label>
              <Input
                id="startPage"
                type="number"
                min={1}
                value={startPage}
                onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                disabled={syncing}
              />
            </div>
            <div>
              <Label htmlFor="maxPages">Max Pages</Label>
              <Input
                id="maxPages"
                type="number"
                min={1}
                max={500}
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)}
                disabled={syncing}
              />
            </div>
          </div>
          <Button
            onClick={handleBatchSync}
            disabled={syncing}
            className="w-full"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing... {progress}%
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Batch Sync
              </>
            )}
          </Button>
        </div>

        {/* Full Sync */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" />
            Full Sync
          </h3>
          <p className="text-sm text-muted-foreground">
            Sync all available car data from the API. This will download up to 500 pages of data 
            with all images and complete information.
          </p>
          <Button
            onClick={handleFullSync}
            disabled={syncing}
            variant="default"
            className="w-full"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing... {progress}%
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Start Full Sync
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-destructive bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive font-medium">Error: {error}</p>
          </div>
        )}

        {/* Refresh Stats */}
        <Button
          onClick={loadCacheStats}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Statistics
        </Button>
      </CardContent>
    </Card>
  );
};