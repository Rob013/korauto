import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database, RefreshCw, Target, CheckCircle } from 'lucide-react';

export default function ComprehensiveSyncTrigger() {
  const [isResetting, setIsResetting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();
  
  const TARGET_CARS = 193306;
  const CURRENT_CARS = 176517;
  const REMAINING_CARS = TARGET_CARS - CURRENT_CARS;
  const COMPLETION_PERCENTAGE = (CURRENT_CARS / TARGET_CARS) * 100;

  const resetStuckSync = async () => {
    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: 'Manual reset for comprehensive API data sync to reach 193,306 cars',
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');

      if (error) throw error;

      toast({
        title: "🔄 Sync Reset Complete",
        description: "Stuck sync has been reset and ready for comprehensive restart"
      });
      
      console.log('✅ Sync status reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset sync:', error);
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset sync status",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const startComprehensiveSync = async () => {
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: {
          resume: true,
          fromPage: Math.floor(CURRENT_CARS / 250), // Resume from current progress
          smartSync: true,
          aiCoordinated: true,
          source: 'comprehensive-sync',
          reason: `Syncing remaining ${REMAINING_CARS.toLocaleString()} cars to reach target of ${TARGET_CARS.toLocaleString()}`,
          target_total: TARGET_CARS,
          comprehensive_data_capture: true,
          api_data_mapping: 'complete'
        }
      });

      if (error) throw error;

      toast({
        title: "🚀 Comprehensive Sync Started",
        description: `Syncing remaining ${REMAINING_CARS.toLocaleString()} cars with complete API data capture`
      });
      
      console.log('✅ Comprehensive sync initiated:', data);
    } catch (error) {
      console.error('❌ Failed to start comprehensive sync:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start comprehensive sync",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Comprehensive API Data Sync
        </CardTitle>
        <CardDescription>
          Complete data capture for all 193,306 cars with full API information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Current Progress</span>
            <span className="font-mono">{CURRENT_CARS.toLocaleString()} / {TARGET_CARS.toLocaleString()}</span>
          </div>
          <Progress value={COMPLETION_PERCENTAGE} className="h-2" />
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-green-600">{CURRENT_CARS.toLocaleString()}</div>
              <div className="text-muted-foreground">Synced</div>
            </div>
            <div>
              <div className="font-bold text-orange-600">{REMAINING_CARS.toLocaleString()}</div>
              <div className="text-muted-foreground">Remaining</div>
            </div>
            <div>
              <div className="font-bold text-blue-600">{COMPLETION_PERCENTAGE.toFixed(1)}%</div>
              <div className="text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>

        {/* API Data Capture Features */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Complete API Data Capture</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Engine & Performance Data
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Complete Vehicle Specs
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Auction & Sale Details
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              All Image Variants
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              History & Documentation
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Registration & Legal Info
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={resetStuckSync}
            disabled={isResetting}
            variant="outline"
            className="w-full"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Stuck Sync
              </>
            )}
          </Button>

          <Button 
            onClick={startComprehensiveSync}
            disabled={isStarting}
            className="w-full"
          >
            {isStarting ? (
              <>
                <Database className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Start Comprehensive Sync
              </>
            )}
          </Button>
        </div>

        {/* Information */}
        <div className="text-xs text-muted-foreground">
          <p><strong>Target:</strong> Sync all 193,306 cars with complete API data including engine specs, performance data, auction details, all images, and comprehensive vehicle information.</p>
          <p className="mt-1"><strong>Resume Strategy:</strong> Will continue from page ~{Math.floor(CURRENT_CARS / 250)} to capture remaining {REMAINING_CARS.toLocaleString()} cars.</p>
        </div>
      </CardContent>
    </Card>
  );
}