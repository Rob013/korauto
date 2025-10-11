import { useEffect, useRef, useState, useCallback } from 'react';
import { FrameRateOptimizer } from '@/utils/frameRateOptimizer';

/**
 * Hook for smooth, performance-optimized animations
 * Automatically adapts to device capabilities and user preferences
 */
export const useSmoothAnimations = () => {
  const [optimizer] = useState(() => FrameRateOptimizer.getInstance());
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'auto' | 'high' | 'balanced' | 'power-saver'>('auto');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(reducedMotionQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    reducedMotionQuery.addEventListener('change', handleChange);

    // Get current performance mode
    const config = optimizer.getConfig();
    setPerformanceMode(config.performanceMode);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleChange);
    };
  }, [optimizer]);

  /**
   * Smoothly animate a value using requestAnimationFrame
   */
  const animateValue = useCallback((
    from: number,
    to: number,
    duration: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) => {
    if (isReducedMotion) {
      onUpdate(to);
      onComplete?.();
      return;
    }

    const startTime = performance.now();
    const difference = to - from;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function based on performance mode
      const easedProgress = getEasingFunction(performanceMode)(progress);
      const currentValue = from + (difference * easedProgress);
      
      onUpdate(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [isReducedMotion, performanceMode]);

  /**
   * Smoothly animate element properties
   */
  const animateElement = useCallback((
    element: HTMLElement,
    properties: Record<string, { from: string | number; to: string | number }>,
    duration: number,
    onComplete?: () => void
  ) => {
    if (isReducedMotion) {
      Object.entries(properties).forEach(([prop, { to }]) => {
        element.style.setProperty(prop, String(to));
      });
      onComplete?.();
      return;
    }

    const startTime = performance.now();
    const animatedProperties = Object.entries(properties).map(([prop, { from, to }]) => ({
      prop,
      from: typeof from === 'number' ? from : parseFloat(String(from)),
      to: typeof to === 'number' ? to : parseFloat(String(to)),
      unit: typeof from === 'string' && from.includes('%') ? '%' : 
            typeof from === 'string' && from.includes('px') ? 'px' : ''
    }));

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = getEasingFunction(performanceMode)(progress);

      animatedProperties.forEach(({ prop, from, to, unit }) => {
        const currentValue = from + (to - from) * easedProgress;
        element.style.setProperty(prop, `${currentValue}${unit}`);
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [isReducedMotion, performanceMode]);

  /**
   * Create a smooth scroll animation
   */
  const smoothScroll = useCallback((
    targetY: number,
    duration: number = 600,
    onComplete?: () => void
  ) => {
    if (isReducedMotion) {
      window.scrollTo(0, targetY);
      onComplete?.();
      return;
    }

    const startY = window.scrollY;
    const difference = targetY - startY;

    animateValue(
      startY,
      targetY,
      duration,
      (value) => window.scrollTo(0, value),
      onComplete
    );
  }, [isReducedMotion, animateValue]);

  /**
   * Create a staggered animation for multiple elements
   */
  const staggerAnimation = useCallback((
    elements: HTMLElement[],
    animationFn: (element: HTMLElement, index: number) => void,
    staggerDelay: number = 100
  ) => {
    elements.forEach((element, index) => {
      setTimeout(() => {
        animationFn(element, index);
      }, index * staggerDelay);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    animateValue,
    animateElement,
    smoothScroll,
    staggerAnimation,
    isReducedMotion,
    performanceMode,
    optimizer
  };
};

/**
 * Get easing function based on performance mode
 */
function getEasingFunction(performanceMode: string) {
  switch (performanceMode) {
    case 'high':
      return (t: number) => t * t * (3 - 2 * t); // Smooth step
    case 'power-saver':
      return (t: number) => t; // Linear
    default:
      return (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Ease in-out
  }
}

/**
 * Hook for smooth filter panel animations
 */
export const useFilterPanelAnimations = () => {
  const { animateElement, staggerAnimation, isReducedMotion } = useSmoothAnimations();

  const slideInFilterPanel = useCallback((panel: HTMLElement) => {
    if (isReducedMotion) {
      panel.style.transform = 'translateX(0)';
      panel.style.opacity = '1';
      return;
    }

    // Reset initial state
    panel.style.transform = 'translateX(-100%)';
    panel.style.opacity = '0';
    panel.style.visibility = 'visible';

    // Animate in
    animateElement(
      panel,
      {
        transform: { from: 'translateX(-100%)', to: 'translateX(0)' },
        opacity: { from: 0, to: 1 }
      },
      400
    );
  }, [animateElement, isReducedMotion]);

  const slideOutFilterPanel = useCallback((panel: HTMLElement, onComplete?: () => void) => {
    if (isReducedMotion) {
      panel.style.transform = 'translateX(-100%)';
      panel.style.opacity = '0';
      onComplete?.();
      return;
    }

    animateElement(
      panel,
      {
        transform: { from: 'translateX(0)', to: 'translateX(-100%)' },
        opacity: { from: 1, to: 0 }
      },
      300,
      () => {
        panel.style.visibility = 'hidden';
        onComplete?.();
      }
    );
  }, [animateElement, isReducedMotion]);

  const animateFilterSections = useCallback((container: HTMLElement) => {
    const sections = Array.from(container.querySelectorAll('.filter-section')) as HTMLElement[];
    
    if (isReducedMotion) {
      sections.forEach(section => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      });
      return;
    }

    staggerAnimation(
      sections,
      (section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
          animateElement(
            section,
            {
              opacity: { from: 0, to: 1 },
              transform: { from: 'translateY(20px)', to: 'translateY(0)' }
            },
            300
          );
        });
      },
      100
    );
  }, [animateElement, staggerAnimation, isReducedMotion]);

  return {
    slideInFilterPanel,
    slideOutFilterPanel,
    animateFilterSections
  };
};
