import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, Database, RefreshCw } from 'lucide-react';

interface VerificationResult {
  database_count: number;
  sync_status_count: number;
  sync_page: number;
  sync_status: string;
  correction_applied: boolean;
  api_mapping_version: string;
  last_heartbeat: string;
}

export const SyncVerificationWidget = () => {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const verifySync = async () => {
    setIsVerifying(true);
    try {
      console.log('🔍 Starting comprehensive sync verification...');
      
      const { data, error } = await supabase.rpc('get_accurate_sync_progress');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        
        const verificationResult: VerificationResult = {
          database_count: Number(result.cache_count),
          sync_status_count: Number(result.sync_status_records),
          sync_page: Number(result.sync_page),
          sync_status: result.sync_status,
          correction_applied: result.correction_applied,
          api_mapping_version: '2.0',
          last_heartbeat: new Date().toISOString()
        };
        
        setVerification(verificationResult);
        
        console.log('✅ Sync verification completed:', verificationResult);
        
        toast({
          title: "✅ Sync Verification Complete",
          description: `Database verified: ${verificationResult.database_count.toLocaleString()} cars confirmed`,
        });
      }
      
    } catch (error) {
      console.error('❌ Verification error:', error);
      toast({
        title: "❌ Verification Failed",
        description: error instanceof Error ? error.message : "Unknown verification error",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = (applied: boolean) => applied ? 'bg-green-500' : 'bg-yellow-500';
  const getStatusText = (applied: boolean) => applied ? 'Corrected' : 'No correction needed';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Sync Verification
        </CardTitle>
        <CardDescription>
          Verify database count accuracy and sync integrity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {verification && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Database Count</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {verification.database_count.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">Real cars in database</div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Sync Progress</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {verification.sync_status_count.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">
                Page {verification.sync_page} • Status: {verification.sync_status}
              </div>
            </div>
            
            <div className="col-span-full p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {verification.correction_applied ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">Count Display Status</span>
                </div>
                <Badge className={getStatusColor(verification.correction_applied)}>
                  {getStatusText(verification.correction_applied)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {verification.correction_applied 
                  ? `Display corrected to show real database count (${verification.database_count.toLocaleString()}) instead of misleading sync progress`
                  : 'Sync progress matches database count - no correction needed'
                }
              </div>
            </div>
          </div>
        )}
        
        <Button 
          onClick={verifySync} 
          disabled={isVerifying}
          className="w-full"
          variant="outline"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Verifying Database...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Verify Sync Accuracy
            </>
          )}
        </Button>
        
        {!verification && (
          <div className="text-center p-4 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click verify to check database accuracy</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};