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

  // Debug logging
  useEffect(() => {
    console.log('🖼️ ImageZoom component - isOpen:', isOpen, 'src:', src);
  }, [isOpen, src]);

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

  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Render image content function
  const renderImageContent = () => (
    <>
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close image"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-1/2 top-1/2 transform -translate-x-16 -translate-y-1/2 z-10 text-white hover:bg-white/20"
            onClick={handlePrevImage}
            disabled={currentIndex === 0}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-1/2 top-1/2 transform translate-x-4 -translate-y-1/2 z-10 text-white hover:bg-white/20"
            onClick={handleNextImage}
            disabled={currentIndex === images.length - 1}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 z-10 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Main image */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="max-w-[95vw] max-h-[95vh] object-contain"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          touchAction: zoom > 1 ? 'pan-x pan-y' : 'none',
          transformOrigin: 'center center',
          position: 'relative',
          margin: 'auto'
        }}
        draggable={false}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={handleZoomOut}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={handleReset}
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={handleZoomIn}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={handleRotate}
          aria-label="Rotate image"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    </>
  );

  if (!isOpen) return null;

  // Mobile fallback - render directly without Dialog
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}
        onClick={onClose}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {renderImageContent()}
        </div>
      </div>
    );
  }

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
        onPointerDownOutside={(e) => {
          e.preventDefault();
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onClose();
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
          {renderImageContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};