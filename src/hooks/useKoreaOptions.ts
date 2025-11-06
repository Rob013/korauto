import { useState, useEffect } from 'react';

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

        console.log('🌐 Fetching Korea options from API');
        const response = await fetch('https://auctionsapi.com/api/korea-options', {
          headers: {
            'x-api-key': 'd00985c77981fe8d26be16735f932ed1',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Convert array to map by code for faster lookups
        const optionsMap: Record<string, KoreaOption> = {};
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((option: KoreaOption) => {
            if (option.code) {
              const normalizedCode = option.code.toString().trim();
              if (normalizedCode) {
                optionsMap[normalizedCode] = option;
              }
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
        setError(err instanceof Error ? err.message : 'Failed to fetch options');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const getOptionName = (code: string): string => {
    if (code === undefined || code === null) return '';
    const normalizedCode = code.toString().trim();
    if (!normalizedCode) return '';

    // Try exact match first
    let option = options[normalizedCode];

    // If not found and code is numeric, try with leading zeros removed
    if (!option && /^\d+$/.test(normalizedCode)) {
      const numericCode = parseInt(normalizedCode, 10).toString();
      option = options[numericCode];
    }

    // If still not found and code doesn't have leading zeros, try adding them
    if (!option && /^\d+$/.test(normalizedCode) && normalizedCode.length < 3) {
      const paddedCode = normalizedCode.padStart(3, '0');
      option = options[paddedCode];
    }

    if (!option) return normalizedCode;

    // Return Albanian translation if available, otherwise English name
    return option.name || option.name_original || normalizedCode;
  };

  const getOptionDescription = (code: string): string => {
    if (code === undefined || code === null) return '';
    const normalizedCode = code.toString().trim();
    if (!normalizedCode) return '';
    const option = options[normalizedCode];
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
