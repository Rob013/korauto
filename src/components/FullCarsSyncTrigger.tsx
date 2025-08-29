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
        description: "Syncing cars in batches to avoid timeouts. This will take several minutes...",
      });

      let totalSynced = 0;
      let batchNumber = 1;
      let shouldContinue = true;

      // Run multiple batches to get all cars
      while (shouldContinue && batchNumber <= 100) { // Max 100 batches for safety
        setProgress(`Syncing batch ${batchNumber}... Total synced so far: ${totalSynced}`);
        
        // Call the cars-sync edge function
        const { data, error } = await supabase.functions.invoke('cars-sync', {
          body: { fullSync: true, batchNumber }
        });

        if (error) {
          console.error('Batch sync error:', error);
          // If error object has success: false, it might still contain data
          if (error.success === false) {
            setProgress(`Batch ${batchNumber} completed with issues. Total synced: ${totalSynced}`);
            break;
          } else {
            throw error;
          }
        }

        if (data) {
          totalSynced += data.totalSynced || 0;
          console.log(`Batch ${batchNumber}: synced ${data.totalSynced} cars, total: ${totalSynced}`);
          
          // Check if we should continue (if we got a full batch of 50 pages = ~2500 cars)
          if (data.pagesProcessed < 50 || data.totalSynced < 1000) {
            shouldContinue = false; // Likely reached the end
          }
        } else {
          shouldContinue = false;
        }
        
        batchNumber++;
        
        // Short delay between batches
        if (shouldContinue) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      setProgress(`Sync completed! ${totalSynced} cars synchronized in ${batchNumber - 1} batches`);
      
      toast({
        title: "Sync Completed Successfully!",
        description: `${totalSynced} cars have been synchronized to the database in ${batchNumber - 1} batches.`,
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