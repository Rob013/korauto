import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => prev + 90);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handlePrevImage = () => {
    if (images.length > 1 && onImageChange && currentIndex > 0) {
      onImageChange(currentIndex - 1);
      handleReset();
    }
  };

  const handleNextImage = () => {
    if (images.length > 1 && onImageChange && currentIndex < images.length - 1) {
      onImageChange(currentIndex + 1);
      handleReset();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
    if (e.key === 'Escape') onClose();
  };

  // Setup swipe gestures for mobile - always call the hook with stable functions
  useSwipeGesture(imageContainerRef, {
    onSwipeLeft: images.length > 1 && onImageChange ? handleNextImage : () => {},
    onSwipeRight: images.length > 1 && onImageChange ? handlePrevImage : () => {},
    minSwipeDistance: 50,
    maxVerticalDistance: 100
  });

  // Add keyboard listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
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
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextImage}
                disabled={currentIndex === images.length - 1}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white disabled:opacity-30"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-black/50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-white hover:bg-white/20 px-3"
            >
              Reset
            </Button>
          </div>

          {/* Image Container with swipe support */}
          <div ref={imageContainerRef} className="flex items-center justify-center">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* Image counter and zoom indicator */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded flex flex-col gap-1 text-sm">
            <div>{Math.round(zoom * 100)}%</div>
            {images.length > 1 && (
              <div>{currentIndex + 1} / {images.length}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};