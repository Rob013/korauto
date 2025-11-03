import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncSchedule {
  sync_type: string;
  last_sync_at: string;
  next_sync_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  cars_synced: number;
  cars_new: number;
  error_message?: string;
}

export const SyncStatusWidget = () => {
  const [syncStatus, setSyncStatus] = useState<SyncSchedule | null>(null);
  const [timeUntilSync, setTimeUntilSync] = useState<string>('');

  useEffect(() => {
    // Fetch sync status
    const fetchSyncStatus = async () => {
      const { data } = await supabase
        .from('sync_schedule')
        .select('*')
        .eq('sync_type', 'cars_incremental')
        .single();

      if (data) {
        setSyncStatus(data as any as SyncSchedule);
      }
    };

    fetchSyncStatus();

    // Subscribe to changes
    const subscription = supabase
      .channel('sync_schedule_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sync_schedule',
        filter: 'sync_type=eq.cars_incremental'
      }, (payload) => {
        setSyncStatus(payload.new as any as SyncSchedule);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!syncStatus?.next_sync_at) return;

    const updateTimer = () => {
      const now = new Date();
      const nextSync = new Date(syncStatus.next_sync_at);
      const diff = nextSync.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilSync('Due now');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilSync(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [syncStatus?.next_sync_at]);

  if (!syncStatus) return null;

  const getStatusBadge = () => {
    switch (syncStatus.status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-500">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>;
      default:
        return <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Auto Sync Status</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Sync:</span>
          <span>{new Date(syncStatus.last_sync_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Next Sync:</span>
          <span className="font-medium">{timeUntilSync}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cars Synced:</span>
          <span>{syncStatus.cars_synced} ({syncStatus.cars_new} new)</span>
        </div>
        {syncStatus.error_message && (
          <div className="text-destructive text-xs mt-2">
            Error: {syncStatus.error_message}
          </div>
        )}
        <div className="text-muted-foreground text-xs pt-2 border-t">
          Premium brands synced every 6 hours
        </div>
      </CardContent>
    </Card>
  );
};
