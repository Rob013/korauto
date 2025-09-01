import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCarSync } from '@/hooks/useCarSync';

export const CarsSyncButton = () => {
  const { syncing, startSync } = useCarSync();
  const { toast } = useToast();

  const handleSync = async () => {
    const result = await startSync();
    
    if (result.success) {
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${result.totalSynced} cars from API`,
        duration: 5000,
      });
    } else {
      toast({
        title: "Sync Failed",
        description: result.error || "Failed to sync cars from API. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
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