// Cron configuration for scheduled tasks
// This function is called by Supabase Cron to trigger scheduled syncs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('⏰ Cron job triggered at:', new Date().toISOString());

    // Check if sync is due
    const { data: syncSchedule } = await supabaseClient
      .from('sync_schedule')
      .select('*')
      .eq('sync_type', 'cars_incremental')
      .single();

    if (!syncSchedule) {
      console.log('⚠️  No sync schedule found');
      return new Response(
        JSON.stringify({ success: false, message: 'No sync schedule configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const nextSync = new Date(syncSchedule.next_sync_at);

    console.log(`📅 Current time: ${now.toISOString()}`);
    console.log(`📅 Next scheduled sync: ${nextSync.toISOString()}`);

    // Check if sync is due (within 5 minutes of scheduled time)
    const timeDiff = now.getTime() - nextSync.getTime();
    const isDue = timeDiff >= -5 * 60 * 1000 && timeDiff <= 5 * 60 * 1000;

    if (!isDue) {
      console.log(`⏭️  Sync not due yet. Time until next sync: ${Math.round((nextSync.getTime() - now.getTime()) / (60 * 1000))} minutes`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sync not due yet',
          nextSync: nextSync.toISOString(),
          minutesUntilSync: Math.round((nextSync.getTime() - now.getTime()) / (60 * 1000))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Triggering scheduled sync...');

    // Update status to running
    await supabaseClient
      .from('sync_schedule')
      .update({ status: 'running' })
      .eq('sync_type', 'cars_incremental');

    // Call the scheduled-cars-sync function
    const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scheduled-cars-sync`;
    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    });

    const syncResult = await syncResponse.json();

    console.log('✅ Sync triggered:', syncResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled sync triggered',
        syncResult,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
