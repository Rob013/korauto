import { useEffect, useRef, useState, useCallback } from 'react';

export interface ImageSwipeChangeMeta {
  direction: 'next' | 'previous' | 'jump';
  trigger: 'manual' | 'swipe';
}

interface UseImageSwipeOptions {
  images: string[];
  onImageChange?: (index: number, meta?: ImageSwipeChangeMeta) => void;
}

const clampOffset = (value: number, limit: number) => {
  if (limit <= 0) return value;
  if (value > limit) return limit;
  if (value < -limit) return -limit;
  return value;
};

export const useImageSwipe = ({ images, onImageChange }: UseImageSwipeOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchGuardActivated = useRef(false);
  const pointerActive = useRef(false);
  const pointerStartX = useRef(0);
  const pointerLastX = useRef(0);
  const pointerStartY = useRef(0);
  const pointerLastY = useRef(0);
  const pointerGuardActivated = useRef(false);
  const preventClickRef = useRef(false);
  const clickGuardTimeout = useRef<number | null>(null);
  const containerWidthRef = useRef(0);
  const resetAnimationFrame = useRef<number | null>(null);

  const activateClickGuard = (duration = 180) => {
    preventClickRef.current = true;
    if (clickGuardTimeout.current) {
      window.clearTimeout(clickGuardTimeout.current);
    }
    clickGuardTimeout.current = window.setTimeout(() => {
      preventClickRef.current = false;
      clickGuardTimeout.current = null;
    }, duration);
  };

  const notifyChange = useCallback(
    (index: number, meta: ImageSwipeChangeMeta) => {
      onImageChange?.(index, meta);
    },
    [onImageChange],
  );

  const goToNext = useCallback(
    (trigger: 'manual' | 'swipe' = 'manual') => {
      setCurrentIndex((prev) => {
        if (images.length === 0) {
          return prev;
        }

        if (images.length === 1) {
          return prev;
        }

        const nextIndex = prev < images.length - 1 ? prev + 1 : 0;
        if (nextIndex !== prev) {
          notifyChange(nextIndex, { direction: 'next', trigger });
        }
        return nextIndex;
      });
    },
    [images.length, notifyChange],
  );

  const goToPrevious = useCallback(
    (trigger: 'manual' | 'swipe' = 'manual') => {
      setCurrentIndex((prev) => {
        if (images.length === 0) {
          return prev;
        }

        if (images.length === 1) {
          return prev;
        }

        const prevIndex = prev > 0 ? prev - 1 : images.length - 1;
        if (prevIndex !== prev) {
          notifyChange(prevIndex, { direction: 'previous', trigger });
        }
        return prevIndex;
      });
    },
    [images.length, notifyChange],
  );

  const goToIndex = useCallback(
    (index: number, trigger: 'manual' | 'swipe' = 'manual') => {
      if (index < 0 || index >= images.length) {
        return;
      }

      setCurrentIndex((prev) => {
        if (index === prev) {
          return prev;
        }

        let direction: ImageSwipeChangeMeta['direction'] = 'jump';
        if (index > prev) {
          direction = 'next';
        } else if (index < prev) {
          direction = 'previous';
        }

        notifyChange(index, { direction, trigger });
        return index;
      });
    },
    [images.length, notifyChange],
  );

  const currentImage = images[currentIndex] ?? images[0] ?? '';

  const scheduleResetOffset = useCallback(() => {
    setIsSwiping(false);

    if (typeof window === 'undefined') {
      setSwipeOffset(0);
      return;
    }

    if (resetAnimationFrame.current) {
      window.cancelAnimationFrame(resetAnimationFrame.current);
    }

    resetAnimationFrame.current = window.requestAnimationFrame(() => {
      setSwipeOffset(0);
      resetAnimationFrame.current = null;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const evaluateSwipe = (deltaX: number) => {
      const width = containerWidthRef.current || container.offsetWidth || 0;
      const baseThreshold = 50;
      const dynamicThreshold = width > 0 ? Math.min(width * 0.2, 120) : baseThreshold;
      const threshold = Math.max(baseThreshold, dynamicThreshold);

      if (deltaX <= -threshold) {
        goToNext('swipe');
        return true;
      }

      if (deltaX >= threshold) {
        goToPrevious('swipe');
        return true;
      }

      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchGuardActivated.current = false;
      containerWidthRef.current = container.offsetWidth;
      setIsSwiping(true);
      setSwipeOffset(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        if (absDeltaX > 6 && e.cancelable) {
          e.preventDefault();
        }
        const width = containerWidthRef.current || container.offsetWidth || 0;
        setSwipeOffset(clampOffset(deltaX, width || Math.abs(deltaX)));
      } else if (Math.abs(deltaY) > 6 && !touchGuardActivated.current) {
        touchGuardActivated.current = true;
        activateClickGuard(200);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      const swiped = evaluateSwipe(deltaX);
      if (swiped) {
        activateClickGuard();
      } else {
        const movementThreshold = 10;
        if (absDeltaX > movementThreshold || absDeltaY > movementThreshold || touchGuardActivated.current) {
          activateClickGuard();
        }
      }
      touchGuardActivated.current = false;
      scheduleResetOffset();
    };

      const handlePointerDown = (e: PointerEvent) => {
        if ((e.pointerType as string | undefined) === "touch") {
          return;
        }
        pointerActive.current = true;
        pointerStartX.current = e.clientX;
        pointerLastX.current = e.clientX;
        pointerStartY.current = e.clientY;
        pointerLastY.current = e.clientY;
        pointerGuardActivated.current = false;
        containerWidthRef.current = container.offsetWidth;
        setIsSwiping(true);
        setSwipeOffset(0);
        if (typeof container.setPointerCapture === "function") {
          try {
            container.setPointerCapture(e.pointerId);
          } catch {
            // ignore capture errors
          }
        }
      };

      const handlePointerMove = (e: PointerEvent) => {
        if ((e.pointerType as string | undefined) === "touch") {
          return;
        }
        if (!pointerActive.current) return;
        pointerLastX.current = e.clientX;
        pointerLastY.current = e.clientY;
        if (!pointerGuardActivated.current) {
          const deltaX = e.clientX - pointerStartX.current;
          const deltaY = e.clientY - pointerStartY.current;
          if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 6) {
            pointerGuardActivated.current = true;
            setSwipeOffset(0);
          } else {
            const width = containerWidthRef.current || container.offsetWidth || 0;
            setSwipeOffset(clampOffset(deltaX, width || Math.abs(deltaX)));
          }
        }
      };

      const handlePointerUp = (e: PointerEvent) => {
        if ((e.pointerType as string | undefined) === "touch") {
          return;
        }
        if (!pointerActive.current) return;
        pointerActive.current = false;
        if (typeof container.releasePointerCapture === "function") {
          try {
            container.releasePointerCapture(e.pointerId);
          } catch {
            // ignore release errors
          }
        }
        const deltaX = pointerLastX.current - pointerStartX.current;
        const deltaY = pointerLastY.current - pointerStartY.current;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        const swiped = evaluateSwipe(deltaX);
        if (swiped) {
          activateClickGuard();
        } else {
          const movementThreshold = 6;
          if (pointerGuardActivated.current || absDeltaX > movementThreshold || absDeltaY > movementThreshold) {
            activateClickGuard();
          }
        }
        pointerGuardActivated.current = false;
        scheduleResetOffset();
      };

      const handlePointerCancel = (e: PointerEvent) => {
        if ((e.pointerType as string | undefined) === "touch") {
          return;
        }
        if (!pointerActive.current) return;
        pointerActive.current = false;
        if (typeof container.releasePointerCapture === "function") {
          try {
            container.releasePointerCapture(e.pointerId);
          } catch {
            // ignore release errors
          }
        }
        pointerGuardActivated.current = false;
        pointerActive.current = false;
        scheduleResetOffset();
      };

    // Add touch event listeners for mobile
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Add pointer event listeners for desktop drag support
      container.addEventListener("pointerdown", handlePointerDown);
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerup", handlePointerUp);
      container.addEventListener("pointercancel", handlePointerCancel);
      container.addEventListener("pointerleave", handlePointerUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerCancel);
      container.removeEventListener('pointerleave', handlePointerUp);
      if (clickGuardTimeout.current) {
        window.clearTimeout(clickGuardTimeout.current);
        clickGuardTimeout.current = null;
      }
      if (resetAnimationFrame.current) {
        window.cancelAnimationFrame(resetAnimationFrame.current);
        resetAnimationFrame.current = null;
      }
    };
  }, [goToNext, goToPrevious, scheduleResetOffset]);

  useEffect(() => {
    return () => {
      if (clickGuardTimeout.current) {
        window.clearTimeout(clickGuardTimeout.current);
        clickGuardTimeout.current = null;
      }
      if (resetAnimationFrame.current) {
        window.cancelAnimationFrame(resetAnimationFrame.current);
        resetAnimationFrame.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (images.length === 0) {
        return 0;
      }
      if (prev >= images.length) {
        return images.length - 1;
      }
      return prev;
    });
  }, [images.length]);

  return {
    currentIndex,
    containerRef,
    goToNext,
    goToPrevious,
    goToIndex,
    currentImage,
    hasNext: currentIndex < images.length - 1,
    hasPrevious: currentIndex > 0,
    isClickAllowed: () => !preventClickRef.current,
    swipeOffset,
    isSwiping,
  };
};
