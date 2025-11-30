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
    console.log('🔄 Starting scheduled cache sync...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Trigger Encar sync to refresh cache with new cars
    console.log('📥 Triggering Encar sync...');
    const { data: syncData, error: syncError } = await supabase.functions.invoke('encar-sync', {
      body: { 
        scheduled: true,
        maxPages: 50 // Limit to 50 pages for scheduled sync
      }
    });

    if (syncError) {
      console.error('❌ Encar sync failed:', syncError);
      throw new Error(`Encar sync failed: ${syncError.message}`);
    }

    console.log('✅ Encar sync completed:', syncData);

    // 2. Delete archived/inactive cars older than 30 days
    console.log('🗑️ Cleaning up archived cars...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deletedCars, error: deleteError } = await supabase
      .from('encar_cars_cache')
      .delete()
      .eq('is_active', false)
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .select('count', { count: 'exact', head: true });

    if (deleteError) {
      console.error('❌ Failed to delete archived cars:', deleteError);
    } else {
      console.log(`✅ Deleted ${deletedCars?.length || 0} archived cars`);
    }

    // 3. Delete cars with invalid/unrealistic prices (below 700,000 KRW / ~3,000 EUR)
    console.log('🗑️ Cleaning up cars with invalid prices...');
    const { data: deletedPricelessCars, error: pricelessDeleteError } = await supabase
      .from('encar_cars_cache')
      .delete()
      .or('buy_now_price.is.null,buy_now_price.lt.700000')
      .select('count', { count: 'exact', head: true });

    if (pricelessDeleteError) {
      console.error('❌ Failed to delete invalid price cars:', pricelessDeleteError);
    } else {
      const pricelessCount = deletedPricelessCars?.length || 0;
      console.log(`✅ Deleted ${pricelessCount} cars with invalid prices`);
    }

    // 4. Delete sold/archived cars from API
    console.log('🗑️ Cleaning up sold/archived cars...');
    const { data: deletedSoldCars, error: soldDeleteError } = await supabase
      .from('encar_cars_cache')
      .delete()
      .in('advertisement_status', ['SOLD', 'ARCHIVED', 'COMPLETED', 'INACTIVE', 'CLOSED', 'FINISHED'])
      .select('count', { count: 'exact', head: true });

    if (soldDeleteError) {
      console.error('❌ Failed to delete sold/archived cars:', soldDeleteError);
    } else {
      const soldCount = deletedSoldCars?.length || 0;
      console.log(`✅ Deleted ${soldCount} sold/archived cars`);
    }

    // 5. Update sync schedule record
    const { error: scheduleError } = await supabase
      .from('sync_schedule')
      .upsert({
        sync_type: 'scheduled_cache_refresh',
        last_sync_at: new Date().toISOString(),
        next_sync_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        status: 'completed',
        cars_synced: syncData?.carsProcessed || 0,
        cars_new: syncData?.carsAdded || 0
      }, {
        onConflict: 'sync_type'
      });

    if (scheduleError) {
      console.warn('⚠️ Failed to update schedule:', scheduleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cache sync completed successfully',
        syncResults: syncData,
        deletedArchivedCount: deletedCars?.length || 0,
        deletedPricelessCount: deletedPricelessCars?.length || 0,
        deletedSoldCount: deletedSoldCars?.length || 0,
        nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Scheduled sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
