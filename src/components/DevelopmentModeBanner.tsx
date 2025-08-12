import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isDevelopmentMode } from '@/integrations/supabase/client';

/**
 * Development Mode Banner
 * 
 * Shows a banner when the app is running in development mode
 * (using sample car data instead of live Supabase data)
 */
export const DevelopmentModeBanner = () => {
  if (!isDevelopmentMode()) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Development Mode:</strong> Using sample car data for development. 
        To use live data, configure <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
        <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> environment variables.
      </AlertDescription>
    </Alert>
  );
};