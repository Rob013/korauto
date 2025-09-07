import { useState, useEffect, useCallback } from "react";

interface ExchangeRate {
  rate: number;
  lastUpdated: string;
  source?: string;
}

interface CurrencyAPIResponse {
  data: {
    EUR: number;
  };
}

interface ExchangeRateAPIResponse {
  base: string;
  date: string;
  rates: {
    EUR: number;
  };
  provider: string;
}

const CACHE_KEY = "currency_cache_usd_eur";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for real-time updates

export const useCurrencyAPI = () => {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({
    rate: 0.85, // Default fallback rate USD to EUR (updated to current market rate)
    lastUpdated: new Date().toISOString(),
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
      console.error("Error reading currency cache:", error);
      return null;
    }
  };

  const setCachedRate = (rate: ExchangeRate) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rate));
    } catch (error) {
      console.error("Error caching currency rate:", error);
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

      // Try to fetch current rate from daily sync file
      try {
        const currentRateResponse = await fetch('/current-exchange-rate.json');
        if (currentRateResponse.ok) {
          const dailyRate = await currentRateResponse.json();
          if (dailyRate && dailyRate.rate && dailyRate.lastUpdated) {
            console.log('📊 Using daily synced exchange rate:', dailyRate.rate);
            const syncedRate: ExchangeRate = {
              rate: dailyRate.rate,
              lastUpdated: dailyRate.lastUpdated,
              source: dailyRate.source || 'daily-sync',
            };
            setExchangeRate(syncedRate);
            setCachedRate(syncedRate);
            setLoading(false);
            return;
          }
        }
      } catch (dailyRateError) {
        console.log('ℹ️ Daily rate file not available, fetching from real-time API');
      }

      // Fetch from Google-sourced real-time API (exchangerate-api.com)
      try {
        console.log('🌐 Fetching real-time exchange rate from Google-sourced API');
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");

        if (!response.ok) {
          throw new Error(`Google-sourced API Error: ${response.status}`);
        }

        const data: ExchangeRateAPIResponse = await response.json();

        if (!data.rates?.EUR) {
          throw new Error("Invalid Google-sourced API response format");
        }

        const newRate: ExchangeRate = {
          rate: data.rates.EUR,
          lastUpdated: new Date().toISOString(),
          source: 'google-sourced-realtime',
        };

        console.log('✅ Successfully fetched real-time rate from Google-sourced API:', newRate.rate);
        setExchangeRate(newRate);
        setCachedRate(newRate);
        return;
      } catch (googleSourcedError) {
        console.log('⚠️ Google-sourced API failed, trying fallback:', googleSourcedError);
      }

      // Fallback to currencyapi.com
      const response = await fetch(
        "https://api.currencyapi.com/v3/latest?apikey=cur_live_SqgABFxnWHPaJjbRVJQdOLJpYkgCiJgQkIdvVFN6&currencies=EUR&base_currency=USD"
      );

      if (!response.ok) {
        throw new Error(`Fallback API Error: ${response.status}`);
      }

      const data: CurrencyAPIResponse = await response.json();

      if (!data.data?.EUR) {
        throw new Error("Invalid fallback API response format");
      }

      const newRate: ExchangeRate = {
        rate: data.data.EUR,
        lastUpdated: new Date().toISOString(),
        source: 'fallback-currencyapi',
      };

      console.log('✅ Using fallback exchange rate:', newRate.rate);
      setExchangeRate(newRate);
      setCachedRate(newRate);
    } catch (err) {
      console.error("Failed to fetch exchange rate:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch exchange rate"
      );

      // Try to use cache even if expired as fallback
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached) {
        setExchangeRate(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const convertUSDtoEUR = useCallback(
    (usdAmount: number): number => {
      return Math.round(usdAmount * exchangeRate.rate);
    },
    [exchangeRate.rate]
  );

  // Convert Korean won to EUR (approximate rate: 1 EUR = 1400 KRW)
  const convertKRWtoEUR = useCallback(
    (krwAmount: number): number => {
      const KRW_TO_EUR_RATE = 0.00071; // 1 KRW = 0.00071 EUR (approximate)
      return Math.round(krwAmount * KRW_TO_EUR_RATE);
    },
    []
  );

  // Process flood damage text to replace Korean won with EUR
  const processFloodDamageText = useCallback(
    (text: string): string => {
      if (!text) return text;
      
      // Look for Korean won patterns like "1,528,909 won" or "1528909 won"
      const wonPattern = /(\d{1,3}(?:,\d{3})*|\d+)\s*won/gi;
      
      return text.replace(wonPattern, (match, amount) => {
        // Remove commas and convert to number
        const krwAmount = parseInt(amount.replace(/,/g, ''));
        const eurAmount = convertKRWtoEUR(krwAmount);
        return `€${eurAmount.toLocaleString()}`;
      });
    },
    [convertKRWtoEUR]
  );

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  return {
    exchangeRate,
    loading,
    error,
    convertUSDtoEUR,
    convertKRWtoEUR,
    processFloodDamageText,
    refreshRate: fetchExchangeRate,
    forceRefresh: () => {
      // Clear cache and fetch fresh rate
      localStorage.removeItem(CACHE_KEY);
      fetchExchangeRate();
    },
  };
};
