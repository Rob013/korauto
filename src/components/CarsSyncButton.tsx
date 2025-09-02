import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CarsSyncButton = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      console.log('🚀 Starting cars sync...');
      
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      console.log('✅ Sync completed:', data);
      
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${data.totalSynced} cars from API`,
        duration: 5000,
      });

      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync cars from API. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {syncing ? 'Syncing...' : 'Sync Cars'}
    </Button>
  );
};