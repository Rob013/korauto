import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlayCircle, StopCircle, RotateCcw } from 'lucide-react';

export const SimpleSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetSyncStatus = async () => {
    try {
      console.log('🔄 Resetting sync status...');
      
      // Reset sync status to allow fresh start
      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'idle',
          error_message: null,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');

      if (error) {
        console.error('Reset error:', error);
        throw error;
      }

      toast({
        title: "🔄 Sync Status Reset",
        description: "Sync status has been reset. You can now start a fresh sync.",
      });

    } catch (error) {
      console.error('Failed to reset sync status:', error);
      toast({
        title: "❌ Reset Failed",
        description: "Failed to reset sync status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startSimpleSync = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting simple enhanced sync...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-cars-sync', {
        body: {
          action: 'start',
          source: 'simple-trigger',
          maxSpeed: true
        }
      });

      if (error) {
        console.error('Sync error:', error);
        throw error;
      }

      console.log('✅ Sync started:', data);
      
      toast({
        title: "🚀 Sync Started Successfully!",
        description: "Enhanced cars sync is now running at maximum speed.",
        duration: 5000,
      });

    } catch (error) {
      console.error('Failed to start sync:', error);
      toast({
        title: "❌ Sync Failed",
        description: `Failed to start sync: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopSync = async () => {
    try {
      console.log('🛑 Stopping sync...');
      
      // Update sync status to stopped
      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'stopped',
          completed_at: new Date().toISOString(),
          error_message: 'Manually stopped by user'
        })
        .eq('id', 'cars-sync-main');

      if (error) throw error;

      toast({
        title: "🛑 Sync Stopped",
        description: "Sync has been stopped manually.",
      });

    } catch (error) {
      console.error('Failed to stop sync:', error);
      toast({
        title: "❌ Stop Failed",
        description: "Failed to stop sync. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-primary" />
          Simple Sync Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Manual Sync Control</h3>
            <p className="text-sm text-blue-700">
              Use these controls to manually manage the enhanced cars sync without automatic retries.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={startSimpleSync}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Start Enhanced Sync
                </>
              )}
            </Button>

            <Button 
              onClick={stopSync}
              variant="destructive"
              size="lg"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              Stop Sync
            </Button>

            <Button 
              onClick={resetSyncStatus}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset Status
            </Button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2">Instructions</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• First click "Reset Status" if sync is stuck</li>
              <li>• Then click "Start Enhanced Sync" to begin</li>
              <li>• Use "Stop Sync" to manually halt the process</li>
              <li>• Check the admin dashboard for progress updates</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleSyncTrigger;