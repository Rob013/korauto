import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const inspectionRequestSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  customer_email: z.string().trim().email("Invalid email format").max(255, "Email too long"),
  customer_phone: z.string().trim().regex(/^\+?[\d\s\-\(\)]{8,15}$/, "Invalid phone format"),
  car_id: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(1000, "Notes too long").optional().nullable(),
  client_ip: z.string().optional().nullable()
});

// Hash IP address for privacy (SHA-256)
async function hashIP(ip: string): Promise<string> {
  const salt = Deno.env.get('IP_HASH_SALT') || 'korauto-security-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    const requestBody = await req.json();

    console.log('📝 Processing inspection request');

    // Validate input with zod
    const validationResult = inspectionRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      console.error('❌ Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.issues.map(i => i.message).join(', ')
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const { customer_name, customer_email, customer_phone, car_id, notes, client_ip } = validationResult.data;

    // Hash IP address for privacy before rate limiting
    const hashedIP = client_ip ? await hashIP(client_ip) : 'unknown';
    
    // Rate limiting check using hashed IP
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        _identifier: hashedIP,
        _action: 'inspection_request',
        _max_requests: 5,
        _window_minutes: 60
      });

    if (rateLimitError) {
      console.error('❌ Rate limit check error:', rateLimitError);
    } else if (!rateLimitCheck) {
      console.log('⚠️ Rate limit exceeded for hashed IP');
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Prepare data (already validated by zod)
    const sanitizedData = {
      customer_name,
      customer_email: customer_email.toLowerCase(),
      customer_phone,
      car_id: car_id || null,
      notes: notes || 'General inspection request',
      ip_address: hashedIP // Store hashed IP instead of plaintext
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