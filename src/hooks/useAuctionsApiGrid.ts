//@ts-nocheck
import { useCallback, useRef, useState } from "react";

// Lightweight client hook to fetch grid cars from AuctionsAPI and normalize them
// NOTE: This uses the public query param API key variant as provided.
// If CORS blocks in some environments, consider proxying through a server.
export const useAuctionsApiGrid = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollingRef = useRef(false);

  const fetchWithCors = async (url: string, asText: boolean = false) => {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return asText ? res.text() : res.json();
    } catch (e) {
      // Fallback via corsproxy
      const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res = await fetch(proxied, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return asText ? res.text() : res.json();
    }
  };

  const pickTitle = (titles: any): string | null => {
    if (!titles || typeof titles !== 'object') return null;
    const order = ['en', 'ru', 'ro', 'ko', 'uk'];
    for (const k of order) if (titles[k]) return titles[k];
    const any = Object.values(titles).find(Boolean) as string | undefined;
    return any || null;
  };

  const normalizeCar = (raw: any): any => {
    // Choose an active/non-archived listing
    const listing = raw.listings?.find((l: any) => !l.archived) || raw.listings?.[0] || {};
    const preview = listing?.images?.[0]?.preview || '';
    const odometer = typeof listing?.odometer === 'number' ? listing.odometer : undefined;
    const priceAmount = typeof listing?.price?.price === 'number' ? listing.price.price : undefined;
    const title = pickTitle(listing?.title) || [raw.year, raw.badge].filter(Boolean).join(' ').trim();

    // Map to the "FlexibleCar" shape used by the catalog
    // We set lot.buy_now to the listing price when available to pass existing filters
    return {
      id: raw.id || raw._id || `${raw.year || ''}-${title || Math.random()}`,
      title: title || '',
      year: raw.year || undefined,
      manufacturer: raw.brand ? { name: raw.brand } : undefined,
      model: raw.model ? { name: raw.model } : undefined,
      engine: raw.engine ? { name: raw.engine } : undefined,
      color: raw.color ? { name: raw.color } : undefined,
      transmission: raw.transmission ? { name: raw.transmission } : undefined,
      lot_number: raw.lot_number || undefined,
      lots: [
        {
          buy_now: priceAmount, // leverage existing price pipeline
          images: {
            normal: preview ? [preview] : [],
            big: []
          },
          odometer: odometer != null ? { km: odometer } : undefined,
          status: 1,
          sale_status: 'active',
          details: {
            engine_volume: raw.engine_volume,
            badge: raw.badge
          }
        }
      ],
      source_api: 'auctions_api_grid',
      domain_name: raw.domain_name || 'auctionsapi_com'
    };
  };

  const fetchGrid = useCallback(async (maxPages: number = 3, limit: number = 100) => {
    if (scrollingRef.current) return;
    scrollingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const apiKey = 'd00985c77981fe8d26be16735f932ed1';
      let nextUrl = `https://api.auctionsapi.com/cars?api_key=${apiKey}&limit=${limit}&scroll_time=10`;
      const pages: any[] = [];
      for (let i = 0; i < Math.max(1, maxPages); i++) {
        if (!nextUrl) break;
        const payload = await fetchWithCors(nextUrl, false);
        const rawItems = Array.isArray(payload) ? payload : (payload.data || []);
        pages.push(rawItems);
        nextUrl = payload?.next_url || null;
        if (!nextUrl) break;
      }
      const flat = pages.flat();
      const normalized = flat.map(normalizeCar);
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = normalized.filter((c) => {
        const key = String(c.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCars(unique);
      return unique;
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch AuctionsAPI grid');
      return [];
    } finally {
      setIsLoading(false);
      scrollingRef.current = false;
    }
  }, []);

  const resolveStartApiUrl = async (input: string, limit: number): Promise<string | null> => {
    if (!input) return null;
    // If already an API endpoint, use it
    if (input.includes('/cars?')) {
      return input;
    }
    // Otherwise assume it's the example HTML page; parse out the target URL
    try {
      const html = await fetchWithCors(input, true) as string;
      const match = html.match(/const\s+target\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        const url = new URL(match[1]);
        // Ensure limit is respected/overridden
        url.searchParams.set('limit', String(limit));
        return url.toString();
      }
      // Fallback: search for an API URL pattern in HTML
      const m2 = html.match(/https:\/\/api\.auctionsapi\.com\/cars\?[^"']+/);
      if (m2 && m2[0]) return m2[0];
    } catch (e) {
      // ignore
    }
    return null;
  };

  const fetchFromLink = useCallback(async (link: string, maxPages: number = 5, limit: number = 100) => {
    if (scrollingRef.current) return;
    scrollingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      let nextUrl = await resolveStartApiUrl(link, limit);
      if (!nextUrl) throw new Error('Could not resolve API URL from link');
      const pages: any[] = [];
      for (let i = 0; i < Math.max(1, maxPages); i++) {
        if (!nextUrl) break;
        const payload = await fetchWithCors(nextUrl, false);
        const rawItems = Array.isArray(payload) ? payload : (payload.data || []);
        pages.push(rawItems);
        nextUrl = payload?.next_url || null;
        if (!nextUrl) break;
      }
      const flat = pages.flat();
      const normalized = flat.map(normalizeCar);
      const seen = new Set<string>();
      const unique = normalized.filter((c) => {
        const key = String(c.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCars(unique);
      return unique;
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch AuctionsAPI grid from link');
      return [];
    } finally {
      setIsLoading(false);
      scrollingRef.current = false;
    }
  }, []);

  return { cars, isLoading, error, fetchGrid, fetchFromLink } as const;
};

export default useAuctionsApiGrid;


