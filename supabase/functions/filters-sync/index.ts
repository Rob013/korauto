import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('CAR_APIS_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting filter data sync...');

    // Fetch manufacturers from API
    const manufacturersRes = await fetch('https://auctionsapi.com/api/manufacturers/', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!manufacturersRes.ok) {
      throw new Error(`API error: ${manufacturersRes.status}`);
    }

    const manufacturersData = await manufacturersRes.json();
    const manufacturers = manufacturersData.data;

    console.log(`📊 Processing ${manufacturers.length} manufacturers...`);

    // Upsert manufacturers
    const { error: manufacturersError } = await supabase
      .from('manufacturers')
      .upsert(
        manufacturers.map((m: any) => ({
          id: String(m.id),
          name: m.name,
          car_count: m.cars_qty || 0,
          is_active: true,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'id' }
      );

    if (manufacturersError) throw manufacturersError;

    // Fetch and process models, grades, trims for each manufacturer
    for (const manufacturer of manufacturers.slice(0, 20)) { // Limit to avoid timeout
      console.log(`🔍 Processing manufacturer: ${manufacturer.name}`);
      
      // Fetch models
      const modelsRes = await fetch(
        `https://auctionsapi.com/api/models/${manufacturer.id}`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        const models = modelsData.data || [];

        if (models.length > 0) {
          await supabase.from('car_models').upsert(
            models.map((m: any) => ({
              id: `${manufacturer.id}-${m.id}`,
              manufacturer_id: String(manufacturer.id),
              name: m.name,
              car_count: m.cars_qty || 0,
              is_active: true,
              updated_at: new Date().toISOString()
            })),
            { onConflict: 'id' }
          );

          // Process grades/generations for each model (sample first 5 models)
          for (const model of models.slice(0, 5)) {
            const gradesRes = await fetch(
              `https://auctionsapi.com/api/generations/${model.id}`,
              { headers: { 'Authorization': `Bearer ${apiKey}` } }
            );

            if (gradesRes.ok) {
              const gradesData = await gradesRes.json();
              const grades = gradesData.data || [];

              if (grades.length > 0) {
                await supabase.from('car_grades').upsert(
                  grades.map((g: any) => ({
                    id: `${manufacturer.id}-${model.id}-${g.id}`,
                    model_id: `${manufacturer.id}-${model.id}`,
                    manufacturer_id: String(manufacturer.id),
                    name: g.name,
                    car_count: g.cars_qty || 0,
                    is_active: true,
                    updated_at: new Date().toISOString()
                  })),
                  { onConflict: 'id' }
                );
              }
            }
          }
        }
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Filter data sync completed!');

    return new Response(
      JSON.stringify({ success: true, message: 'Filters synced successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});