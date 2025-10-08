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

    let touchStartY = 0;
    let isSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current) return;

      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

      // Only prevent default if horizontal swipe is dominant
      if (deltaX > deltaY && deltaX > 10) {
        isSwiping = true;
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;

      touchEndX.current = e.changedTouches[0].clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const deltaX = touchStartX.current - touchEndX.current;

      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    };

    // Use passive listeners by default, only prevent scroll when needed
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
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
  };
};