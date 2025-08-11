import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase env vars" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sb = createClient(supabaseUrl, serviceKey);

    const responses: any = {};

    // 1) Full sync of all cars at 03:00 local (triggered by cron)
    try {
      const encarRes = await fetch(
        `${supabaseUrl}/functions/v1/encar-sync?type=full`,
        { method: "POST" }
      );
      responses["encar-sync"] = {
        status: encarRes.status,
        ok: encarRes.ok,
        body: await encarRes.text().catch(() => null),
      };
    } catch (e) {
      responses["encar-sync"] = { error: String(e) };
    }

    // 2) Refresh cache with latest cars (additional cache)
    try {
      const carsCacheRes = await fetch(
        `${supabaseUrl}/functions/v1/cars-sync`,
        { method: "POST" }
      );
      responses["cars-sync"] = {
        status: carsCacheRes.status,
        ok: carsCacheRes.ok,
        body: await carsCacheRes.text().catch(() => null),
      };
    } catch (e) {
      responses["cars-sync"] = { error: String(e) };
    }

    return new Response(
      JSON.stringify({ success: true, responses }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

