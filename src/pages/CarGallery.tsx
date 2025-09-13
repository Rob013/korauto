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

      {/* Gallery Grid */}
      <div className="container-responsive py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={image}
                alt={`${carTitle} - Image ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              
              {/* Image overlay with controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 hover:bg-white text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(index);
                    }}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 hover:bg-white text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadImage(image, index);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Image number badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
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