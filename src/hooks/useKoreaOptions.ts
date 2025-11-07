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

        const registerOption = (option: KoreaOption) => {
          if (!option || option.code === undefined || option.code === null) {
            return;
          }

          const rawCode = option.code.toString().trim();
          if (!rawCode) {
            return;
          }

          const variations = new Set<string>([rawCode, rawCode.toUpperCase()]);

          if (/^\d+$/.test(rawCode)) {
            const numeric = Number.parseInt(rawCode, 10).toString();
            variations.add(numeric);
            variations.add(numeric.padStart(3, '0'));
            variations.add(rawCode.padStart(3, '0'));
          }

          variations.forEach((variant) => {
            if (variant) {
              optionsMap[variant] = option;
            }
          });
        };

        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((option: KoreaOption) => {
            registerOption(option);
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

  const resolveOption = (code: string): KoreaOption | undefined => {
    if (code === undefined || code === null) {
      return undefined;
    }

    const raw = code.toString().trim();
    if (!raw) {
      return undefined;
    }

    const candidates = new Set<string>([raw, raw.toUpperCase()]);

    if (/^\d+$/.test(raw)) {
      const numeric = Number.parseInt(raw, 10).toString();
      candidates.add(numeric);
      candidates.add(numeric.padStart(3, '0'));
      candidates.add(raw.padStart(3, '0'));
    }

    for (const candidate of candidates) {
      const option = options[candidate];
      if (option) {
        return option;
      }
    }

    return undefined;
  };

  const getOptionName = (code: string): string => {
    const option = resolveOption(code);
    if (!option) {
      return code;
    }

    return option.name || option.name_original || code;
  };

  const getOptionDescription = (code: string): string => {
    const option = resolveOption(code);
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
