import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🔧 Admin API called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse URL path
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];

    switch (endpoint) {
      case 'health':
        return await handleHealthCheck(supabase);
      case 'sync-status':
        return await handleSyncStatus(supabase);
      case 'sync-trigger':
        return await handleSyncTrigger(supabase, req);
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error: any) {
    console.error('❌ Error in admin API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

async function handleHealthCheck(supabase: any): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const { data: dbCheck, error: dbError } = await supabase
      .from('cars_cache')
      .select('count')
      .limit(1)
      .single();

    const dbLatency = Date.now() - startTime;

    // Check cars_cache table status
    const { data: cacheStats, error: cacheError } = await supabase
      .rpc('cars_cache_filtered_count', {});

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbError ? 'unhealthy' : 'healthy',
          latency_ms: dbLatency,
          error: dbError?.message
        },
        cars_cache: {
          status: cacheError ? 'unhealthy' : 'healthy',
          total_cars: cacheStats || 0,
          error: cacheError?.message
        }
      },
      performance: {
        response_time_ms: Date.now() - startTime,
        targets: {
          list_p95_target_ms: 300,
          detail_p95_target_ms: 400
        }
      }
    };

    // Determine overall health
    const hasErrors = healthStatus.checks.database.status === 'unhealthy' || 
                     healthStatus.checks.cars_cache.status === 'unhealthy';
    
    if (hasErrors) {
      healthStatus.status = 'unhealthy';
    }

    return new Response(
      JSON.stringify(healthStatus),
      {
        status: hasErrors ? 503 : 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        response_time_ms: Date.now() - startTime
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleSyncStatus(supabase: any): Promise<Response> {
  try {
    // Get sync status from sync_status table
    const { data: syncStatus, error: syncError } = await supabase
      .from('sync_status')
      .select('*')
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .single();

    // Get cars_cache statistics
    const { data: totalCars, error: countError } = await supabase
      .rpc('cars_cache_filtered_count', {});

    // Get last sync time
    const { data: lastSync, error: lastSyncError } = await supabase
      .from('cars_cache')
      .select('last_api_sync')
      .order('last_api_sync', { ascending: false })
      .limit(1)
      .single();

    const status = {
      sync_status: syncStatus || { status: 'unknown', message: 'No sync records found' },
      cache_stats: {
        total_cars: totalCars || 0,
        last_sync: lastSync?.last_api_sync || null,
        cache_age_hours: lastSync?.last_api_sync ? 
          Math.round((Date.now() - new Date(lastSync.last_api_sync).getTime()) / (1000 * 60 * 60)) : null
      },
      errors: {
        sync_error: syncError?.message,
        count_error: countError?.message,
        last_sync_error: lastSyncError?.message
      }
    };

    return new Response(
      JSON.stringify(status),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, max-age=30'
        }
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get sync status',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleSyncTrigger(supabase: any, req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const body = await req.json();
    const syncType = body.type || 'manual';

    // Trigger sync by calling the cars-sync edge function
    const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/cars-sync`;
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        type: syncType,
        triggered_by: 'admin_api'
      })
    });

    const syncResult = await response.json();

    return new Response(
      JSON.stringify({
        message: 'Sync triggered successfully',
        sync_type: syncType,
        result: syncResult
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to trigger sync',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

serve(handler);