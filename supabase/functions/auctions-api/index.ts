import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://api.auctionsapi.com';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2;
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Request validation schemas
const ScrollRequestSchema = z.object({
  action: z.enum(['start', 'continue', 'end']),
  scroll_id: z.string().optional(),
  scroll_time: z.number().min(1).max(15).optional(),
  limit: z.number().min(1).max(2000).optional(),
});

const BrandsRequestSchema = z.object({
  action: z.literal('brands'),
});

const ModelsRequestSchema = z.object({
  action: z.literal('models'),
  brand_id: z.number().positive(),
});

// Helper function to make API requests with rate limiting and retry logic
async function makeApiRequest(url: string, retryCount = 0): Promise<any> {
  console.log(`📡 Auctions API Request: ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = RATE_LIMIT_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount);
        console.log(`⏰ Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return makeApiRequest(url, retryCount + 1);
      }
      throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      
      // Handle specific error codes
      switch (response.status) {
        case 403:
          if (errorText.includes('api_key')) {
            throw new Error('Invalid or missing API key');
          } else if (errorText.includes('subscription')) {
            throw new Error('API subscription is not active');
          } else if (errorText.includes('whitelist')) {
            throw new Error('IP address not allowed');
          } else if (errorText.includes('data')) {
            throw new Error('No data available in subscription');
          }
          break;
        case 400:
          if (errorText.includes('scroll_time')) {
            throw new Error('Scroll time must be less than 15 minutes');
          } else if (errorText.includes('limit')) {
            throw new Error('Limit must be less than 2000');
          }
          break;
      }
      
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Response received successfully`);
    return data;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    if (retryCount < MAX_RETRIES) {
      const waitTime = RATE_LIMIT_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount);
      console.log(`🔄 Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeApiRequest(url, retryCount + 1);
    }
    
    throw error;
  }
}

// Helper function to build cars API URL
function buildCarsUrl(params: any): string {
  const urlParams = new URLSearchParams({
    api_key: params.api_key
  });
  
  if (params.scroll_id) {
    urlParams.append('scroll_id', params.scroll_id);
  } else {
    // Starting a new scroll session
    if (params.scroll_time) {
      urlParams.append('scroll_time', params.scroll_time.toString());
    }
    if (params.limit) {
      urlParams.append('limit', params.limit.toString());
    }
  }
  
  return `${API_BASE_URL}/cars?${urlParams}`;
}

// Helper function to build brands API URL
function buildBrandsUrl(apiKey: string): string {
  const urlParams = new URLSearchParams({
    api_key: apiKey
  });
  
  return `${API_BASE_URL}/brands?${urlParams}`;
}

// Helper function to build models API URL
function buildModelsUrl(brandId: number, apiKey: string): string {
  const urlParams = new URLSearchParams({
    api_key: apiKey
  });
  
  return `${API_BASE_URL}/models/${brandId}?${urlParams}`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔐 Auctions API called:', req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
  
  try {
    const apiKey = Deno.env.get('AUCTIONS_API_KEY');
    if (!apiKey) {
      console.error('❌ AUCTIONS_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const body = await req.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    // Validate request based on action
    let validatedData;
    let url: string;
    
    if (body.action === 'start' || body.action === 'continue') {
      validatedData = ScrollRequestSchema.parse(body);
      url = buildCarsUrl({ ...validatedData, api_key: apiKey });
    } else if (body.action === 'brands') {
      validatedData = BrandsRequestSchema.parse(body);
      url = buildBrandsUrl(apiKey);
    } else if (body.action === 'models') {
      validatedData = ModelsRequestSchema.parse(body);
      url = buildModelsUrl(validatedData.brand_id, apiKey);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be start, continue, brands, or models' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    console.log('🌐 Making API request to:', url);
    
    // Make the API request
    const data = await makeApiRequest(url);
    
    console.log('✅ API response received successfully');
    
    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        action: body.action,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('❌ Error in Auctions API function:', error);
    
    let errorMessage = 'An unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof z.ZodError) {
      errorMessage = `Validation error: ${error.errors.map(e => e.message).join(', ')}`;
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('API key')) {
        statusCode = 403;
      } else if (error.message.includes('timeout')) {
        statusCode = 408;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode, 
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        } 
      }
    );
  }
};

serve(handler);
