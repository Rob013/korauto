import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Checking for incomplete syncs to continue...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the most recent running sync
    const { data: runningSyncs, error: findError } = await supabase
      .from('encar_sync_status')
      .select('*')
      .eq('status', 'running')
      .order('sync_started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!runningSyncs) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No running syncs found to continue'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const runningSync = runningSyncs;
    const syncAge = Date.now() - new Date(runningSync.sync_started_at).getTime();
    const syncAgeMinutes = Math.floor(syncAge / 60000);

    console.log(`📊 Found sync ${runningSync.id}: ${runningSync.cars_processed || 0} cars processed (${syncAgeMinutes}min old)`);

    // If sync is very old (>2 hours), mark as failed
    if (syncAgeMinutes > 120) {
      await supabase
        .from('encar_sync_status')
        .update({
          status: 'failed',
          error_message: 'Sync timeout - exceeded 2 hour limit',
          sync_completed_at: new Date().toISOString()
        })
        .eq('id', runningSync.id);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Sync too old, marked as failed. Start a new sync.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger continuation via encar-sync with resume flag
    console.log('🚀 Triggering encar-sync continuation...');
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('encar-sync', {
      body: { resume: true }
    });

    if (syncError) {
      console.error('❌ Failed to continue sync:', syncError);
      throw syncError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync continuation triggered',
        syncId: runningSync.id,
        carsProcessed: runningSync.cars_processed || 0,
        result: syncResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Continue sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
