// This file configures the Supabase client with environment variable support
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { isDevelopmentMode, getSupabaseConfig, DEVELOPMENT_SUPABASE_CONFIG } from '@/lib/developmentMode';

// Get configuration based on environment variables or use development defaults
const config = isDevelopmentMode() ? DEVELOPMENT_SUPABASE_CONFIG : getSupabaseConfig();

// Log the current mode for debugging
if (isDevelopmentMode()) {
  console.log('🔧 Running in development mode with sample car data');
} else {
  console.log('🚀 Running in production mode with live Supabase data');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export development mode status for use in components
export { isDevelopmentMode };