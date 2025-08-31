import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';

export const TurboSyncTrigger = () => {
  const { toast } = useToast();

  const startTurboSync = async () => {
    console.log('🚀 Starting MAXIMUM SPEED Turbo Sync with upgraded compute...');
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-cars-sync', {
        body: {
          action: 'resume',
          resumeFrom116k: true,
          completeAPIMapping: true,
          source: 'turbo-sync-trigger',
          forcePreciseResume: true,
          maxSpeed: true,
          upgradeOptimized: true,
          turbocharged: true
        }
      });

      if (error) {
        console.error('❌ Turbo sync error:', error);
        toast({
          title: "❌ Turbo Sync Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ TURBO SYNC STARTED!', data);
      toast({
        title: "🚀 TURBO SYNC LAUNCHED!",
        description: "Maximum speed sync with upgraded compute - 50k+ cars per run!",
        duration: 5000,
      });

      // Redirect to admin dashboard to monitor
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);

    } catch (error: any) {
      console.error('❌ Sync trigger error:', error);
      toast({
        title: "❌ Sync Error",
        description: error.message || "Failed to start turbo sync",
        variant: "destructive"
      });
    }
  };

  // Auto-start the turbo sync immediately
  React.useEffect(() => {
    console.log('🎯 Auto-starting turbo sync in 2 seconds...');
    const timer = setTimeout(startTurboSync, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md text-center">
        <Zap className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-4">🚀 Turbo Sync Starting!</h2>
        <p className="text-muted-foreground mb-6">
          Starting maximum speed sync with your upgraded compute...
          <br />
          <span className="text-sm">50k+ cars per 15-minute run!</span>
        </p>
        <Button 
          onClick={startTurboSync}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
        >
          <Zap className="h-4 w-4 mr-2" />
          Start Turbo Sync Now
        </Button>
      </div>
    </div>
  );
};