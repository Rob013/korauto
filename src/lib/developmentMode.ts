/**
 * Development Mode Configuration
 * 
 * This module determines whether the app should run in development mode
 * (using sample car data) or production mode (using live Supabase data).
 */

export const isDevelopmentMode = (): boolean => {
  // Check if Supabase environment variables are configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // If either environment variable is missing or empty, use development mode
  const hasSupabaseConfig = !!(supabaseUrl && supabaseKey && 
    supabaseUrl.trim() !== '' && supabaseKey.trim() !== '');
  
  return !hasSupabaseConfig;
};

export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
};

// Development mode hardcoded credentials (fallback)
export const DEVELOPMENT_SUPABASE_CONFIG = {
  url: "https://qtyyiqimkysmjnaocswe.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"
};