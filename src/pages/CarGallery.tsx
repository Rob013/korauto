import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, ZoomIn, Download } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";

interface CarGalleryState {
  images: string[];
  carMake?: string;
  carModel?: string;
  carYear?: number;
  carLot?: string;
}

const CarGallery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  // Get gallery data from navigation state or fallback
  const galleryState = location.state as CarGalleryState;
  const images = useMemo(() => galleryState?.images || [], [galleryState?.images]);
  
  // If no gallery data is available, redirect back to car details
  useEffect(() => {
    if (!galleryState || !images.length) {
      navigate(`/car/${id}`, { replace: true });
    }
  }, [galleryState, images.length, id, navigate]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsZoomOpen(true);
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `car-${id}-image-${index + 1}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoBack = () => {
    navigate(`/car/${id}`);
  };

  if (!galleryState || !images.length) {
    return null; // Will redirect in useEffect
  }

  const carTitle = galleryState.carYear && galleryState.carMake && galleryState.carModel 
    ? `${galleryState.carYear} ${galleryState.carMake} ${galleryState.carModel}`
    : 'Car Images';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Car Details
              </Button>
              <div>
                <h1 className="text-xl font-bold">{carTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {images.length} image{images.length !== 1 ? 's' : ''}
                  {galleryState.carLot && ` • Lot #${galleryState.carLot}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Grid - Improved responsive design */}
      <div className="container-responsive py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">All Images</h2>
          <p className="text-muted-foreground">Click any image to view in full size</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={image}
                alt={`${carTitle} - Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
                loading="lazy"
              />
              
              {/* Image overlay with improved controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/95 hover:bg-white text-black shadow-lg hover:shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(index);
                    }}
                    aria-label={`View image ${index + 1} in full size`}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/95 hover:bg-white text-black shadow-lg hover:shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadImage(image, index);
                    }}
                    aria-label={`Download image ${index + 1}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Image number badge - Improved styling */}
              <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
                {index + 1}
              </div>
              
              {/* Loading indicator */}
              <div className="absolute inset-0 bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state - should not happen due to redirect logic */}
        {images.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No images available</p>
            <Button onClick={handleGoBack} className="mt-4">
              Back to Car Details
            </Button>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <ImageZoom
        src={images[selectedImageIndex] || ''}
        alt={`${carTitle} - Image ${selectedImageIndex + 1}`}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        images={images}
        currentIndex={selectedImageIndex}
        onImageChange={setSelectedImageIndex}
      />
    </div>
  );
};

export default CarGallery;