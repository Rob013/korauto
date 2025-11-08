import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackApiFailure } from '@/utils/analytics';

interface KoreaOption {
  id: number;
  code: string;
  name: string;
  name_original: string;
  sort: number;
  section: string;
  section_name: string;
  description?: string;
  location?: string;
  image?: string;
}

interface UseKoreaOptionsReturn {
  options: Record<string, KoreaOption>;
  loading: boolean;
  error: string | null;
  getOptionName: (code: string) => string;
  getOptionDescription: (code: string) => string;
}

const CACHE_KEY = 'korea_options_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useKoreaOptions = (): UseKoreaOptionsReturn => {
  const [options, setOptions] = useState<Record<string, KoreaOption>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          
          if (now - timestamp < CACHE_DURATION) {
            console.log('📦 Using cached Korea options');
            setOptions(data);
            setLoading(false);
            return;
          }
        }

          console.log('🌐 Fetching Korea options from secure edge function');
          const { data, error: edgeError } = await supabase.functions.invoke('secure-cars-api', {
            body: {
              endpoint: 'korea-options'
            }
          });

          if (edgeError) {
            throw new Error(edgeError.message || 'Failed to fetch Korea options');
          }

          if (data?.error) {
            throw new Error(data.error);
          }

          const payload = data?.data ?? data;
        
        // Convert array to map by code for faster lookups
        const optionsMap: Record<string, KoreaOption> = {};
          if (payload && Array.isArray(payload)) {
            payload.forEach((option: KoreaOption) => {
            if (option.code) {
              optionsMap[option.code] = option;
            }
          });
        }

        // Cache the result
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: optionsMap,
          timestamp: Date.now()
        }));

        console.log('✅ Fetched and cached Korea options:', Object.keys(optionsMap).length);
        setOptions(optionsMap);
      } catch (err) {
        console.error('Failed to fetch Korea options:', err);
          trackApiFailure('korea-options', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch options');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const getOptionName = (code: string): string => {
    if (!code) return code;
    
    // Try exact match first
    let option = options[code];
    
    // If not found and code is numeric, try with leading zeros removed
    if (!option && /^\d+$/.test(code)) {
      const numericCode = parseInt(code, 10).toString();
      option = options[numericCode];
    }
    
    // If still not found and code doesn't have leading zeros, try adding them
    if (!option && /^\d+$/.test(code) && code.length < 3) {
      const paddedCode = code.padStart(3, '0');
      option = options[paddedCode];
    }
    
    if (!option) return code;
    
    // Return Albanian translation if available, otherwise English name
    return option.name || option.name_original || code;
  };

  const getOptionDescription = (code: string): string => {
    if (!code) return '';
    const option = options[code];
    return option?.description || '';
  };

  return {
    options,
    loading,
    error,
    getOptionName,
    getOptionDescription,
  };
};
