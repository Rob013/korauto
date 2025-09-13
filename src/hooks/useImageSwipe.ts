import { useEffect, useRef, useState, useCallback } from 'react';

interface UseImageSwipeOptions {
  images: string[];
  onImageChange?: (index: number) => void;
}

export const useImageSwipe = ({ images, onImageChange }: UseImageSwipeOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIndex);
    onImageChange?.(nextIndex);
    
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 600);
  }, [currentIndex, images.length, onImageChange, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(prevIndex);
    onImageChange?.(prevIndex);
    
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 600);
  }, [currentIndex, images.length, onImageChange, isTransitioning]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(index);
      onImageChange?.(index);
      
      // Reset transition state after animation completes
      setTimeout(() => setIsTransitioning(false), 600);
    }
  }, [images.length, onImageChange, isTransitioning]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const deltaX = touchStartX.current - touchEndX.current;

      if (Math.abs(deltaX) > swipeThreshold && !isTransitioning) {
        if (deltaX > 0) {
          // Swipe left - go to next image
          goToNext();
        } else {
          // Swipe right - go to previous image
          goToPrevious();
        }
      }
    };

    // Add touch event listeners for mobile
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToNext, goToPrevious, isTransitioning]);

  return {
    currentIndex,
    containerRef,
    goToNext,
    goToPrevious,
    goToIndex,
    currentImage: images[currentIndex],
    hasNext: currentIndex < images.length - 1,
    hasPrevious: currentIndex > 0,
    isTransitioning,
  };
};