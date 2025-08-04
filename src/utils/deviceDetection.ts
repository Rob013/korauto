/**
 * Device detection utilities for optimal user experience
 */

/**
 * Detects if the current device is an iPhone
 * Uses multiple detection methods for accuracy
 */
export const isIPhone = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for iPhone in user agent
  const isIPhoneUA = /iphone/.test(userAgent);
  
  // Check for iOS but not iPad (since iPad has different interaction patterns)
  const isIOS = /iphone|ipod/.test(userAgent) && !window.MSStream;
  
  // Additional check for iPhone-specific features
  const isIPhoneScreen = window.screen && (
    (window.screen.height === 812 && window.screen.width === 375) || // iPhone X/XS/11 Pro
    (window.screen.height === 896 && window.screen.width === 414) || // iPhone XR/11/XS Max/11 Pro Max
    (window.screen.height === 844 && window.screen.width === 390) || // iPhone 12/13/14
    (window.screen.height === 926 && window.screen.width === 428) || // iPhone 12/13/14 Pro Max
    (window.screen.height === 932 && window.screen.width === 430) || // iPhone 14 Plus
    (window.screen.height === 852 && window.screen.width === 393) || // iPhone 14 Pro
    (window.screen.height === 956 && window.screen.width === 430) || // iPhone 14 Pro Max
    (window.screen.height === 568 && window.screen.width === 320) || // iPhone 5/5S/SE
    (window.screen.height === 667 && window.screen.width === 375) || // iPhone 6/7/8
    (window.screen.height === 736 && window.screen.width === 414)    // iPhone 6/7/8 Plus
  );
  
  return isIPhoneUA || isIOS || isIPhoneScreen;
};

/**
 * Detects if the current device is mobile (tablet or phone)
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
};

/**
 * Detects if the current device supports touch
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};