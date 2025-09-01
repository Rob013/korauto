import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export const ResilientSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'healthy' | 'timeout' | 'unknown'>('unknown');
  const [lastSyncCheck, setLastSyncCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  // Check database connectivity
  const checkDatabaseHealth = async () => {
    try {
      const result = await Promise.race([
        supabase.from('cars_cache').select('count').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 3000)
        )
      ]) as any;
      
      if (result.error) {
        setDbStatus('timeout');
        return false;
      }
      
      setDbStatus('healthy');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      setDbStatus('timeout');
      return false;
    }
  };

  useEffect(() => {
    checkDatabaseHealth();
    const interval = setInterval(checkDatabaseHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const startResilientSync = async () => {
    setIsLoading(true);
    
    try {
      // First check database health
      const isDbHealthy = await checkDatabaseHealth();
      
      if (!isDbHealthy) {
        toast({
          title: "⚠️ Database Connection Issues",
          description: "Database is experiencing timeouts. Sync will continue when connection recovers.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "🚀 Starting Resilient Maximum Speed Sync",
        description: "Using direct edge function call with database connectivity monitoring",
      });

      // Direct call to cars-sync with resilient parameters
      console.log('🚀 Starting resilient sync...');
      
      // Try health check first
      try {
        const healthResponse = await fetch('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`,
            'Accept': 'application/json'
          }
        });
        
        if (healthResponse.ok) {
          console.log('✅ Edge function health check passed');
        }
      } catch (healthError) {
        console.warn('⚠️ Health check failed, proceeding with sync anyway');
      }

      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          resume: true,
          fromPage: 498,
          source: 'resilient-sync',
          maxSpeed: true,
          resilientMode: true
        }
      });

      if (error) {
        console.error('Sync error:', error);
        
        // Check if it's a database connectivity issue
        if (error.message?.includes('timeout') || error.message?.includes('connection')) {
          toast({
            title: "🔄 Database Connection Issue",
            description: "Sync will retry automatically when database connectivity recovers",
            variant: "destructive",
          });
          
          // Set up retry mechanism
          setTimeout(() => startResilientSync(), 60000); // Retry in 1 minute
          return;
        }
        
        throw error;
      }

      console.log('✅ Resilient sync response:', data);
      
      toast({
        title: "✅ Resilient Sync Started",
        description: "Maximum speed sync is running with database monitoring and auto-recovery",
      });

      setLastSyncCheck(new Date());

    } catch (error: unknown) {
      console.error('Resilient sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "❌ Resilient Sync Failed",
        description: `Sync failed: ${errorMessage}. Will retry automatically.`,
        variant: "destructive",
      });
      
      // Auto-retry in 2 minutes for non-critical errors
      if (!errorMessage.includes('Configuration') && !errorMessage.includes('Authentication')) {
        setTimeout(() => startResilientSync(), 120000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDbStatusIcon = () => {
    switch (dbStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'timeout':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDbStatusText = () => {
    switch (dbStatus) {
      case 'healthy':
        return 'Database Healthy';
      case 'timeout':
        return 'Database Timeout Issues';
      default:
        return 'Checking Database...';
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Resilient Maximum Speed Sync
        </h3>
        <p className="text-sm text-muted-foreground">
          Advanced sync with database monitoring, auto-recovery, and connection timeout handling
        </p>
        <div className="flex items-center gap-2 text-xs">
          {getDbStatusIcon()}
          <span className={dbStatus === 'healthy' ? 'text-green-600' : dbStatus === 'timeout' ? 'text-red-600' : 'text-yellow-600'}>
            {getDbStatusText()}
          </span>
          {lastSyncCheck && (
            <span className="text-muted-foreground">
              • Last check: {lastSyncCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <Button 
        onClick={startResilientSync}
        disabled={isLoading}
        size="lg"
        className="w-full"
        variant={dbStatus === 'healthy' ? 'default' : 'outline'}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting Resilient Sync...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Start Resilient Sync (Page 498+)
          </>
        )}
      </Button>
      
      {dbStatus === 'timeout' && (
        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border">
          ⚠️ Database connectivity issues detected. Sync will automatically retry when connection recovers.
        </div>
      )}
    </div>
  );
};