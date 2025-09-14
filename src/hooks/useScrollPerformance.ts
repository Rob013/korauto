/**
 * Enhanced Scroll Performance Hook
 * Optimizes scroll performance with throttling, momentum, and smooth behavior
 */

import { useEffect, useRef, useCallback } from 'react';
import { throttle, debounce } from '@/utils/performance';

export interface UseScrollPerformanceOptions {
  throttleMs?: number;
  debounceMs?: number;
  enableMomentum?: boolean;
  enableVirtualization?: boolean;
  onScroll?: (scrollData: ScrollData) => void;
  onScrollEnd?: (scrollData: ScrollData) => void;
}

export interface ScrollData {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
  velocity: number;
  isAtTop: boolean;
  isAtBottom: boolean;
  isAtLeft: boolean;
  isAtRight: boolean;
  deltaY: number;
  deltaX: number;
}

export const useScrollPerformance = (options: UseScrollPerformanceOptions = {}) => {
  const {
    throttleMs = 16, // 60fps
    debounceMs = 150,
    enableMomentum = true,
    enableVirtualization = false,
    onScroll,
    onScrollEnd
  } = options;

  const scrollRef = useRef<HTMLElement | null>(null);
  const scrollDataRef = useRef<ScrollData>({
    x: 0,
    y: 0,
    direction: 'none',
    velocity: 0,
    isAtTop: true,
    isAtBottom: false,
    isAtLeft: true,
    isAtRight: false,
    deltaY: 0,
    deltaX: 0
  });
  const lastScrollTime = useRef(0);
  const velocityHistory = useRef<number[]>([]);
  const frameId = useRef<number>();

  // Optimized scroll calculation
  const calculateScrollData = useCallback((element: HTMLElement): ScrollData => {
    const now = performance.now();
    const deltaTime = now - lastScrollTime.current || 16;
    lastScrollTime.current = now;

    const currentX = element.scrollLeft;
    const currentY = element.scrollTop;
    const maxScrollX = element.scrollWidth - element.clientWidth;
    const maxScrollY = element.scrollHeight - element.clientHeight;

    const deltaX = currentX - scrollDataRef.current.x;
    const deltaY = currentY - scrollDataRef.current.y;

    // Calculate velocity (pixels per second)
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (deltaTime / 1000);
    
    // Track velocity history for smoothing
    velocityHistory.current.push(velocity);
    if (velocityHistory.current.length > 5) {
      velocityHistory.current.shift();
    }

    // Calculate average velocity for smoother results
    const avgVelocity = velocityHistory.current.reduce((a, b) => a + b, 0) / velocityHistory.current.length;

    // Determine scroll direction
    let direction: ScrollData['direction'] = 'none';
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      direction = deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'none';
    } else if (Math.abs(deltaX) > 0) {
      direction = deltaX > 0 ? 'right' : 'left';
    }

    const scrollData: ScrollData = {
      x: currentX,
      y: currentY,
      direction,
      velocity: avgVelocity,
      isAtTop: currentY <= 1,
      isAtBottom: currentY >= maxScrollY - 1,
      isAtLeft: currentX <= 1,
      isAtRight: currentX >= maxScrollX - 1,
      deltaY,
      deltaX
    };

    scrollDataRef.current = scrollData;
    return scrollData;
  }, []);

  // Throttled scroll handler for smooth performance
  const throttledScrollHandler = useCallback(
    throttle((element: HTMLElement) => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }

      frameId.current = requestAnimationFrame(() => {
        const scrollData = calculateScrollData(element);
        onScroll?.(scrollData);
      });
    }, throttleMs, true), // Use animation frame throttling
    [calculateScrollData, onScroll, throttleMs]
  );

  // Debounced scroll end handler
  const debouncedScrollEndHandler = useCallback(
    debounce((element: HTMLElement) => {
      const scrollData = calculateScrollData(element);
      velocityHistory.current = []; // Reset velocity history
      onScrollEnd?.(scrollData);
    }, debounceMs),
    [calculateScrollData, onScrollEnd, debounceMs]
  );

  // Setup scroll listeners with performance optimizations
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Add performance optimizations
    element.style.scrollBehavior = 'smooth';
    
    // Enable hardware acceleration for better scroll performance
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'scroll-position';

    // Enable momentum scrolling on iOS
    element.style.webkitOverflowScrolling = 'touch';

    // Optimize for scroll performance
    element.style.overscrollBehavior = 'contain';

    const handleScroll = () => {
      throttledScrollHandler(element);
      debouncedScrollEndHandler(element);
    };

    // Use passive listeners for better performance
    element.addEventListener('scroll', handleScroll, { passive: true });

    // Initialize scroll data
    calculateScrollData(element);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      
      // Cleanup performance optimizations
      element.style.willChange = 'auto';
      
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [throttledScrollHandler, debouncedScrollEndHandler, calculateScrollData]);

  // Scroll to position with smooth animation
  const scrollTo = useCallback((x: number, y: number, smooth = true) => {
    const element = scrollRef.current;
    if (!element) return;

    element.scrollTo({
      left: x,
      top: y,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Scroll to element with offset
  const scrollToElement = useCallback((
    selector: string | HTMLElement, 
    offset = 0, 
    smooth = true
  ) => {
    const element = scrollRef.current;
    if (!element) return;

    const targetElement = typeof selector === 'string' 
      ? element.querySelector(selector) as HTMLElement
      : selector;

    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const containerRect = element.getBoundingClientRect();
    
    const targetY = element.scrollTop + rect.top - containerRect.top - offset;

    scrollTo(element.scrollLeft, targetY, smooth);
  }, [scrollTo]);

  // Check if element is in viewport
  const isElementInView = useCallback((
    selector: string | HTMLElement,
    threshold = 0
  ): boolean => {
    const element = scrollRef.current;
    if (!element) return false;

    const targetElement = typeof selector === 'string'
      ? element.querySelector(selector) as HTMLElement
      : selector;

    if (!targetElement) return false;

    const rect = targetElement.getBoundingClientRect();
    const containerRect = element.getBoundingClientRect();

    return (
      rect.top >= containerRect.top - threshold &&
      rect.bottom <= containerRect.bottom + threshold &&
      rect.left >= containerRect.left - threshold &&
      rect.right <= containerRect.right + threshold
    );
  }, []);

  // Get current scroll percentage
  const getScrollPercentage = useCallback((): { x: number; y: number } => {
    const element = scrollRef.current;
    if (!element) return { x: 0, y: 0 };

    const maxScrollX = element.scrollWidth - element.clientWidth;
    const maxScrollY = element.scrollHeight - element.clientHeight;

    return {
      x: maxScrollX > 0 ? (element.scrollLeft / maxScrollX) * 100 : 0,
      y: maxScrollY > 0 ? (element.scrollTop / maxScrollY) * 100 : 0
    };
  }, []);

  return {
    scrollRef,
    scrollData: scrollDataRef.current,
    scrollTo,
    scrollToElement,
    isElementInView,
    getScrollPercentage
  };
};

export default useScrollPerformance;