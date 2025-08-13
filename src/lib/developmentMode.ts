/**
 * Development Mode Configuration
 * 
 * This module determines whether the app should run in development mode
 * (using sample car data) or production mode (using live Supabase data).
 */

export const isDevelopmentMode = (): boolean => {
  // Lovable does not support VITE_* env vars; always use live Supabase config
  return false;
};

export const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || DEVELOPMENT_SUPABASE_CONFIG.url;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEVELOPMENT_SUPABASE_CONFIG.anonKey;
  return { url, anonKey };
};

// Development mode hardcoded credentials (fallback)
export const DEVELOPMENT_SUPABASE_CONFIG = {
  url: "https://qtyyiqimkysmjnaocswe.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8"
};