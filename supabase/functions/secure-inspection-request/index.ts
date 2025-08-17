import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🔐 Secure Inspection Request called:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      car_id, 
      notes,
      client_ip 
    } = await req.json();

    console.log('📝 Processing inspection request:', {
      customer_name,
      customer_email,
      car_id,
      client_ip
    });

    // Input validation
    if (!customer_name || !customer_email || !customer_phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(customer_phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Rate limiting check
    const identifier = client_ip || 'unknown';
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        _identifier: identifier,
        _action: 'inspection_request',
        _max_requests: 5,
        _window_minutes: 60
      });

    if (rateLimitError) {
      console.error('❌ Rate limit check error:', rateLimitError);
      // Continue without rate limiting if check fails
    } else if (!rateLimitCheck) {
      console.log('⚠️ Rate limit exceeded for:', identifier);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      customer_name: customer_name.trim().replace(/[<>"'&]/g, ''),
      customer_email: customer_email.trim().toLowerCase().replace(/[<>"'&]/g, ''),
      customer_phone: customer_phone.trim().replace(/[<>"'&]/g, ''),
      car_id: car_id?.trim() || null,
      notes: notes?.trim().replace(/[<>"'&]/g, '') || 'General inspection request'
    };

    // Insert inspection request
    const { data: insertData, error: insertError } = await supabaseClient
      .from('inspection_requests')
      .insert(sanitizedData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw new Error('Failed to save inspection request');
    }

    console.log('✅ Inspection request saved:', insertData.id);

    // Try to send email notification (don't fail if this fails)
    try {
      await supabaseClient.functions.invoke('send-inspection-notification', {
        body: sanitizedData
      });
      console.log('📧 Email notification sent');
    } catch (emailError) {
      console.error('⚠️ Email notification failed:', emailError);
      // Don't fail the whole process
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: insertData.id,
        message: 'Inspection request submitted successfully'
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in secure-inspection-request function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);