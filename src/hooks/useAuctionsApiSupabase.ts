import { useCallback, useRef, useState } from "react";

// Minimal hook to satisfy UnifiedCatalog import and prevent blank page
export const useAuctionsApiSupabase = ({ autoStart = false }: { autoStart?: boolean } = {}) => {
  const [cars, setCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const startScroll = useCallback(async (pages: number = 1, pageSize: number = 200) => {
    if (startedRef.current) return;
    startedRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Integrate real endpoint here; keep empty to avoid runtime errors
      setCars([]);
    } catch (e: any) {
      setError(e?.message || "Failed to load auctions data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (autoStart && !startedRef.current) {
    startScroll().catch(() => {});
  }

  return { cars, isLoading, error, startScroll } as const;
};

export default useAuctionsApiSupabase;
