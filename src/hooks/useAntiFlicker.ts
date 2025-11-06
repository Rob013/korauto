import { useEffect, useRef } from 'react';

/**
 * Hook to prevent image flickering on load
 * Encar.com-style smooth image appearance
 */
export const useAntiFlickerImage = (imageRef: React.RefObject<HTMLImageElement>) => {
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    // Start with opacity 0
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease-out';

    const handleLoad = () => {
      // Smooth fade-in when loaded
      requestAnimationFrame(() => {
        img.style.opacity = '1';
      });
    };

    // If already loaded
    if (img.complete && img.naturalHeight !== 0) {
      img.style.opacity = '1';
    } else {
      img.addEventListener('load', handleLoad);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
    };
  }, [imageRef]);
};

/**
 * Hook to prevent component mount flickering
 */
export const useAntiFlickerMount = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // GPU acceleration
    ref.current.style.transform = 'translate3d(0, 0, 0)';
    ref.current.style.backfaceVisibility = 'hidden';
    
    // Smooth fade-in
    ref.current.style.opacity = '0';
    ref.current.style.transition = 'opacity 0.2s ease-out';
    
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.style.opacity = '1';
      }
    });
  }, []);

  return ref;
};

/**
 * Hook to optimize scroll performance
 */
export const useScrollOptimization = (containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply encar.com-style scroll optimization
    container.style.transform = 'translate3d(0, 0, 0)';
    container.style.backfaceVisibility = 'hidden';
    container.style.willChange = 'scroll-position';
    (container.style as any).webkitOverflowScrolling = 'touch';
    container.style.overscrollBehavior = 'contain';

    // Cleanup will-change after scroll stops
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        container.style.willChange = 'auto';
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [containerRef]);
};

/**
 * Hook to optimize card animations
 */
export const useCardOptimization = (cardRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // GPU acceleration
    card.style.transform = 'translate3d(0, 0, 0)';
    card.style.backfaceVisibility = 'hidden';
    card.style.contain = 'layout style paint';

    // Add will-change only on hover
    const handleMouseEnter = () => {
      card.style.willChange = 'transform, box-shadow';
    };

    const handleMouseLeave = () => {
      setTimeout(() => {
        card.style.willChange = 'auto';
      }, 300);
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cardRef]);
};
