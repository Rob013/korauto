import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const getIsMobile = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    const update = () => {
      setIsMobile(getIsMobile());
    };
    const supportsAddEventListener =
      typeof mediaQuery.addEventListener === "function";
    const supportsAddListener = typeof mediaQuery.addListener === "function";

    update();

    if (supportsAddEventListener) {
      mediaQuery.addEventListener("change", update);
    } else if (supportsAddListener) {
      mediaQuery.addListener(update);
    }
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      if (supportsAddEventListener) {
        mediaQuery.removeEventListener("change", update);
      } else if (supportsAddListener) {
        mediaQuery.removeListener(update);
      }
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobile;
}
