import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const FullCarsSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  const startFullSync = async () => {
    setIsLoading(true);
    setProgress('Starting full cars sync...');

    try {
      toast({
        title: "Starting Full Cars Sync",
        description: "This will fetch all 190,000+ cars from the API. This may take several minutes...",
      });

      // Call the cars-sync edge function
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { fullSync: true }
      });

      if (error) {
        throw error;
      }

      setProgress(`Sync completed! ${data.totalSynced} cars synchronized`);
      
      toast({
        title: "Sync Completed Successfully!",
        description: `${data.totalSynced} cars have been synchronized to the database.`,
      });

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Sync failed:', error);
      setProgress('Sync failed. Please try again.');
      
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync cars. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Full Cars Database Sync</h3>
      <p className="text-muted-foreground mb-4">
        Synchronize all 190,000+ cars from the API to the database. This process may take several minutes.
      </p>
      
      {progress && (
        <div className="mb-4 p-3 bg-muted rounded">
          <p className="text-sm">{progress}</p>
        </div>
      )}
      
      <Button 
        onClick={startFullSync} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing Cars...
          </>
        ) : (
          'Start Full Cars Sync'
        )}
      </Button>
    </div>
  );
};