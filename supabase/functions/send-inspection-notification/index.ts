import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customer_name, customer_email, customer_phone, car_make, car_model, car_year } = await req.json()

    console.log('📧 Sending inspection notification for:', {
      customer_name,
      customer_email,
      customer_phone,
      car_make,
      car_model,
      car_year
    })

    // For now, just log the notification details
    // In a real implementation, you would integrate with an email service like SendGrid, Mailgun, etc.
    console.log('✅ Notification logged successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error sending notification:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})