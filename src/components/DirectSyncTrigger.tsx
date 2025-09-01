import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, RefreshCw } from 'lucide-react';

export const DirectSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startDirectSync = async () => {
    setIsLoading(true);
    
    try {
      toast({
        title: "🚀 Starting Direct Maximum Speed Sync",
        description: "Bypassing AI coordinator for direct sync execution",
      });

      console.log('🚀 Starting direct cars-sync edge function...');
      
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          resume: true,
          fromPage: 498,
          source: 'direct-max-speed-sync',
          maxSpeed: true
        }
      });

      if (error) {
        console.error('Direct sync error:', error);
        throw error;
      }

      console.log('✅ Direct sync response:', data);
      
      toast({
        title: "✅ Direct Sync Started",
        description: "Maximum speed sync is now running directly without AI coordinator",
      });

    } catch (error: unknown) {
      console.error('Direct sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "❌ Direct Sync Failed",
        description: `Failed to start direct sync: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSync = async () => {
    try {
      toast({
        title: "🔄 Resetting Sync Status",
        description: "Clearing stuck sync status...",
      });

      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: 'Manual reset - continuing from current position',
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');

      if (error) throw error;

      toast({
        title: "✅ Sync Reset Complete",
        description: "Sync status has been reset. You can now start a fresh sync.",
      });

    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: "❌ Reset Failed",
        description: "Failed to reset sync status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Direct Maximum Speed Sync
        </h3>
        <p className="text-sm text-muted-foreground">
          Bypass AI coordinator and run sync directly at maximum speed from page 498
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={startDirectSync}
          disabled={isLoading}
          size="lg"
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Direct Sync...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Start Direct Sync
            </>
          )}
        </Button>
        
        <Button 
          onClick={resetSync}
          variant="outline"
          size="lg"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Status
        </Button>
      </div>
    </div>
  );
};