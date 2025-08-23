import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageSwipe } from '@/hooks/useImageSwipe';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  onImageChange?: (index: number) => void;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  className,
  showArrows = true,
  showDots = true,
  onImageChange,
}) => {
  const {
    currentIndex,
    containerRef,
    goToNext,
    goToPrevious,
    goToIndex,
    currentImage,
    hasNext,
    hasPrevious,
  } = useImageSwipe({ images, onImageChange });

  if (!images || images.length === 0) {
    return (
      <div className={cn('w-full h-full bg-muted flex items-center justify-center', className)}>
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn('w-full h-full relative', className)}>
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full group cursor-pointer', className)}
    >
      {/* Main Image */}
      <img
        src={currentImage}
        alt={`${alt} - Image ${currentIndex + 1} of ${images.length}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />

      {/* Navigation Arrows - Desktop */}
      {showArrows && images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 p-0 hidden sm:flex"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            disabled={!hasPrevious && images.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 p-0 hidden sm:flex"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            disabled={!hasNext && images.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Image Counter - Mobile */}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {currentIndex + 1}/{images.length}
      </div>

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/70'
              )}
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(index);
              }}
            />
          ))}
        </div>
      )}

      {/* Swipe Hint - Mobile only */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-2 py-1 rounded sm:hidden">
        Swipe to see more photos
      </div>
    </div>
  );
};