import { useEffect, useRef, useState } from 'react';

interface UseImageSwipeOptions {
  images: string[];
  onImageChange?: (index: number) => void;
}

export const useImageSwipe = ({ images, onImageChange }: UseImageSwipeOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const pointerActive = useRef(false);
  const pointerStartX = useRef(0);
  const pointerLastX = useRef(0);
  const preventClickRef = useRef(false);
  const clickGuardTimeout = useRef<number | null>(null);

  const goToNext = () => {
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIndex);
    onImageChange?.(nextIndex);
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(prevIndex);
    onImageChange?.(prevIndex);
  };

  const goToIndex = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      onImageChange?.(index);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const evaluateSwipe = (deltaX: number) => {
      const swipeThreshold = 50;
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          goToNext();
        } else {
          goToPrevious();
        }
        preventClickRef.current = true;
        if (clickGuardTimeout.current) {
          window.clearTimeout(clickGuardTimeout.current);
        }
        clickGuardTimeout.current = window.setTimeout(() => {
          preventClickRef.current = false;
          clickGuardTimeout.current = null;
        }, 150);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      evaluateSwipe(touchStartX.current - touchEndX.current);
    };

      const handlePointerDown = (e: PointerEvent) => {
        if ((e.pointerType as string | undefined) === "touch") {
          return;
        }
        pointerActive.current = true;
        pointerStartX.current = e.clientX;
        pointerLastX.current = e.clientX;
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
        evaluateSwipe(pointerStartX.current - pointerLastX.current);
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
    };
  }, [currentIndex, images.length]);

  return {
    currentIndex,
    containerRef,
    goToNext,
    goToPrevious,
    goToIndex,
    currentImage: images[currentIndex],
    hasNext: currentIndex < images.length - 1,
    hasPrevious: currentIndex > 0,
    isClickAllowed: () => !preventClickRef.current,
  };
};