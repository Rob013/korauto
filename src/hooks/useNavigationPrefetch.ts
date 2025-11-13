import { useEffect } from "react";

export type RoutePrefetcher = () => void | Promise<void>;
export type RoutePrefetchConfig = Record<string, RoutePrefetcher>;

interface UseNavigationPrefetchOptions {
  prefetchDelay?: number;
  warmupDelay?: number;
  disableOnSlowConnection?: boolean;
}

const SLOW_CONNECTION_TYPES = new Set(["slow-2g", "2g"]);

const isSlowConnection = () => {
  if (typeof navigator === "undefined" || !(navigator as any).connection) {
    return false;
  }

  const connection = (navigator as any).connection;
  return SLOW_CONNECTION_TYPES.has(connection?.effectiveType);
};

const normalizePathname = (pathname: string) => {
  if (!pathname) return pathname;
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

interface ResolvedPrefetcher {
  key: string;
  prefetcher: RoutePrefetcher;
}

const resolvePrefetcher = (path: string, config: RoutePrefetchConfig): ResolvedPrefetcher | undefined => {
  const normalizedPath = normalizePathname(path);

  if (config[normalizedPath]) {
    return { key: normalizedPath, prefetcher: config[normalizedPath] };
  }

  if (config[path]) {
    return { key: path, prefetcher: config[path] };
  }

  for (const [pattern, prefetcher] of Object.entries(config)) {
    if (pattern.endsWith('/*')) {
      const base = normalizePathname(pattern.slice(0, -2));
      if (normalizedPath.startsWith(base)) {
        return { key: pattern, prefetcher };
      }
    }
  }

  return undefined;
};

const findPrefetchTarget = (eventTarget: EventTarget | null): HTMLElement | null => {
  if (!(eventTarget instanceof HTMLElement)) {
    return null;
  }

  return eventTarget.closest('[data-prefetch-route], a[href]');
};

const extractRouteFromElement = (element: HTMLElement | null): string | null => {
  if (!element) {
    return null;
  }

  const explicitRoute = element.getAttribute("data-prefetch-route");
  if (explicitRoute) {
    return explicitRoute;
  }

  if (element instanceof HTMLAnchorElement) {
    try {
      const url = new URL(element.href, window.location.origin);
      if (url.origin === window.location.origin) {
        return url.pathname;
      }
    } catch (error) {
      // Ignore parsing errors for malformed URLs
      return null;
    }
  }

  return null;
};

export const useNavigationPrefetch = (
  config: RoutePrefetchConfig,
  options: UseNavigationPrefetchOptions = {}
) => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const {
      prefetchDelay = 120,
      warmupDelay = 240,
      disableOnSlowConnection = true,
    } = options;

    if (disableOnSlowConnection && isSlowConnection()) {
      return;
    }

    const prefetchedRoutes = new Set<string>();
    const activeTimers = new Map<EventTarget, number>();

    const runPrefetch = (routeKey: string, prefetcher: RoutePrefetcher) => {
      const execute = () => {
        try {
          const result = prefetcher();
          if (result instanceof Promise) {
            result.catch(() => {
              // Silently ignore failed prefetch attempts
            });
          }
        } catch (error) {
          // Ignore errors triggered during prefetch
        }
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(execute, { timeout: warmupDelay });
      } else {
        (window as any).setTimeout(execute, warmupDelay);
      }
    };

    const schedulePrefetch = (routeKey: string, target: EventTarget, prefetcher: RoutePrefetcher) => {
      if (prefetchedRoutes.has(routeKey) || activeTimers.has(target)) {
        return;
      }

      const timerId = window.setTimeout(() => {
        prefetchedRoutes.add(routeKey);
        activeTimers.delete(target);
        runPrefetch(routeKey, prefetcher);
      }, prefetchDelay);

      activeTimers.set(target, timerId);
    };

    const cancelScheduledPrefetch = (target: EventTarget | null) => {
      if (!target) return;
      const timerId = activeTimers.get(target);
      if (timerId) {
        window.clearTimeout(timerId);
        activeTimers.delete(target);
      }
    };

    const handleInteraction = (event: Event) => {
      const target = findPrefetchTarget(event.target);
      if (!target) {
        return;
      }

      const route = extractRouteFromElement(target);
      if (!route) {
        return;
      }

      const resolved = resolvePrefetcher(route, config);
      if (!resolved) {
        return;
      }

      schedulePrefetch(resolved.key, target, resolved.prefetcher);
    };

    const handleCancel = (event: Event) => {
      const target = findPrefetchTarget(event.target);
      if (!target) {
        return;
      }

      cancelScheduledPrefetch(target);
    };

    document.addEventListener("pointerover", handleInteraction, true);
    document.addEventListener("focusin", handleInteraction, true);
    document.addEventListener("touchstart", handleInteraction, { passive: true, capture: true });

    document.addEventListener("pointerout", handleCancel, true);
    document.addEventListener("touchend", handleCancel, { passive: true, capture: true });
    document.addEventListener("touchcancel", handleCancel, { passive: true, capture: true });

    return () => {
      document.removeEventListener("pointerover", handleInteraction, true);
      document.removeEventListener("focusin", handleInteraction, true);
      document.removeEventListener("touchstart", handleInteraction, true);

      document.removeEventListener("pointerout", handleCancel, true);
      document.removeEventListener("touchend", handleCancel, true);
      document.removeEventListener("touchcancel", handleCancel, true);

      activeTimers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      activeTimers.clear();
    };
  }, [config, options.disableOnSlowConnection, options.prefetchDelay, options.warmupDelay]);
};

export default useNavigationPrefetch;
