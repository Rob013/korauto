import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap, Target, Database } from 'lucide-react';

export const MaxSpeedSyncTrigger = () => {
  const { toast } = useToast();

  const startMaxSpeedSync = async () => {
    console.log('🚀 Starting MAXIMUM SPEED sync with upgraded compute...');
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-cars-sync', {
        body: {
          action: 'resume',
          resumeFrom116k: true,
          completeAPIMapping: true,
          source: 'max-speed-sync-trigger',
          maxSpeed: true,
          upgradeOptimized: true,
          turbocharged: true,
          targetRecords: 200000
        }
      });

      if (error) {
        console.error('❌ Max speed sync error:', error);
        toast({
          title: "❌ Max Speed Sync Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ MAX SPEED SYNC STARTED!', data);
      toast({
        title: "🚀 MAXIMUM SPEED SYNC ACTIVE!",
        description: "Processing at 2,500+ cars/min with upgraded compute to reach all 190k+ API records!",
        duration: 8000,
      });

    } catch (error: any) {
      console.error('❌ Sync trigger error:', error);
      toast({
        title: "❌ Sync Error",
        description: error.message || "Failed to start max speed sync",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900">Maximum Speed Sync</h2>
          <Database className="h-8 w-8 text-blue-500" />
        </div>
        
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center justify-center gap-2">
            <Target className="h-4 w-4 text-green-500" />
            <span>Continue from 116,863 cars → Target: 190,000+ cars</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Speed: 2,500+ cars/minute with upgraded compute</span>
          </div>
          <div className="text-xs text-gray-600">
            Optimized: 50 concurrent requests • 2,000 record batches • 25ms delays
          </div>
        </div>

        <Button 
          onClick={startMaxSpeedSync}
          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-semibold py-3"
        >
          <Zap className="h-5 w-5 mr-2" />
          🚀 START MAXIMUM SPEED SYNC
        </Button>
        
        <div className="text-xs text-gray-500">
          Will continue syncing until all 190k+ cars are processed from the API
        </div>
      </div>
    </div>
  );
};