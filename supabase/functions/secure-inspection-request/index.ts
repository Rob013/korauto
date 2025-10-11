import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple validation schemas
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s\-\(\)]{8,20}$/;

interface InspectionRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  car_id?: string;
  notes?: string;
  client_ip?: string;
}

// Validate and sanitize input
function validateInspectionRequest(data: any): { valid: boolean; errors?: string[]; sanitized?: InspectionRequest } {
  const errors: string[] = [];
  
  // Validate required fields
  if (!data.customer_name || typeof data.customer_name !== 'string' || data.customer_name.trim().length === 0) {
    errors.push('Customer name is required');
  } else if (data.customer_name.length > 100) {
    errors.push('Customer name must be less than 100 characters');
  }
  
  if (!data.customer_email || typeof data.customer_email !== 'string' || !emailRegex.test(data.customer_email.trim())) {
    errors.push('Valid email address is required');
  } else if (data.customer_email.length > 255) {
    errors.push('Email must be less than 255 characters');
  }
  
  if (!data.customer_phone || typeof data.customer_phone !== 'string' || !phoneRegex.test(data.customer_phone.trim())) {
    errors.push('Valid phone number is required (8-20 digits)');
  }
  
  if (data.notes && typeof data.notes === 'string' && data.notes.length > 1000) {
    errors.push('Notes must be less than 1000 characters');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Sanitize - allowlist approach: only keep alphanumeric, spaces, and common punctuation
  const sanitize = (str: string, maxLength: number) => {
    return str.trim()
      .replace(/[^\w\s\-.,@()+]/g, '') // Allow only word chars, spaces, and safe punctuation
      .slice(0, maxLength);
  };
  
  return {
    valid: true,
    sanitized: {
      customer_name: sanitize(data.customer_name, 100),
      customer_email: data.customer_email.trim().toLowerCase().slice(0, 255),
      customer_phone: sanitize(data.customer_phone, 20),
      car_id: data.car_id ? sanitize(data.car_id, 50) : undefined,
      notes: data.notes ? sanitize(data.notes, 1000) : 'General inspection request',
      client_ip: data.client_ip
    }
  };
}

// Hash IP address for privacy (SHA-256)
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')); // Use secret as salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔐 Secure Inspection Request called:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    
    // Validate and sanitize input
    const validation = validateInspectionRequest(requestData);
    
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    const sanitizedData = validation.sanitized!;

    console.log('📝 Processing inspection request for:', sanitizedData.customer_email);

    // Hash IP address for privacy
    const ipHash = sanitizedData.client_ip ? await hashIP(sanitizedData.client_ip) : 'unknown';

    // Rate limiting check using hashed IP
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        _identifier: ipHash,
        _action: 'inspection_request',
        _max_requests: 5,
        _window_minutes: 60
      });

    if (rateLimitError) {
      console.error('❌ Rate limit check error:', rateLimitError);
    } else if (!rateLimitCheck) {
      console.log('⚠️ Rate limit exceeded for IP hash:', ipHash.slice(0, 10));
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Insert inspection request (without storing IP)
    const { data: insertData, error: insertError } = await supabaseClient
      .from('inspection_requests')
      .insert({
        customer_name: sanitizedData.customer_name,
        customer_email: sanitizedData.customer_email,
        customer_phone: sanitizedData.customer_phone,
        car_id: sanitizedData.car_id,
        notes: sanitizedData.notes,
        ip_address: null // Don't store raw IP - use hashed version for rate limiting only
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw new Error('Failed to save inspection request');
    }

    console.log('✅ Inspection request saved:', insertData.id);

    // Try to send email notification
    try {
      await supabaseClient.functions.invoke('send-inspection-notification', {
        body: {
          customer_name: sanitizedData.customer_name,
          customer_email: sanitizedData.customer_email,
          customer_phone: sanitizedData.customer_phone,
          car_id: sanitizedData.car_id,
          notes: sanitizedData.notes
        }
      });
      console.log('📧 Email notification sent');
    } catch (emailError) {
      console.error('⚠️ Email notification failed:', emailError);
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
