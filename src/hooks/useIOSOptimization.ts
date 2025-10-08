/**
 * iOS Performance Optimization Hook
 * Provides iOS-style smooth scrolling, momentum, and touch interactions
 */

import { useEffect, useCallback } from 'react';

export const useIOSOptimization = () => {
  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS || isSafari) {
      // Add iOS-specific class for styling
      document.documentElement.classList.add('ios-device');
      
      // Enable momentum scrolling
      (document.body.style as any).webkitOverflowScrolling = 'touch';
      
      // Enable passive touch listeners - don't prevent default to allow clicks
      let lastTouchY = 0;
      const handleTouchStart = (e: TouchEvent) => {
        lastTouchY = e.touches[0].clientY;
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        const currentY = e.touches[0].clientY;
        lastTouchY = currentY;
        // Note: Removed preventDefault to allow normal touch interactions
        // This enables clicks, taps, and scrolling to work properly
      };
      
      // Use passive: true to improve scroll performance and allow clicks
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.documentElement.classList.remove('ios-device');
      };
    }
  }, []);

  // Haptic feedback simulation for iOS
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const durations = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(durations[style]);
    }
  }, []);

  // Smooth scroll with iOS physics
  const smoothScrollTo = useCallback((targetY: number, duration = 600) => {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    const easeInOutQuart = (t: number): number => {
      return t < 0.5 
        ? 8 * t * t * t * t 
        : 1 - 8 * (--t) * t * t * t;
    };

    const scroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easing = easeInOutQuart(progress);
      
      window.scrollTo(0, startY + distance * easing);
      
      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(scroll);
  }, []);

  return {
    triggerHaptic,
    smoothScrollTo
  };
};

export default useIOSOptimization;
