import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bell, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UpdateStatus {
  lastSyncTime: string | null;
  newCarsCount: number;
  totalCarsCount: number;
  lastChecked: string;
}

export const CheckNewUpdates = () => {
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const { toast } = useToast();

  // Check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      // Get the latest sync information from sync_status table
      const { data: syncData, error: syncError } = await supabase
        .from('sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (syncError && syncError.code !== 'PGRST116') {
        throw syncError;
      }

      // Get total count of active cars
      const { count: totalCount, error: countError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) {
        throw countError;
      }

      // Get cars added in the last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { count: newCarsCount, error: newCarsError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (newCarsError) {
        throw newCarsError;
      }

      const status: UpdateStatus = {
        lastSyncTime: syncData?.created_at || null,
        newCarsCount: newCarsCount || 0,
        totalCarsCount: totalCount || 0,
        lastChecked: new Date().toISOString(),
      };

      setUpdateStatus(status);
      setHasNewUpdates((newCarsCount || 0) > 0);

      if ((newCarsCount || 0) > 0) {
        toast({
          title: "New Cars Available!",
          description: `${newCarsCount} new cars have been added in the last 24 hours.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "No New Updates",
          description: "No new cars have been added recently.",
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('Error checking for updates:', error);
      toast({
        title: "Update Check Failed",
        description: "Could not check for new car updates. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setChecking(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Updates</h3>
          {hasNewUpdates && (
            <Badge variant="destructive" className="animate-pulse">
              New
            </Badge>
          )}
        </div>
        <Button
          onClick={checkForUpdates}
          disabled={checking}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {checking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {checking ? 'Checking...' : 'Check Updates'}
        </Button>
      </div>

      {updateStatus && (
        <Alert className={hasNewUpdates ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50'}>
          <div className="flex items-center gap-2">
            {hasNewUpdates ? (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">
                  {hasNewUpdates 
                    ? `🎉 ${updateStatus.newCarsCount} new cars added in the last 24 hours!`
                    : '✅ You\'re up to date - no new cars recently'
                  }
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Total cars: {updateStatus.totalCarsCount.toLocaleString()}</span>
                  </div>
                  {updateStatus.lastSyncTime && (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3" />
                      <span>Last sync: {getTimeSince(updateStatus.lastSyncTime)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Checked: {getTimeSince(updateStatus.lastChecked)}</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
};