import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { trackApiFailure } from "@/utils/analytics";

type FavoriteRecord = {
  id: string;
  car_id: string;
  user_id: string;
  created_at: string;
  car_make?: string | null;
  car_model?: string | null;
  car_year?: number | null;
  car_price?: number | null;
  car_image?: string | null;
};

type ToggleFavoriteInput = {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  image?: string;
};

interface FavoritesContextValue {
  favorites: FavoriteRecord[];
  favoriteIds: Set<string>;
  loading: boolean;
  error: string | null;
  user: User | null;
  isFavorite: (carId: string) => boolean;
  toggleFavorite: (car: ToggleFavoriteInput) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const cacheKeyForUser = (userId: string) => `favorites-cache-${userId}`;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const isFetchingRef = useRef(false);

  const cacheKey = useMemo(() => (user ? cacheKeyForUser(user.id) : null), [user]);

  const hydrateFromCache = useCallback(() => {
    if (!cacheKey) return null;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { favorites: FavoriteRecord[]; timestamp: number };
      if (!parsed || !Array.isArray(parsed.favorites)) return null;
      if (Date.now() - parsed.timestamp > CACHE_TTL) return null;
      return parsed.favorites;
    } catch {
      return null;
    }
  }, [cacheKey]);

  const persistToCache = useCallback(
    (records: FavoriteRecord[]) => {
      if (!cacheKey) return;
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ favorites: records, timestamp: Date.now() }));
      } catch (cacheError) {
        console.warn("Failed to persist favorites cache", cacheError);
      }
    },
    [cacheKey]
  );

  const applyFavorites = useCallback((records: FavoriteRecord[]) => {
    setFavorites(records);
    setFavoriteIds(new Set(records.map((fav) => fav.car_id)));
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user || isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from<FavoriteRecord>("favorite_cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const records = data ?? [];
      applyFavorites(records);
      persistToCache(records);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
      trackApiFailure("favorites-fetch", err, { userId: user?.id });
      setError(err instanceof Error ? err.message : "Failed to load favorites");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [applyFavorites, persistToCache, user]);

  const initializeFavorites = useCallback(() => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setLoading(false);
      setError(null);
      return;
    }

    const cached = hydrateFromCache();
    if (cached) {
      applyFavorites(cached);
      setLoading(false);
      return;
    }

    fetchFavorites();
  }, [applyFavorites, fetchFavorites, hydrateFromCache, user]);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        if (!cancelled) {
          setUser(null);
        }
      }
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    initializeFavorites();
  }, [initializeFavorites]);

  const isFavorite = useCallback(
    (carId: string) => {
      return favoriteIds.has(carId);
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async ({ id, make, model, year, price, image }: ToggleFavoriteInput) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      const currentlyFavorite = favoriteIds.has(id);

      try {
        if (currentlyFavorite) {
          const { error: deleteError } = await supabase
            .from("favorite_cars")
            .delete()
            .eq("user_id", user.id)
            .eq("car_id", id);

          if (deleteError) {
            throw deleteError;
          }

          const updated = favorites.filter((fav) => fav.car_id !== id);
          applyFavorites(updated);
          persistToCache(updated);
        } else {
          const { error: insertError } = await supabase.from("favorite_cars").insert({
            user_id: user.id,
            car_id: id,
            car_make: make ?? null,
            car_model: model ?? null,
            car_year: year ?? null,
            car_price: price ?? null,
            car_image: image ?? null,
          });

          if (insertError) {
            throw insertError;
          }

          const recordId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now()}-${id}`;
          const newRecord: FavoriteRecord = {
            id: recordId,
            car_id: id,
            user_id: user.id,
            created_at: new Date().toISOString(),
            car_make: make ?? null,
            car_model: model ?? null,
            car_year: year ?? null,
            car_price: price ?? null,
            car_image: image ?? null,
          };

          const updated = [newRecord, ...favorites];
          applyFavorites(updated);
          persistToCache(updated);
        }
      } catch (err) {
        console.error("Failed to toggle favorite:", err);
        trackApiFailure("favorites-toggle", err, { carId: id, userId: user.id });
        throw err;
      }
    },
    [applyFavorites, favoriteIds, favorites, persistToCache, user]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoriteIds,
      loading,
      error,
      user,
      isFavorite,
      toggleFavorite,
      refreshFavorites: fetchFavorites,
    }),
    [favorites, favoriteIds, loading, error, user, isFavorite, toggleFavorite, fetchFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextValue => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
