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

  // Reset zoom and rotation when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [currentIndex, isOpen]);

  // Reset zoom and rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black border-0 z-50"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: 0,
          padding: 0,
          zIndex: 9999,
          transform: 'none',
          inset: 0
        }}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            overflow: 'hidden',
            margin: 0,
            padding: 0
          }}
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
                  className="absolute left-4 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 z-50 bg-black/70 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/20 h-12 w-12 touch-manipulation"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextImage}
                  disabled={currentIndex === images.length - 1}
                  className="absolute right-4 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 z-50 bg-black/70 hover:bg-black/90 text-white disabled:opacity-20 disabled:cursor-not-allowed border border-white/20 h-12 w-12 touch-manipulation"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

          {/* Controls - Improved design and accessibility */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-1 bg-black/80 rounded-xl p-2 border border-white/30 backdrop-blur-md shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20 touch-manipulation h-10 w-10"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20 touch-manipulation h-10 w-10"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20 touch-manipulation h-10 w-10"
              aria-label="Rotate image"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-white hover:bg-white/20 px-4 touch-manipulation h-10 text-sm font-medium"
              aria-label="Reset zoom and rotation"
            >
              Reset
            </Button>
          </div>

          {/* Image Container - Centered image */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100vw',
              height: '100vh',
              position: 'fixed',
              top: 0,
              left: 0
            }}
          >
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain transition-transform duration-300 select-none"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                touchAction: zoom > 1 ? 'pan-x pan-y' : 'none',
                transformOrigin: 'center center',
                maxWidth: '95vw',
                maxHeight: '95vh',
                width: 'auto',
                height: 'auto',
                position: 'relative',
                margin: 'auto'
              }}
              draggable={false}
            />
          </div>

          {/* Image counter and zoom indicator - Improved design */}
          <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-3 rounded-xl flex flex-col gap-1 text-sm border border-white/30 backdrop-blur-md shadow-xl">
            <div className="font-bold text-base">{Math.round(zoom * 100)}%</div>
            {images.length > 1 && (
              <div className="text-xs opacity-90 font-medium">{currentIndex + 1} / {images.length}</div>
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