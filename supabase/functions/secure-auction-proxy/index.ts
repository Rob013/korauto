import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AUCTIONS_API_KEY = Deno.env.get('AUCTIONS_API_KEY') || ''
const API_BASE_URL = 'https://auctionsapi.com/api'

interface RequestBody {
  endpoint: string
  params?: Record<string, string>
  carId?: string
  lotNumber?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!AUCTIONS_API_KEY) {
      throw new Error('AUCTIONS_API_KEY not configured')
    }

    const body: RequestBody = await req.json()
    const { endpoint, params = {}, carId, lotNumber } = body

    // Build URL
    let url = `${API_BASE_URL}/${endpoint}`
    
    if (carId) {
      url = `${API_BASE_URL}/${endpoint}/${carId}`
    } else if (lotNumber) {
      url = `${API_BASE_URL}/search-lot/${lotNumber}/iaai`
    }

    // Add query params
    const urlParams = new URLSearchParams(params)
    if (urlParams.toString()) {
      url += `?${urlParams.toString()}`
    }

    console.log(`Proxying request to: ${url}`)

    // Make request to external API
    const response = await fetch(url, {
      headers: {
        'x-api-key': AUCTIONS_API_KEY,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30s timeout
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
