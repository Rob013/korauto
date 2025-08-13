// This file configures the Supabase client with project constants (no VITE_* envs)
import { createClient } from '@supabase/supabase-js';
// Note: Database types are not used here to avoid TS issues in preview builds
import { isDevelopmentMode, getSupabaseConfig, DEVELOPMENT_SUPABASE_CONFIG } from '@/lib/developmentMode';

// Always resolve a working config (fallback to development constants)
const resolvedConfig = (() => {
  const cfg = getSupabaseConfig();
  if (!cfg?.url || !cfg?.anonKey) return DEVELOPMENT_SUPABASE_CONFIG;
  return cfg;
})();

// Log the current mode for debugging
if (isDevelopmentMode()) {
  console.log('🔧 Running in development mode with sample car data');
} else {
  console.log('🚀 Running in production mode with live Supabase data');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(resolvedConfig.url, resolvedConfig.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export development mode status for use in components
export { isDevelopmentMode };