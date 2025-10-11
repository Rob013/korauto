import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageZoomProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  images?: string[];
  currentIndex?: number;
  onImageChange?: (index: number) => void;
}

export const ImageZoom = ({ src, alt, isOpen, onClose, images = [], currentIndex = 0, onImageChange }: ImageZoomProps) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => prev + 90);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handlePrevImage = useCallback(() => {
    if (images.length > 1 && onImageChange && currentIndex > 0) {
      onImageChange(currentIndex - 1);
      handleReset();
    }
  }, [images.length, onImageChange, currentIndex]);

  const handleNextImage = useCallback(() => {
    if (images.length > 1 && onImageChange && currentIndex < images.length - 1) {
      onImageChange(currentIndex + 1);
      handleReset();
    }
  }, [images.length, onImageChange, currentIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') handleZoomIn();
    if (e.key === '-') handleZoomOut();
  }, [handlePrevImage, handleNextImage, onClose]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Swipe detection - horizontal swipe with minimum distance and speed
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    const maxVerticalDeviation = 100;

    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaY) < maxVerticalDeviation &&
      deltaTime < maxSwipeTime
    ) {
      if (deltaX > 0) {
        // Swipe right - go to previous image
        handlePrevImage();
      } else {
        // Swipe left - go to next image
        handleNextImage();
      }
    }

    touchStartRef.current = null;
  }, [handlePrevImage, handleNextImage]);

  // Add keyboard listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Reset zoom and rotation when image changes
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [currentIndex, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black border-0 fixed inset-0">
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/70 hover:bg-black/90 text-white border border-white/20 touch-manipulation"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevImage}
                disabled={currentIndex === 0}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/70 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/20 h-12 w-12 touch-manipulation"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextImage}
                disabled={currentIndex === images.length - 1}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/70 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/20 h-12 w-12 touch-manipulation"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-black/70 rounded-lg p-2 border border-white/20 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20 touch-manipulation"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20 touch-manipulation"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20 touch-manipulation"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-white hover:bg-white/20 px-3 touch-manipulation hidden sm:flex"
            >
              Reset
            </Button>
          </div>

          {/* Image */}
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-300 select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              touchAction: zoom > 1 ? 'pan-x pan-y' : 'none',
            }}
            draggable={false}
          />

          {/* Image counter and zoom indicator */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg flex flex-col gap-1 text-sm border border-white/20 backdrop-blur-sm">
            <div className="font-semibold">{Math.round(zoom * 100)}%</div>
            {images.length > 1 && (
              <div className="text-xs opacity-80">{currentIndex + 1} / {images.length}</div>
            )}
          </div>

          {/* Swipe hint for mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full sm:hidden animate-fade-in">
              Swipe to navigate
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};