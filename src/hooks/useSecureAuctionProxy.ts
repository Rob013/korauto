import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProxyResponse {
  data?: any;
  error?: string;
  success: boolean;
}

export const useSecureAuctionProxy = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callProxy = useCallback(async (
    endpoint: string,
    params?: Record<string, string>,
    options?: {
      carId?: string;
      lotNumber?: string;
    }
  ): Promise<ProxyResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('secure-auction-proxy', {
        body: {
          endpoint,
          params,
          ...options
        }
      });

      if (error) throw error;

      setIsLoading(false);
      return { data, success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API request failed';
      setError(errorMessage);
      setIsLoading(false);
      return { error: errorMessage, success: false };
    }
  }, []);

  return {
    callProxy,
    isLoading,
    error
  };
};
