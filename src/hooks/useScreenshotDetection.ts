import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect when a user is taking a screenshot on mobile devices
 * Uses various detection methods including visibility change, beforeprint, and user interaction patterns
 */
export function useScreenshotDetection() {
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Detect screenshot using multiple methods
  useEffect(() => {
    if (!isMobile) return;

    let screenshotTimeout: NodeJS.Timeout;
    let isDetecting = false;

    // Method 1: Detect rapid visibility changes (common on mobile when taking screenshots)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden, might be taking screenshot
        isDetecting = true;
        screenshotTimeout = setTimeout(() => {
          if (isDetecting) {
            setIsScreenshotMode(true);
            // Auto-exit screenshot mode after 3 seconds
            setTimeout(() => {
              setIsScreenshotMode(false);
              isDetecting = false;
            }, 3000);
          }
        }, 100);
      } else {
        // Page became visible again
        if (isDetecting) {
          clearTimeout(screenshotTimeout);
          isDetecting = false;
          // Brief delay to allow screenshot to complete
          setTimeout(() => {
            setIsScreenshotMode(false);
          }, 500);
        }
      }
    };

    // Method 2: Detect beforeprint event (some mobile browsers trigger this for screenshots)
    const handleBeforePrint = () => {
      setIsScreenshotMode(true);
      setTimeout(() => setIsScreenshotMode(false), 2000);
    };

    // Method 3: Detect rapid touch events that might indicate screenshot gesture
    let touchStartTime = 0;
    let touchCount = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartTime = Date.now();
      touchCount = e.touches.length;
    };

    const handleTouchEnd = () => {
      const touchDuration = Date.now() - touchStartTime;
      // Detect multi-touch or long touch that might be screenshot gesture
      if (touchCount >= 2 || touchDuration > 1000) {
        setIsScreenshotMode(true);
        setTimeout(() => setIsScreenshotMode(false), 2000);
      }
    };

    // Method 4: Detect when user scrolls to top and holds (common before taking screenshots)
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (window.scrollY === 0) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          // User has been at top for 1 second, might be preparing for screenshot
          setIsScreenshotMode(true);
          setTimeout(() => setIsScreenshotMode(false), 2000);
        }, 1000);
      } else {
        clearTimeout(scrollTimeout);
        setIsScreenshotMode(false);
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeprint', handleBeforePrint);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeprint', handleBeforePrint);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(screenshotTimeout);
      clearTimeout(scrollTimeout);
    };
  }, [isMobile]);

  // Manual toggle for testing
  const toggleScreenshotMode = useCallback(() => {
    setIsScreenshotMode(prev => !prev);
  }, []);

  return {
    isScreenshotMode,
    isMobile,
    toggleScreenshotMode
  };
}