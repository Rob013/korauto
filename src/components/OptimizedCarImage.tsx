import React, { useState, useEffect } from 'react';
import { Car } from 'lucide-react';

interface OptimizedCarImageProps {
  images?: string[];
  image?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

/**
 * Optimized car image component that handles real API images with proper fallbacks
 * - Supports both single image (image prop) and multiple images (images prop)
 * - Uses local placeholder images when external sources fail
 * - Provides proper loading states and error handling
 */
export const OptimizedCarImage: React.FC<OptimizedCarImageProps> = ({
  images,
  image,
  alt,
  className = '',
  fallbackIcon
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine the image source to use
  const allImages = images && images.length > 0 ? images : (image ? [image] : []);
  const currentImageSrc = allImages[currentImageIndex];

  // Reset state when images change
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    setCurrentImageIndex(0);
  }, [images, image]);

  // Generate a local placeholder image based on car details
  const getLocalPlaceholderImage = () => {
    // Extract car make from alt text for themed placeholder
    const carMake = alt.toLowerCase();
    
    // Use local assets or generate colored placeholder based on car make
    const colorMap: Record<string, string> = {
      'toyota': '#e53935',
      'honda': '#d32f2f', 
      'bmw': '#1976d2',
      'mercedes': '#424242',
      'audi': '#f57c00',
      'hyundai': '#7b1fa2',
      'kia': '#388e3c',
      'volkswagen': '#5d4037'
    };

    const make = Object.keys(colorMap).find(brand => carMake.includes(brand));
    const bgColor = make ? colorMap[make] : '#757575';
    
    // Create an SVG placeholder with brand color
    const svgPlaceholder = `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="${bgColor}" opacity="0.1"/>
        <g transform="translate(200,150)">
          <rect x="-80" y="-25" width="160" height="50" rx="8" fill="${bgColor}" opacity="0.2"/>
          <circle cx="-45" cy="15" r="12" fill="${bgColor}" opacity="0.3"/>
          <circle cx="45" cy="15" r="12" fill="${bgColor}" opacity="0.3"/>
          <text x="0" y="5" text-anchor="middle" fill="${bgColor}" font-family="Arial" font-size="14" font-weight="bold">${make ? make.toUpperCase() : 'CAR'}</text>
        </g>
      </svg>
    `)}`;

    return svgPlaceholder;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // If no images available or all failed, show fallback
  if (!currentImageSrc || (imageError && currentImageIndex >= allImages.length - 1)) {
    return (
      <div className={`w-full h-full bg-muted flex items-center justify-center ${className}`}>
        {fallbackIcon || <Car className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <Car className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      )}
      
      {/* Main image */}
      <img
        src={imageError ? getLocalPlaceholderImage() : currentImageSrc}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: isLoading ? 'none' : 'block' }}
      />

      {/* Multiple images indicator */}
      {allImages.length > 1 && !imageError && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
          {currentImageIndex + 1}/{allImages.length}
        </div>
      )}

      {/* Navigation for multiple images */}
      {allImages.length > 1 && !imageError && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => 
                prev > 0 ? prev - 1 : allImages.length - 1
              );
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => 
                prev < allImages.length - 1 ? prev + 1 : 0
              );
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

export default OptimizedCarImage;