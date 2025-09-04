import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CarManagementRequest {
  action: 'remove_sold_cars' | 'bulk_delete_cars' | 'process_image_cleanup';
  options?: {
    immediate_removal?: boolean;
    cleanup_related_data?: boolean;
    car_ids?: string[];
    delete_reason?: string;
    batch_size?: number;
  };
}

interface CarManagementResponse {
  success: boolean;
  operation: string;
  result?: any;
  error?: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔧 Enhanced Car Management API called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for POST requests
    let requestData: CarManagementRequest;
    
    if (req.method === 'GET') {
      // For GET requests, parse from URL parameters
      const url = new URL(req.url);
      const action = url.searchParams.get('action') as CarManagementRequest['action'];
      const immediate_removal = url.searchParams.get('immediate_removal') === 'true';
      const cleanup_related_data = url.searchParams.get('cleanup_related_data') !== 'false'; // default true
      const batch_size = parseInt(url.searchParams.get('batch_size') || '100');
      
      if (!action) {
        throw new Error('Action parameter is required');
      }
      
      requestData = {
        action,
        options: {
          immediate_removal,
          cleanup_related_data,
          batch_size
        }
      };
    } else if (req.method === 'POST') {
      requestData = await req.json();
    } else {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { action, options = {} } = requestData;
    
    console.log(`🔧 Processing action: ${action} with options:`, options);

    let result: any;
    
    switch (action) {
      case 'remove_sold_cars':
        console.log('🗑️ Removing sold cars...');
        const { data: removeResult, error: removeError } = await supabase.rpc(
          'enhanced_remove_sold_cars', 
          {
            immediate_removal: options.immediate_removal || false,
            cleanup_related_data: options.cleanup_related_data !== false // default true
          }
        );
        
        if (removeError) {
          throw new Error(`Failed to remove sold cars: ${removeError.message}`);
        }
        
        result = removeResult;
        console.log('✅ Sold cars removal completed:', result);
        break;

      case 'bulk_delete_cars':
        console.log('🗑️ Bulk deleting cars...');
        if (!options.car_ids || !Array.isArray(options.car_ids) || options.car_ids.length === 0) {
          throw new Error('car_ids array is required for bulk delete');
        }
        
        const { data: bulkResult, error: bulkError } = await supabase.rpc(
          'bulk_delete_cars',
          {
            car_ids: options.car_ids,
            delete_reason: options.delete_reason || 'admin_bulk_delete'
          }
        );
        
        if (bulkError) {
          throw new Error(`Failed to bulk delete cars: ${bulkError.message}`);
        }
        
        result = bulkResult;
        console.log('✅ Bulk car deletion completed:', result);
        break;

      case 'process_image_cleanup':
        console.log('🧹 Processing image cleanup queue...');
        const { data: cleanupResult, error: cleanupError } = await supabase.rpc(
          'process_image_cleanup_queue',
          {
            batch_size: options.batch_size || 100
          }
        );
        
        if (cleanupError) {
          throw new Error(`Failed to process image cleanup: ${cleanupError.message}`);
        }
        
        result = cleanupResult;
        console.log('✅ Image cleanup processing completed:', result);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response: CarManagementResponse = {
      success: true,
      operation: action,
      result,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Enhanced Car Management error:', error);
    
    const errorResponse: CarManagementResponse = {
      success: false,
      operation: 'unknown',
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);