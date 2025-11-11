import * as React from "react";

interface ViewportSize {
  width: number;
  height: number;
  scale: number;
}

const DEFAULT_VIEWPORT: ViewportSize = {
  width: 1280,
  height: 720,
  scale: 1,
};

const getViewportSize = (): ViewportSize => {
  if (typeof window === "undefined") {
    return DEFAULT_VIEWPORT;
  }

  const visualViewport = window.visualViewport;

  if (visualViewport) {
    return {
      width: Math.max(visualViewport.width ?? window.innerWidth, 0),
      height: Math.max(visualViewport.height ?? window.innerHeight, 0),
      scale: visualViewport.scale ?? window.devicePixelRatio ?? 1,
    };
  }

  return {
    width: Math.max(window.innerWidth, 0),
    height: Math.max(window.innerHeight, 0),
    scale: window.devicePixelRatio ?? 1,
  };
};

/**
 * React hook that keeps track of the current viewport size, with support for
 * pinch-zoom aware browsers via `window.visualViewport`. The hook is throttled
 * to animation frames to avoid layout thrashing when users zoom in/out.
 */
export const useViewportSize = (): ViewportSize => {
  const [viewport, setViewport] = React.useState<ViewportSize>(() => getViewportSize());

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let rafId: number | null = null;

    const update = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setViewport((prev) => {
          const next = getViewportSize();
          if (
            prev.width === next.width &&
            prev.height === next.height &&
            prev.scale === next.scale
          ) {
            return prev;
          }
          return next;
        });
      });
    };

    const cleanup = () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      const vv = window.visualViewport;
      if (vv && typeof vv.removeEventListener === "function") {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };

    update();

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);

    const visualViewport = window.visualViewport;
    if (visualViewport && typeof visualViewport.addEventListener === "function") {
      visualViewport.addEventListener("resize", update);
      // Some browsers (Safari) only emit `scroll` on pinch-zoom.
      visualViewport.addEventListener("scroll", update);
    }

    return cleanup;
  }, []);

  return viewport;
};

export default useViewportSize;
