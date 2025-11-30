import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Gauge, Settings, Fuel, Heart, ShieldCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getStatusBadgeConfig } from "@/utils/statusBadgeUtils";
import { formatModelName } from "@/utils/modelNameFormatter";
import { openCarDetailsInNewTab } from "@/utils/navigation";
import { localizeFuel } from "@/utils/fuel";
import { cn } from "@/lib/utils";

interface LazyCarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  images?: string[]; // New prop for multiple images
  vin?: string;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  status?: number;
  sale_status?: string;
  final_price?: number;
  insurance_v2?: {
    accidentCnt?: number;
  };
  details?: {
    seats_count?: number;
  };
  source?: string;
  // Archive information for sold cars
  is_archived?: boolean;
  archived_at?: string;
  archive_reason?: string;
  viewMode?: 'grid' | 'list';
}

type UserFavoritesState = {
  user: User | null;
  favorites: Set<string>;
};

let cachedUserFavorites: UserFavoritesState | null = null;
let inflightUserFavoritesPromise: Promise<UserFavoritesState> | null = null;

type FavoritesListener = (state: UserFavoritesState) => void;
const favoriteListeners = new Set<FavoritesListener>();

const notifyFavoritesListeners = (state: UserFavoritesState) => {
  favoriteListeners.forEach((listener) =>
    listener({
      user: state.user,
      favorites: new Set(state.favorites),
    })
  );
};

const subscribeToFavorites = (listener: FavoritesListener) => {
  favoriteListeners.add(listener);
  if (cachedUserFavorites) {
    listener({
      user: cachedUserFavorites.user,
      favorites: new Set(cachedUserFavorites.favorites),
    });
  }
  return () => {
    favoriteListeners.delete(listener);
  };
};

const ensureUserFavorites = async (): Promise<UserFavoritesState> => {
  if (cachedUserFavorites) {
    return cachedUserFavorites;
  }

  if (!inflightUserFavoritesPromise) {
    inflightUserFavoritesPromise = supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) {
          const state: UserFavoritesState = { user: null, favorites: new Set() };
          cachedUserFavorites = state;
          return state;
        }

        const { data, error } = await supabase
          .from("favorite_cars")
          .select("car_id")
          .eq("user_id", user.id);

        const favorites = new Set<string>(
          error || !Array.isArray(data)
            ? []
            : data.map((row: any) => String(row.car_id))
        );

        const state: UserFavoritesState = { user, favorites };
        cachedUserFavorites = state;
        return state;
      })
      .catch(() => {
        const state: UserFavoritesState = { user: null, favorites: new Set() };
        cachedUserFavorites = state;
        return state;
      })
      .finally(() => {
        inflightUserFavoritesPromise = null;
      });
  }

  const result = await inflightUserFavoritesPromise!;
  notifyFavoritesListeners(result);
  return result;
};

const LazyCarCard = memo(({
  id,
  make,
  model,
  year,
  price,
  image,
  images, // New prop
  vin,
  mileage,
  transmission,
  fuel,
  color,
  condition,
  lot,
  title,
  status,
  sale_status,
  final_price,
  insurance_v2,
  details,
  is_archived,
  archived_at,
  archive_reason,
  source,
  viewMode = "grid",
}: LazyCarCardProps) => {
  const navigate = useNavigate();
  const { setCompletePageState } = useNavigation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(
    () => cachedUserFavorites?.favorites.has(String(id)) ?? false
  );
  const [user, setUser] = useState<User | null>(
    cachedUserFavorites?.user ?? null
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Simplified logic: trust the database filtering, only hide in clear edge cases
  const shouldHideSoldCar = () => {
    // Only hide if it's definitively a sold car that's clearly old
    if (is_archived && archived_at && archive_reason === 'sold') {
      try {
        const archivedTime = new Date(archived_at);

        // Check if date is valid
        if (isNaN(archivedTime.getTime())) {
          return true; // Hide cars with invalid dates as safety measure
        }

        const now = new Date();
        const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);

        // Only hide if clearly over 24 hours (with small buffer for timing differences)
        return hoursSinceArchived > 24.5; // 30-minute buffer to account for timing differences
      } catch (error) {
        // In case of any error, hide the car as a safety measure
        return true;
      }
    }

    // Default: show the car (trust database filtering)
    return false;
  };

  const hideSoldCar = shouldHideSoldCar();

  const persistCarPrefetch = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKeySource = lot ?? id;
    if (storageKeySource === undefined || storageKeySource === null) {
      return;
    }

    try {
      const storageKey = String(storageKeySource);
      const encodedKey = `car_prefetch_${encodeURIComponent(storageKey)}`;
      const rawKey = `car_prefetch_${storageKey}`;
      const normalizedImages = Array.isArray(images)
        ? images.filter(Boolean).slice(0, 12)
        : image
          ? [image]
          : [];

      const summary = {
        id: String(id),
        lot: lot ? String(lot) : undefined,
        make,
        model,
        year,
        price,
        image: normalizedImages[0],
        images: normalizedImages,
        vin,
        mileageLabel: mileage,
        transmission,
        fuel,
        color,
        condition,
        title,
        status,
        sale_status,
        final_price,
        insurance_v2,
        source,
        cachedAt: new Date().toISOString(),
      };

      const serialized = JSON.stringify(summary);
      sessionStorage.setItem(encodedKey, serialized);
      if (encodedKey !== rawKey) {
        sessionStorage.setItem(rawKey, serialized);
      }
    } catch (storageError) {
      console.warn("Failed to cache car summary before navigation", storageError);
    }
  }, [
    id,
    lot,
    make,
    model,
    year,
    price,
    image,
    images,
    vin,
    mileage,
    transmission,
    fuel,
    color,
    condition,
    title,
    status,
    sale_status,
    final_price,
    insurance_v2,
    source,
  ]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeToFavorites((state) => {
      if (cancelled) return;
      setUser(state.user);
      setIsFavorite(state.favorites.has(String(id)));
    });

    if (!cachedUserFavorites) {
      ensureUserFavorites().catch(() => {
        // Swallow auth errors silently
      });
    } else {
      setIsFavorite(cachedUserFavorites.favorites.has(String(id)));
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [id]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isIntersecting) {
      setHasAnimatedIn(true);
    }
  }, [isIntersecting]);

  const normalizedSource = typeof source === 'string' ? source : '';
  const sourceBadgeLabel = normalizedSource
    ? (normalizedSource || '').toLowerCase() === 'encar'
      ? ''
      : (normalizedSource || '').toLowerCase().includes('kbc')
        ? 'KBC'
        : normalizedSource.toUpperCase()
    : null;
  const fuelDisplay = useMemo(() => localizeFuel(fuel, "sq"), [fuel]);

  // Determine accident status
  const hasAccidentData = insurance_v2 && typeof insurance_v2.accidentCnt === 'number';
  const isClean = hasAccidentData && insurance_v2.accidentCnt === 0;
  const hasAccident = hasAccidentData && insurance_v2.accidentCnt > 0;

  const isListView = viewMode === 'list';
  const badgeStyles = isListView
    ? {
      container: 'absolute top-0.5 left-0.5 z-10 flex flex-col gap-1',
      source: 'text-[8px] px-1 py-0 bg-background/80 backdrop-blur',
      clean: 'bg-green-600/95 text-white px-1.5 py-0.5 rounded text-[8px] font-semibold shadow flex items-center gap-0.5',
      accident: 'bg-orange-600/95 text-white px-1.5 py-0.5 rounded text-[8px] font-semibold shadow flex items-center gap-0.5'
    }
    : {
      container: 'absolute top-2 left-2 z-10 flex flex-col gap-1',
      source: 'text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur',
      clean: 'bg-green-600/95 text-white px-2 py-0.5 rounded text-[10px] font-semibold shadow flex items-center gap-1',
      accident: 'bg-orange-600/95 text-white px-2 py-0.5 rounded text-[10px] font-semibold shadow flex items-center gap-1'
    };

  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save favorite cars",
      });
      navigate("/auth");
      return;
    }

    const carId = String(id);

    try {
      if (isFavorite) {
        await supabase
          .from("favorite_cars")
          .delete()
          .eq("user_id", user.id)
          .eq("car_id", carId);

        setIsFavorite(false);

        const updatedFavorites =
          cachedUserFavorites && cachedUserFavorites.user?.id === user.id
            ? new Set(cachedUserFavorites.favorites)
            : new Set<string>();
        updatedFavorites.delete(carId);
        cachedUserFavorites = {
          user,
          favorites: updatedFavorites,
        };
        notifyFavoritesListeners(cachedUserFavorites);

        toast({
          title: "Removed from favorites",
          description: "Car removed from your favorites",
        });
      } else {
        await supabase.from("favorite_cars").insert({
          user_id: user.id,
          car_id: carId,
          car_make: make,
          car_model: model,
          car_year: year,
          car_price: price,
          car_image: image,
        });

        setIsFavorite(true);

        const updatedFavorites = new Set(
          cachedUserFavorites?.favorites ?? []
        );
        updatedFavorites.add(carId);
        cachedUserFavorites = {
          user,
          favorites: updatedFavorites,
        };
        notifyFavoritesListeners(cachedUserFavorites);

        toast({
          title: "Added to favorites",
          description: "Car saved to your favorites",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  }, [user, isFavorite, id, make, model, year, price, image, toast, navigate]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    persistCarPrefetch();

    // Save complete page state including scroll position and filter panel state
    const currentFilterPanelState = sessionStorage.getItem("mobile-filter-panel-state");
    setCompletePageState({
      url: window.location.pathname + window.location.search,
      scrollPosition: window.scrollY,
      filterPanelState: currentFilterPanelState ? JSON.parse(currentFilterPanelState) : false,
      timestamp: Date.now(),
    });

    // Close filter panel when navigating to car details (if it's open)
    sessionStorage.setItem("mobile-filter-panel-state", JSON.stringify(false));

    openCarDetailsInNewTab(lot ?? id);
  }, [persistCarPrefetch, setCompletePageState, lot, id]);

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    persistCarPrefetch();

    // Save complete page state including scroll position and filter panel state
    const currentFilterPanelState = sessionStorage.getItem("mobile-filter-panel-state");
    setCompletePageState({
      url: window.location.pathname + window.location.search,
      scrollPosition: window.scrollY,
      filterPanelState: currentFilterPanelState ? JSON.parse(currentFilterPanelState) : false,
      timestamp: Date.now(),
    });

    // Close filter panel when navigating to car details (if it's open)
    sessionStorage.setItem("mobile-filter-panel-state", JSON.stringify(false));

    openCarDetailsInNewTab(lot ?? id);
  }, [persistCarPrefetch, setCompletePageState, lot, id]);

  // Don't render content until intersection
  if (!isIntersecting) {
    return (
      <div
        ref={cardRef}
        className="glass-card rounded-lg overflow-hidden h-96 animate-pulse"
        style={{
          willChange: 'contents',
          containIntrinsicSize: '280px 360px'
        }}
      >
        <div className="h-72 bg-muted" />
        <div className="p-2 space-y-1">
          <div className="h-4 bg-muted/80 rounded w-3/4" />
          <div className="h-3 bg-muted/80 rounded w-1/2" />
          <div className="h-5 bg-muted/80 rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Don't render the component if it should be hidden
  if (hideSoldCar) {
    return null;
  }

  // List mode layout
  if (viewMode === "list") {
    return (
      <div
        ref={cardRef}
        className={cn(
          "glass-card group/card overflow-hidden cursor-pointer touch-manipulation rounded-lg",
          "transition-transform duration-300 ease-emphasized will-change-transform",
          hasAnimatedIn && "motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:ease-emphasized",
          "hover:-translate-y-0.5 hover:shadow-lg"
        )}
        onClick={handleCardClick}
      >
        <div className="flex flex-row gap-2 p-2">
      <div className="relative bg-muted overflow-hidden flex-shrink-0 rounded-md w-20 h-16 sm:w-24 sm:h-20">
        {sourceBadgeLabel && (
          <div className={badgeStyles.container}>
            <Badge variant="outline" className={badgeStyles.source}>
              {sourceBadgeLabel}
            </Badge>
          </div>
        )}
        
        {/* Accident Badge - Small Circle on Right */}
        {isClean && (
          <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shadow-lg z-10">
            <ShieldCheck className="h-3 w-3 text-white" />
          </div>
        )}
            {image || (images && images.length > 0) ? (
              <img
                src={image || images?.[0]}
                alt={`${year} ${make} ${model}`}
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-300 ease-out",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                  setImageLoaded(true);
                }}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {lot && (
              <div className="absolute bottom-1 right-1 rounded text-[8px] font-bold bg-gradient-to-r from-primary to-primary/80 px-1 py-0.5 text-primary-foreground shadow-md backdrop-blur-sm">
                {lot}
              </div>
            )}
            {user && (
              <button
                onClick={handleFavoriteToggle}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white shadow transition-all duration-200 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={cn(
                    "h-3 w-3",
                    isFavorite ? "fill-red-500 text-red-500" : "text-white"
                  )}
                />
              </button>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between gap-1 py-1">
            <div className="min-w-0 space-y-1">
              <h3 className="text-xs font-semibold leading-tight text-foreground line-clamp-1">
                {make} {formatModelName(model, make)}
              </h3>
              {title && title !== `${make} ${model}` && (
                <p className="text-[11px] text-muted-foreground line-clamp-1">{title}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                {year && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Car className="h-3 w-3 text-muted-foreground" />
                    {year}
                  </span>
                )}
                {mileage && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    {mileage}
                  </span>
                )}
                {fuelDisplay && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Fuel className="h-3 w-3 text-muted-foreground" />
                    {fuelDisplay}
                  </span>
                )}
                {transmission && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Settings className="h-3 w-3 text-muted-foreground" />
                    {transmission}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-primary">
                  €{price.toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  port Durrës
                </p>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">KORAUTO</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid mode layout (default)
  return (
    <div
      ref={cardRef}
      className={cn(
        "glass-card group/card overflow-hidden cursor-pointer touch-manipulation rounded-xl",
        "mobile-card-compact compact-modern-card car-card-container",
        "transition-transform duration-400 ease-emphasized will-change-transform",
        hasAnimatedIn && "motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 motion-safe:ease-emphasized",
        "hover:-translate-y-1 hover:shadow-xl"
      )}
      onClick={handleCardClick}
    >
      <div className="relative bg-muted overflow-hidden flex-shrink-0 rounded-lg aspect-[4/3] w-full">
        {sourceBadgeLabel && (
          <div className={badgeStyles.container}>
            <Badge variant="outline" className={`${badgeStyles.source}`}>
              {sourceBadgeLabel}
            </Badge>
          </div>
        )}
        
        {/* Accident Badge - Small Circle on Right */}
        {isClean && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shadow-lg z-10">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
        )}
        {/* Always show single image - swipe functionality removed from car cards */}
        {(image || (images && images.length > 0)) ? (
          <img
            src={image || images?.[0]}
            alt={`${year} ${make} ${model}`}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300 ease-out",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
              setImageLoaded(true);
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Car className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
          </div>
        )}

        {/* Lot Number Badge */}
        {lot && (
          <div className="absolute top-1 right-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-2 py-0.5 rounded-md text-xs font-bold shadow-md backdrop-blur-sm">
            {lot}
          </div>
        )}

        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-2 left-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        )}
      </div>

      {/* Content Section - 30% of card height, more compact */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="card-title text-sm font-bold text-foreground line-clamp-1 leading-tight">
            {make} {formatModelName(model, make)}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{title}</p>
          )}
        </div>

        {/* Vehicle Info - More compact layout */}
        <div className="mb-2 text-xs grid grid-cols-2 gap-x-2 gap-y-1">
          {mileage && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Gauge className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium text-foreground">{mileage}</span>
            </div>
          )}
          {year && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-foreground">{year}</span>
            </div>
          )}
          {fuelDisplay && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Fuel className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-foreground">{fuelDisplay}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-foreground">{transmission}</span>
            </div>
          )}
        </div>

        {/* Pricing Section - Better aligned */}
        <div className="mt-auto">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="card-price text-xl font-bold text-primary">
                €{price.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-muted-foreground text-right flex-shrink-0">
                KORAUTO
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LazyCarCard.displayName = 'LazyCarCard';

export default LazyCarCard;