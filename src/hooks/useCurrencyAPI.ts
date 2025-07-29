import { useState, useEffect } from 'react';

interface ExchangeRate {
  rate: number;
  lastUpdated: string;
}

interface CurrencyAPIResponse {
  data: {
    EUR: number;
  };
}

const CACHE_KEY = 'currency_cache_usd_eur';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useCurrencyAPI = () => {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({
    rate: 0.92, // Default fallback rate USD to EUR
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedRate = (): ExchangeRate | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = Date.now();
      const cacheTime = new Date(data.lastUpdated).getTime();
      
      // Check if cache is still valid (within 24 hours)
      if (now - cacheTime < CACHE_DURATION) {
        return data;
      }
      
      // Cache expired
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error reading currency cache:', error);
      return null;
    }
  };

  const setCachedRate = (rate: ExchangeRate) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rate));
    } catch (error) {
      console.error('Error caching currency rate:', error);
    }
  };

  const fetchExchangeRate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = getCachedRate();
      if (cached) {
        setExchangeRate(cached);
        setLoading(false);
        return;
      }

      // Fetch from API
      const response = await fetch('https://api.currencyapi.com/v3/latest?apikey=cur_live_SqgABFxnWHPaJjbRVJQdOLJpYkgCiJgQkIdvVFN6&currencies=EUR&base_currency=USD');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: CurrencyAPIResponse = await response.json();
      
      if (!data.data?.EUR) {
        throw new Error('Invalid API response format');
      }

      const newRate: ExchangeRate = {
        rate: data.data.EUR,
        lastUpdated: new Date().toISOString()
      };

      setExchangeRate(newRate);
      setCachedRate(newRate);
      
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rate');
      
      // Try to use cache even if expired as fallback
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached) {
        setExchangeRate(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const convertUSDtoEUR = (usdAmount: number): number => {
    return Math.round(usdAmount * exchangeRate.rate);
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  return {
    exchangeRate,
    loading,
    error,
    convertUSDtoEUR,
    refreshRate: fetchExchangeRate
  };
};